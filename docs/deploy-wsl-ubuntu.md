# OpenClaw WSL Ubuntu 完整部署指南

本文档描述如何在 WSL Ubuntu 上从零部署 OpenClaw（使用自定义 fork 的 tgz 包）。

---

## 一、目标机器环境准备（WSL Ubuntu）

### 1.1 安装 Node.js 22+

```bash
# 检查是否已安装
node -v

# 如果未安装或版本 < 22，使用 NodeSource 安装
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v   # 应显示 v22.x.x 或更高
npm -v    # 应显示 10.x.x 或更高
```

### 1.2 安装必要系统依赖

```bash
sudo apt-get update
sudo apt-get install -y git curl wget build-essential
```

---

## 二、构建机器打包（Windows 开发机）

> 以下步骤在 Windows 开发机（有 openclaw 源码的机器）上执行。

### 2.1 构建 pi-mono（openclaw 依赖）

```powershell
cd E:\CursorRules\openclaw

# 构建 pi-mono 中 openclaw 需要的 4 个包（tui/ai/agent/coding-agent）
# 跳过 mom/web-ui/pods（Windows 不兼容且 openclaw 不需要）
.\scripts\build-pi-mono.ps1 -SkipGenerateModels

# 重新链接依赖
pnpm install
```

### 2.2 构建 openclaw

```powershell
# 1. 构建主代码
npx tsdown

# 2. 构建 Web 管理界面
node scripts/ui.js build

# 3. 运行构建脚本
node --import tsx scripts/canvas-a2ui-copy.ts
node --import tsx scripts/copy-hook-metadata.ts
node --import tsx scripts/write-build-info.ts
node --import tsx scripts/write-cli-compat.ts
```

### 2.3 打包（自动化脚本）

使用 `pack-openclaw.ps1` 脚本自动完成打包。脚本会：

1. 将 `file:` 引用临时改为 npm 版本号
2. 运行 `npm pack` 生成 openclaw tgz
3. 创建 `pi-mono-patch.tar.gz`（包含我们修改的 pi-mono dist 文件）
4. 自动恢复 `package.json`

```powershell
# 如果已经完成 2.1 和 2.2 的构建，加 -SkipBuild
.\scripts\pack-openclaw.ps1 -SkipBuild

# 输出两个文件：
#   openclaw-VERSION.tgz       (~19 MB) - 标准 openclaw 包
#   pi-mono-patch.tar.gz       (~2 MB)  - 修改过的 pi-mono 文件覆盖层
```

---

## 三、局域网传输

### 3.1 在构建机器上启动临时 HTTP 服务

```powershell
# 替换 <tgz文件名> 为实际文件名，如 openclaw-2026.2.13.tgz
node -e "const f='openclaw-2026.2.13.tgz';require('http').createServer((q,r)=>{if(q.url==='/'+f){r.setHeader('Content-Disposition','attachment');require('fs').createReadStream(f).pipe(r)}else{r.end('GET /'+f)}}).listen(9876,'0.0.0.0',()=>console.log('Ready: http://192.168.50.22:9876/'+f))"
```

> 注意：`192.168.50.22` 是构建机器的局域网 IP，请根据实际情况修改。
> 查看 IP：`Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -eq "WLAN" }`

### 3.2 在目标 WSL 上下载

```bash
wget http://192.168.50.22:9876/openclaw-2026.2.13.tgz -O /tmp/openclaw-2026.2.13.tgz
```

### 3.3 传输完成后关闭 HTTP 服务

在构建机器上按 `Ctrl+C` 关闭临时服务。

---

## 四、目标机器安装

### 4.1 安装 openclaw（2 步）

```bash
cd ~

# 步骤 1: 安装 openclaw（--ignore-scripts 跳过 native 模块编译）
sudo rm -rf /usr/lib/node_modules/openclaw
sudo npm install -g /tmp/openclaw-VERSION.tgz --ignore-scripts

# 步骤 2: 覆盖 pi-mono 修改文件（repairRoleOrdering、jsonrepair 等）
sudo tar -xzf /tmp/pi-mono-patch.tar.gz -C /usr/lib/node_modules/openclaw/node_modules/

# 刷新 shell 缓存并验证
hash -r
openclaw --version    # 应显示对应版本号
```

