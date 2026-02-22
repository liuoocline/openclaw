# 自定义合并与修改变更日志（2026年2月）

本文档记录了将 OpenClaw 官方主分支合并到自定义 fork 的完整变更，包括冲突解决、新功能开发、bug 修复和基础设施改进。

---

## 一、上游合并

### 合并来源

- **上游**：`https://github.com/openclaw/openclaw.git` (`origin/main`)
- **目标**：`https://github.com/liuoocline/openclaw.git` (`my-fork/main`)
- **合并前备份**：`backup-before-merge` 分支

### 冲突解决

| 文件                                     | 冲突类型                                                                     | 解决方式                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| `package.json`                           | 上游使用 npm 版本号，本地使用 `file:` 引用                                   | 保留本地 `file:./pi-mono/packages/*` 引用 |
| `src/agents/pi-embedded-runner/types.ts` | 上游新增 `"retry_limit"`，本地新增 `"json_parse"`                            | 合并两者到 union type                     |
| `src/agents/transcript-policy.ts`        | 上游新增 `isCopilotClaude`，本地新增 `isOpenAiCompatibleThirdParty`          | 保留两者                                  |
| `.gitignore`                             | 上游新增 `dist/protocol.schema.json`，本地新增 `.windsurf/`、`workspace/` 等 | 合并所有规则                              |

---

## 二、自定义功能开发

### 2.1 JSON 解析错误处理（openclaw 层）

**目的**：当 AI 模型生成的工具调用参数包含特殊字符（如中文引号）导致 JSON 解析失败时，向用户返回友好的错误消息。

**变更文件**：

| 文件                                       | 变更                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/agents/pi-embedded-helpers/errors.ts` | 新增 `JSON_PARSE_ERROR_USER_MESSAGE` 常量、6 条正则模式、`isJsonParseError()` 函数、`formatAssistantErrorText` 集成 |
| `src/agents/pi-embedded-runner/run.ts`     | 新增 `jsonParseRetried` flag、retry-once 逻辑（首次重试，第二次返回错误）                                           |
| `src/agents/pi-embedded-runner/types.ts`   | `error.kind` union type 新增 `"json_parse"`                                                                         |
| `src/agents/pi-embedded-helpers.ts`        | barrel 文件导出 `JSON_PARSE_ERROR_USER_MESSAGE` 和 `isJsonParseError`                                               |

**正则模式详情**：

```
/expected.*(?:,|'}').*after property value in json/    — 缺少逗号/花括号
/unexpected.*(?:token|character).*in json/              — 意外 token/字符
/unexpected end of json/                                — 意外 EOF
/json.*parse.*(?:error|failed)/                         — JSON 解析错误
/(?:invalid|malformed).*json.*(?:format|syntax)/        — 无效/畸形 JSON
/failed to parse json/                                  — 解析失败
```

**错误处理流程**：

```
API 返回 JSON parse 错误
  → 首次：log.warn + continue（重试）
  → 第二次：log.warn + 返回 JSON_PARSE_ERROR_USER_MESSAGE
```

### 2.2 OpenAI 兼容第三方 API 轮次验证（openclaw 层）

**目的**：NVIDIA Qwen 3.5 等通过 `openai-completions` API 调用的模型严格要求角色交替。不启用轮次验证会导致 "roles must alternate" 错误。

**变更文件**：

| 文件                              | 变更                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/agents/transcript-policy.ts` | 新增 `isOpenAiCompatibleThirdParty` 变量，扩展 `validateGeminiTurns` 和 `validateAnthropicTurns` |

**逻辑变更**：

| 字段                     | 上游                    | 我们                                                          |
| ------------------------ | ----------------------- | ------------------------------------------------------------- |
| `validateGeminiTurns`    | `!isOpenAi && isGoogle` | `!isOpenAi && (isGoogle \|\| isOpenAiCompatibleThirdParty)`   |
| `validateAnthropicTurns` | `isAnthropic`           | `isAnthropic \|\| isOpenAi \|\| isOpenAiCompatibleThirdParty` |

**注意**：`validateAnthropicTurns` 对 OpenAI 的启用是有意的行为偏差。该函数仅合并连续 user 消息，对正常会话无影响。

### 2.3 jsonrepair 集成（pi-mono 层）

**目的**：增强工具调用参数的 JSON 解析鲁棒性，从根源减少 JSON 解析错误。

**变更文件**：

| 文件                                          | 变更                                                 |
| --------------------------------------------- | ---------------------------------------------------- |
| `pi-mono/packages/ai/src/utils/json-parse.ts` | `parseStreamingJson` 新增 jsonrepair 作为第 3 层修复 |
| `pi-mono/packages/ai/package.json`            | 新增 `jsonrepair` 依赖 (v3.13.2)                     |

**4 层防护链**：

```
1. JSON.parse           — 标准解析（最快，适用于完整有效 JSON）
2. fixUnescapedQuotes   — 修复中文引号 ""'' 和全角引号 ＂
3. jsonrepair           — 修复缺少逗号、单引号、未转义字符等（新增）
4. partial-json         — 处理流式传输中的不完整 JSON
```

### 2.4 NVIDIA Qwen 3.5 兼容性（pi-mono 层）

**目的**：支持 NVIDIA 部署的 Qwen 3.5 模型，该模型通过 `openai-completions` API 调用但有特殊要求。

**变更文件**：

