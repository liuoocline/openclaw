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

### 2.1 构建 openclaw

```powershell
cd E:\CursorRules\openclaw

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

### 2.2 切换 package.json 为 npm 版本（打包前必须）

打包发布时，必须把 `file:` 引用改为 npm 版本号，否则目标机器无法解析本地路径。

```powershell
# 在 package.json 中，将以下四行：
#   "@mariozechner/pi-agent-core": "file:./pi-mono/packages/agent"
#   "@mariozechner/pi-ai": "file:./pi-mono/packages/ai"
#   "@mariozechner/pi-coding-agent": "file:./pi-mono/packages/coding-agent"
#   "@mariozechner/pi-tui": "file:./pi-mono/packages/tui"
#
# 改为：
#   "@mariozechner/pi-agent-core": "0.52.10"
#   "@mariozechner/pi-ai": "0.52.10"
#   "@mariozechner/pi-coding-agent": "0.52.10"
#   "@mariozechner/pi-tui": "0.52.10"
```

### 2.3 打包 tgz

```powershell
# 删除旧的 tgz（如果有）
Remove-Item openclaw-*.tgz -ErrorAction SilentlyContinue

# 打包（跳过 prepack hook，因为 Windows bash 不兼容）
npm pack --ignore-scripts

# 验证生成的文件（约 16-17 MB）
Get-Item openclaw-*.tgz
```

### 2.4 打包后恢复 package.json

```powershell
# 将四个 pi-mono 包改回 file: 引用（用于本地开发）
#   "@mariozechner/pi-agent-core": "file:./pi-mono/packages/agent"
#   "@mariozechner/pi-ai": "file:./pi-mono/packages/ai"
#   "@mariozechner/pi-coding-agent": "file:./pi-mono/packages/coding-agent"
#   "@mariozechner/pi-tui": "file:./pi-mono/packages/tui"
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

### 4.1 安装 openclaw

```bash
# 卸载旧版本（如果有）
sudo npm uninstall -g openclaw 2>/dev/null
# 如果之前用 pnpm 全局安装过，也要删除
pnpm remove -g openclaw 2>/dev/null

# 安装新版本
sudo npm install -g /tmp/openclaw-2026.2.13.tgz

# 刷新 shell 缓存（重要！）
hash -r

# 验证
which openclaw        # 应显示 /usr/bin/openclaw
openclaw --version    # 应显示对应版本号
```

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
# 1. 拉取最新代码
cd E:\CursorRules\openclaw
git pull origin main

# 2. 重新构建（参考 "二、构建机器打包" 步骤）
pnpm install
npx tsdown
node scripts/ui.js build
node --import tsx scripts/canvas-a2ui-copy.ts
node --import tsx scripts/copy-hook-metadata.ts
node --import tsx scripts/write-build-info.ts
node --import tsx scripts/write-cli-compat.ts

# 3. 切换 package.json 为 npm 版本
# 4. 打包
npm pack --ignore-scripts

# 5. 恢复 package.json 为 file: 引用
# 6. 启动临时 HTTP 服务传输
```

### 在目标机器上

```bash
# 1. 下载新版本
wget http://192.168.50.22:9876/openclaw-<新版本>.tgz -O /tmp/openclaw-new.tgz

# 2. 停止服务
sudo systemctl stop openclaw-gateway
# 或如果用 nohup：pkill -f "openclaw gateway"

# 3. 安装新版本
sudo npm install -g /tmp/openclaw-new.tgz
hash -r

# 4. 验证
openclaw --version

# 5. 重启服务
sudo systemctl start openclaw-gateway
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
