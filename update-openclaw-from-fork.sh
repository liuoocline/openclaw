#!/bin/bash
set -e

echo "🦞 更新 OpenClaw 从你的 fork..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# OpenClaw 源码目录
OPENCLAW_DIR="$HOME/openclaw"

# 检查目录是否存在
if [ ! -d "$OPENCLAW_DIR" ]; then
    echo -e "${RED}错误: OpenClaw 目录不存在: $OPENCLAW_DIR${NC}"
    exit 1
fi

cd "$OPENCLAW_DIR"

echo -e "${YELLOW}步骤 1/6: 检查 git 配置...${NC}"
git remote -v

# 检查是否有 my-fork 远程仓库
if ! git remote | grep -q "my-fork"; then
    echo -e "${YELLOW}添加 my-fork 远程仓库...${NC}"
    git remote add my-fork https://github.com/liuoocline/openclaw.git
fi

echo -e "${YELLOW}步骤 2/6: 保存当前工作...${NC}"
# 检查是否有未提交的修改
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}发现未提交的修改，创建备份...${NC}"
    git stash push -m "backup before update $(date +%Y%m%d_%H%M%S)"
fi

echo -e "${YELLOW}步骤 3/6: 拉取最新代码...${NC}"
# 默认使用 backup-before-rebase-openclaw-with-dist 分支（稳定版本 + 预构建文件）
# 这个分支包含预构建的 dist 文件，避免 WSL Ubuntu 上的 TypeScript 编译错误
BRANCH="${1:-backup-before-rebase-openclaw-with-dist}"
echo -e "${YELLOW}切换到分支: $BRANCH${NC}"
git fetch my-fork "$BRANCH"
git checkout "$BRANCH"
git reset --hard "my-fork/$BRANCH"

echo -e "${YELLOW}步骤 4/6: 更新 submodule...${NC}"
git submodule update --init --recursive

echo -e "${YELLOW}步骤 5/6: 安装依赖...${NC}"
pnpm install

echo -e "${YELLOW}步骤 6/6: 跳过构建（使用预构建文件）...${NC}"
echo -e "${GREEN}✓ 使用仓库中的预构建 dist 文件${NC}"
# pnpm build  # 跳过构建，因为分支已包含预构建文件

echo -e "${GREEN}✅ 更新完成！${NC}"
echo ""
echo "当前分支和版本信息："
git branch --show-current
git log --oneline -3
echo ""
echo "重启 Gateway 服务："
echo "  openclaw gateway restart"
echo ""
echo "启动 TUI 测试："
echo "  openclaw tui"
echo ""
echo "如果需要切换到其他分支，运行："
echo "  bash update-openclaw-from-fork.sh main"
echo "  bash update-openclaw-from-fork.sh backup-before-rebase-openclaw"
echo "  bash update-openclaw-from-fork.sh backup-before-rebase-openclaw-with-dist  # 推荐：包含预构建文件"