| 文件                                                      | 变更                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `pi-mono/packages/ai/src/providers/openai-completions.ts` | `detectCompat` 新增 `isNvidia` 检测、`thinkingFormat: "qwen"`、`useMaxTokens`；新增 `repairRoleOrdering` 函数 |
| `pi-mono/packages/ai/src/utils/json-parse.ts`             | `fixUnescapedQuotes` 处理中文引号；`safeStringify` 防止序列化崩溃                                             |

---

## 三、Bug 修复

| #   | Bug                                                                                                            | 文件                        | 修复                                                |
| --- | -------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------- |
| 1   | 正则 `/unexpected.*(?:token\|character\|end of json\|eof).*in json/` 无法匹配 `"Unexpected end of JSON input"` | `errors.ts`                 | 拆分为两条独立正则                                  |
| 2   | `formatAssistantErrorText` 和 `run.ts` 中 JSON parse 错误消息重复硬编码                                        | `errors.ts`, `run.ts`       | 提取为 `JSON_PARSE_ERROR_USER_MESSAGE` 常量         |
| 3   | `ERROR_PATTERNS.jsonParse` 正则有冗余 `/i` flag                                                                | `errors.ts`                 | 移除（`matchesErrorPatterns` 已做 `toLowerCase()`） |
| 4   | `build-pi-mono.ps1` 中 `coding-agent` 用 `tsgo` 编译，跳过了 `copy-assets`                                     | `scripts/build-pi-mono.ps1` | 改为 `npm run build`                                |

---

## 四、测试覆盖

### 新增测试文件

| 文件                                                       | 测试数 | 覆盖内容                       |
| ---------------------------------------------------------- | ------ | ------------------------------ |
| `src/agents/pi-embedded-helpers/errors.json-parse.test.ts` | 18     | 10 正向 + 8 反向用例           |
| `src/agents/transcript-policy.test.ts` (新增 3 个)         | 3      | NVIDIA、Qianfan、OpenAI 提供商 |

### 测试验证结果

- **总计 83/83 测试通过**（跨 10 个测试文件）
- 类型检查：我们修改的文件无新增类型错误

---

## 五、基础设施

### 5.1 pi-mono 子模块

| 操作          | 详情                                                         |
| ------------- | ------------------------------------------------------------ |
| 基线版本      | `v0.52.10` → rebase 到 `v0.54.0`                             |
| 自定义 commit | jsonrepair 集成、NVIDIA 兼容、JSON parse 修复、safeStringify |
| 远程          | `https://github.com/liuoocline/pi-mono.git`                  |
| 当前 ref      | `a23a2851`                                                   |

### 5.2 构建脚本

| 文件                        | 说明                                                           |
| --------------------------- | -------------------------------------------------------------- |
| `scripts/build-pi-mono.ps1` | Windows 兼容的 pi-mono 构建脚本，只构建 openclaw 需要的 4 个包 |

### 5.3 文档更新

| 文件                        | 变更                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `docs/deploy-wsl-ubuntu.md` | 新增 pi-mono 构建步骤（2.1 节）、版本号更新 `0.52.10` → `0.54.0` |

---

## 六、提交历史

```
577ac705b feat: rebase on origin/main, add pi-mono submodule + JSON parse error handling
d40453632 docs: add browser automation setup guide for WSL Ubuntu
f76ed20dc fix: tighten JSON parse error detection to avoid false positives
d38c0597b fix: enable turn validation for OpenAI-compatible APIs
b64261b86 fix: enable turn validation for NVIDIA and OpenAI-compatible third-party providers
ea113ee42 docs: 更新 pi-mono 子模块（添加部署文档）
864447c2b docs: 更新 NVIDIA 配置（添加 GLM5、Kimi K2.5）并添加 aiclient 配置模板
296d86813 chore: 更新 pi-mono 子模块（Qwen API 文档 + 模型注册表）
8f5e2e3ab chore: 更新 pi-mono 子模块、pnpm-lock.yaml 和 VS Code 设置
8658dd345 chore: update pi-mono submodule to v0.54.0 base (rebased custom fixes)
07309a119 fix: extract JSON parse error message to constant, add unit tests, remove redundant /i flags
a5174540e chore: regenerate pnpm-lock.yaml for pi-mono file: references
dbe71b186 fix: split jsonParse regex to correctly match 'Unexpected end of JSON input'
5c5c85588 feat: add JSON parse error retry-once logic in run.ts
ada8e4035 chore: update pi-mono submodule ref (jsonrepair integration)
e5eeeacb9 chore: update pnpm-lock.yaml after jsonrepair addition
e7166181b chore: add Windows-compatible pi-mono build script for openclaw
ccd15ee4f docs: update WSL deploy guide with pi-mono build step and v0.54.0 versions
2cb6a7a95 fix: use full npm run build for coding-agent in build script (includes copy-assets)
```

---

## 七、已知限制和待关注项

| 项目                              | 说明                                                                                                | 优先级 |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| `validateAnthropicTurns` 范围扩大 | 较上游扩大了验证范围（包含 OpenAI）。未来上游合并时可能产生冲突                                     | 低     |
| pi-mono Windows 构建              | `mom`、`web-ui`、`pods` 包无法在 Windows 上构建（`chmod`/`cp -r` 不可用）。但 openclaw 不需要这些包 | 低     |
| `generate-models` 步骤            | 构建脚本默认 `-SkipGenerateModels` 跳过模型生成。如上游模型注册表变更，需手动运行或在 Linux 上构建  | 低     |
