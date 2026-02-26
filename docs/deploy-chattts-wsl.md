# ChatTTS 本地部署方案（WSL Ubuntu）

## 概述

ChatTTS 是专为对话场景设计的中文 TTS 模型，10 万+ 小时中英数据训练。
通过 ChatTTS-OpenAI-API 项目提供 OpenAI 兼容接口，OpenClaw 可直接对接。

**架构**：

```
OpenClaw gateway → OpenAI TTS provider → ChatTTS-OpenAI-API (localhost:5001) → 音频
```

## 方案 A：Docker 部署（推荐）

### 前置条件

- Docker 已安装
- NVIDIA Container Toolkit 已安装（GPU 加速需要）

### 步骤 1：安装 NVIDIA Container Toolkit（如未安装）

```bash
# 检查 Docker 是否已安装
docker --version

# 检查 NVIDIA GPU 是否可用
nvidia-smi

# 安装 NVIDIA Container Toolkit
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 步骤 2：构建并运行 ChatTTS-OpenAI-API

```bash
cd /tmp
git clone https://github.com/a8851625/ChatTTS-OpenAI-API.git
cd ChatTTS-OpenAI-API
docker build -t chattts-openai-api .
docker run -d --name chattts --gpus all -p 5001:5001 chattts-openai-api
```

### 步骤 3：验证服务

```bash
# 等待模型加载（首次约 1-2 分钟）
sleep 60

# 测试 API
curl -X POST http://localhost:5001/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model":"chattts","input":"你好，我是 ChatTTS 语音助手","voice":"alloy"}' \
  --output /tmp/test-chattts.wav

# 检查输出文件
ls -lh /tmp/test-chattts.wav
```

## 方案 B：Python 直接部署（无 Docker）

### 步骤 1：创建 Python 虚拟环境

```bash
cd /opt
sudo mkdir -p chattts && sudo chown $USER chattts
cd /opt/chattts

python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install ChatTTS fastapi uvicorn pydantic

# 克隆 API 适配层
git clone https://github.com/a8851625/ChatTTS-OpenAI-API.git api
cd api
pip install -r requirements.txt
```

### 步骤 2：启动服务

```bash
cd /opt/chattts/api
source /opt/chattts/venv/bin/activate
nohup uvicorn app:app --host 0.0.0.0 --port 5001 > /tmp/chattts.log 2>&1 &
```

### 步骤 3：验证（同方案 A 的步骤 3）

## 配置 OpenClaw 对接 ChatTTS

ChatTTS-OpenAI-API 兼容 OpenAI `/v1/audio/speech` 接口。
OpenClaw 已内置 `OPENAI_TTS_BASE_URL` 环境变量支持（`src/tts/tts-core.ts`），
设置后自动放松 model/voice 验证，允许非 OpenAI 模型。**无需修改代码。**

### 步骤 1：配置 TTS provider

```bash
openclaw config set messages.tts.enabled true
openclaw config set messages.tts.provider openai
openclaw config set messages.tts.openai.apiKey "sk-placeholder"
openclaw config set messages.tts.openai.model "chattts"
openclaw config set messages.tts.openai.voice "alloy"
```

### 步骤 2：设置环境变量指向本地 ChatTTS

```bash
# 添加到 ~/.profile 或 ~/.bashrc（永久生效）
echo 'export OPENAI_TTS_BASE_URL=http://localhost:5001/v1' >> ~/.profile
source ~/.profile
```

### 步骤 3：重启 gateway

```bash
pkill -9 -f openclaw-gateway || true
nohup openclaw gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
```

### 验证

在 Discord 发一条消息给 bot，如果 TTS 已启用，回复应附带语音音频。

## 系统服务（开机自启）

### ChatTTS systemd 服务

```bash
sudo tee /etc/systemd/system/chattts.service << 'EOF'
[Unit]
Description=ChatTTS OpenAI API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStart=/usr/bin/docker start -a chattts
ExecStop=/usr/bin/docker stop chattts

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable chattts
sudo systemctl start chattts
```

## 显存需求

| 场景               | 显存    |
| ------------------ | ------- |
| ChatTTS 推理       | ~2-4 GB |
| + OpenClaw gateway | ~0.5 GB |
| 总计               | ~3-5 GB |

ChatTTS 模型较小，8GB 显存的消费级显卡即可流畅运行。

## 故障排除

### "CUDA out of memory"

```bash
# 检查 GPU 显存
nvidia-smi

# 如果显存不足，使用 CPU 模式（较慢）
docker run -d --name chattts -p 5001:5001 chattts-openai-api
# 注意：去掉 --gpus all
```

### Docker 无法访问 GPU

```bash
# 验证 NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

### 音频质量优化

ChatTTS 支持通过 prompt 参数控制语音风格：

- `[oral_2]` — 口语化程度（0-9，越大越口语化）
- `[laugh_0]` — 笑声频率（0-9）
- `[break_6]` — 停顿频率（0-9）

```bash
curl -X POST http://localhost:5001/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chattts",
    "input": "今天我们来聊一聊人工智能的未来发展",
    "voice": "alloy",
    "prompt": "[oral_3][laugh_1][break_5]"
  }' --output /tmp/test.wav
```