> **注意**: 旧版本（cd96e900 之前）需要额外两个手动步骤：
>
> - **ESM exports patch**: jiti 加载插件时需要 `default` export 条件，需批量 patch 约 64 个包。
>   已在 `src/plugins/loader.ts` 中通过 `tryNative: true` 修复（jiti 先尝试原生 ESM import）。
> - **模板路径 symlink**: `resolveOpenClawPackageRoot` 在 npm global install 下可能返回 null，
>   导致模板路径回退到 `cwd`。已在 `src/agents/workspace-templates.ts` 中通过添加
>   `DIST_TEMPLATE_DIR`（从 `dist/` 向上一级）作为候选路径修复。
>
> 如果使用旧版本仍需手动执行这两步，参见下方"故障排除"章节。

### 4.2 首次配置（交互式向导）

```bash
openclaw setup
```

向导会引导你完成：

1. **Gateway 模式**：选择 `local`
2. **AI Provider**：配置 API Key（OpenAI / Anthropic / Google 等）
3. **频道**：配置 Telegram / Discord / Slack 等聊天频道
4. **守护进程**：是否安装 systemd 服务

### 4.3 手动配置（可选）

如果不想用向导，可以手动设置：

```bash
# 设置 gateway 模式为 local（必须）
openclaw config set gateway.mode local

# 设置 AI provider API key（示例：OpenAI）
openclaw config set providers.openai.apiKey "sk-your-key-here"

# 配置 Telegram 频道（示例）
openclaw config set channels.telegram.enabled true
openclaw config set channels.telegram.botToken "123456:ABC-DEF..."

# 配置 Discord 频道（示例）
openclaw config set channels.discord.enabled true
openclaw config set channels.discord.token "your-discord-bot-token"

# 调整历史消息限制（避免 context 溢出）
openclaw config set channels.discord.dmHistoryLimit 15
openclaw config set agents.defaults.compaction.maxHistoryShare 0.3
```

配置文件位于：`~/.openclaw/openclaw.json`

---

## 五、启动服务

### 5.1 前台运行（调试用）

```bash
# 基本前台运行
openclaw gateway run

# 启用详细日志输出（推荐调试时使用）
openclaw gateway run --verbose

# 详细日志 + 完整 WebSocket 日志
openclaw gateway run --verbose --ws-log full

# 详细日志 + 紧凑 WebSocket 日志
openclaw gateway run --verbose --compact
```

### 5.2 后台运行（推荐生产环境）

```bash
# 使用 nohup 后台运行
nohup openclaw gateway run --bind loopback --port 18789 > /tmp/openclaw-gateway.log 2>&1 &

# 查看日志
tail -f /tmp/openclaw-gateway.log
```

### 5.3 安装为 systemd 服务（推荐）

```bash
# 通过 onboard 安装守护进程
openclaw onboard --install-daemon

# 或手动创建 systemd 服务
sudo tee /etc/systemd/system/openclaw-gateway.service > /dev/null <<'EOF'
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=liu
ExecStart=/usr/bin/openclaw gateway run --bind loopback --port 18789
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable openclaw-gateway
sudo systemctl start openclaw-gateway

# 查看状态
sudo systemctl status openclaw-gateway
```

---

## 六、验证部署

```bash
# 检查 gateway 状态
openclaw status

# 检查频道连接状态
openclaw channels status

# 运行诊断
openclaw doctor

# 查看日志
openclaw logs --follow

# 打开 Web 管理界面（如果启用了 control-ui）
openclaw dashboard
```

---

## 七、更新流程

当需要更新到新版本时：

### 在构建机器上

```powershell
cd E:\CursorRules\openclaw
git pull origin main
pnpm install

# 一键打包（构建 + 打包 + 生成 patch）
.\scripts\pack-openclaw.ps1

# 或跳过构建（如果已经构建好了）
.\scripts\pack-openclaw.ps1 -SkipBuild

# 传输两个文件到目标机器
```

### 在目标机器上

```bash
# 1. 停止服务
pkill -9 -f openclaw-gateway || true

# 2. 安装 + overlay + patch（参考 4.1 的 3 步流程）
cd ~
sudo rm -rf /usr/lib/node_modules/openclaw
sudo npm install -g /tmp/openclaw-VERSION.tgz --ignore-scripts
sudo tar -xzf /tmp/pi-mono-patch.tar.gz -C /usr/lib/node_modules/openclaw/node_modules/

# 3. 验证 + 重启
hash -r
openclaw --version
nohup openclaw gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
```

---

## 八、故障排除

### "Gateway start blocked: set gateway.mode=local"

```bash
openclaw config set gateway.mode local
```

### "openclaw: command not found"

```bash
# 检查安装位置
sudo npm root -g
ls $(sudo npm root -g)/openclaw/

# 确保 PATH 包含 npm 全局 bin
export PATH="/usr/bin:$PATH"
hash -r
```

### 端口被占用

```bash
# 检查 18789 端口
ss -ltnp | grep 18789

# 杀死占用端口的进程
sudo kill -9 $(ss -ltnp | grep 18789 | awk '{print $NF}' | grep -o '[0-9]*')
```

### 查看详细日志

```bash
openclaw logs --follow
# 或直接查看日志文件
tail -f /tmp/openclaw-gateway.log
```

### ERR_PACKAGE_PATH_NOT_EXPORTED（旧版本）

如果插件加载报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，说明使用的是 cd96e900 之前的版本，
jiti 没有 `tryNative` 选项。手动 patch 所有 exports：

```bash
cat > /tmp/patch-all-exports.js << 'SCRIPT'
const fs = require("fs");
const path = require("path");
const nmDir = "/usr/lib/node_modules/openclaw/node_modules";
let patched = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("@")) {
      for (const s of fs.readdirSync(path.join(dir, e.name), { withFileTypes: true }))
        if (s.isDirectory()) patch(path.join(dir, e.name, s.name));
    } else patch(path.join(dir, e.name));
  }
}
function patch(d) {
  const f = path.join(d, "package.json");
  try {
    const p = JSON.parse(fs.readFileSync(f, "utf8"));
    if (!p.exports || typeof p.exports !== "object") return;
    let c = false;
    for (const k of Object.keys(p.exports)) {
      const e = p.exports[k];
      if (typeof e === "object" && e !== null && e.import && !e.default) { e.default = e.import; c = true; }
    }
    if (c) { fs.writeFileSync(f, JSON.stringify(p, null, 2) + "\n"); patched++; }
  } catch {}
}
walk(nmDir);
console.log("Patched", patched, "packages");
SCRIPT
sudo node /tmp/patch-all-exports.js
```

### Missing workspace template（旧版本）

如果报 `Missing workspace template: AGENTS.md`，说明模板路径解析失败。手动创建 symlink：

```bash
mkdir -p ~/docs/reference
sudo ln -sf /usr/lib/node_modules/openclaw/docs/reference/templates ~/docs/reference/templates
```

### 运行诊断

```bash
openclaw doctor
```

---

## 九、目录结构参考

| 路径                              | 说明                     |
| --------------------------------- | ------------------------ |
| `~/.openclaw/openclaw.json`       | 主配置文件               |
| `~/.openclaw/credentials/`        | API 凭证存储             |
| `~/.openclaw/sessions/`           | 会话数据                 |
| `~/.openclaw/agents/`             | Agent 工作区             |
| `/usr/lib/node_modules/openclaw/` | 全局安装位置（sudo npm） |
| `/usr/bin/openclaw`               | CLI 二进制入口           |

---

## 十、安全注意事项

- **不要在公网暴露 gateway**，除非配置了认证（token/password）
- 绑定到 `loopback`（127.0.0.1）是最安全的，只允许本机访问
- 如需远程访问，使用 `--bind lan` 并配置 `--token` 或 `--password`
- API Key 等敏感信息存储在 `~/.openclaw/credentials/`，确保文件权限为 600
- 配置文件中不要硬编码真实手机号、token 等

---

## 十一、自动化浏览器配置

OpenClaw 内置浏览器自动化功能，Agent 可以控制一个独立的 Chrome 浏览器来浏览网页、截图、点击、输入等。在 WSL Ubuntu（无 GUI）环境下需要使用 headless 模式。

### 11.1 安装 Google Chrome

> **重要**：不要使用 Ubuntu 默认的 snap 版 Chromium，它会因 AppArmor 限制导致 CDP 启动失败。必须安装原生 Chrome `.deb` 包。

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y

# 验证（应显示版本号）
google-chrome-stable --version
```

如果下载的 deb 文件损坏（出现 `lzma error`），删除后重新下载：

```bash
rm -f google-chrome-stable_current_amd64.deb*
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
```

### 11.2 配置 OpenClaw 浏览器

```bash
openclaw config set browser.enabled true
openclaw config set browser.executablePath "/usr/bin/google-chrome-stable"
openclaw config set browser.headless true
openclaw config set browser.noSandbox true
openclaw config set browser.defaultProfile "openclaw"
```

或直接编辑 `~/.openclaw/openclaw.json`：

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true,
    "defaultProfile": "openclaw"
  }
}
```

**参数说明：**

| 参数             | 说明                                               |
| ---------------- | -------------------------------------------------- |
| `enabled`        | 启用浏览器控制                                     |
| `executablePath` | Chrome 可执行文件路径，避免使用 snap 版            |
| `headless`       | WSL 无 GUI，**必须开启**                           |
| `noSandbox`      | WSL/容器环境下 Chrome sandbox 会失败，**必须开启** |
| `defaultProfile` | 设为 `openclaw` 使用独立管理的浏览器实例           |

### 11.3 重启 Gateway 并验证

```bash
# 重启 gateway（使用 --force 避免端口冲突）
pkill -9 -f "openclaw gateway" || true
nohup openclaw gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &

# 等待启动
sleep 3

# 检查浏览器状态
openclaw browser --browser-profile openclaw status
```

正常输出应显示：

```
running: false (或 true，如果已自动启动)
detectedBrowser: custom
detectedPath: /usr/bin/google-chrome-stable
```

### 11.4 基本使用

```bash
# 启动浏览器
openclaw browser --browser-profile openclaw start

# 打开网页
openclaw browser --browser-profile openclaw open https://example.com

# 获取页面快照（AI 可读的文本结构）
openclaw browser --browser-profile openclaw snapshot

# 截图
openclaw browser --browser-profile openclaw screenshot

# 查看标签页
openclaw browser --browser-profile openclaw tabs

# 停止浏览器
openclaw browser --browser-profile openclaw stop
```

### 11.5 Agent 工具调用

配置完成后，AI Agent 可以通过聊天频道（Telegram/Discord 等）自动使用 `browser` 工具：

- **浏览网页**：Agent 会自动打开 URL 并获取页面内容
- **页面快照**：获取页面的文本结构和可交互元素
- **操作页面**：点击按钮、填写表单、提交等
- **截图**：捕获页面截图用于视觉分析

### 11.6 故障排除

**"Failed to start Chrome CDP on port 18800"**

- 确认 Chrome 已正确安装：`google-chrome-stable --version`
- 确认 `headless: true` 和 `noSandbox: true` 已设置
- 检查端口是否被占用：`ss -ltnp | grep 18800`

**"Playwright is not available"**

部分高级功能（navigate/act/AI snapshot）需要 Playwright：

```bash
npx playwright install chromium
```

**验证 CDP 端口：**

```bash
curl -s http://127.0.0.1:18800/json/version
```
