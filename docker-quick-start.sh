#!/bin/bash

# Q-Coach Docker 快速启动脚本
# 适用于已经构建过镜像的快速重启

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[步骤] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[成功] $1${NC}"
}

# 检查docker-compose命令
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

echo "========================================"
echo "    Q-Coach Docker 快速启动"
echo "========================================"

print_step "停止现有服务..."
$DOCKER_COMPOSE_CMD down 2>/dev/null || true

print_step "启动Q-Coach服务..."
$DOCKER_COMPOSE_CMD up -d qcoach-app

print_step "等待服务启动..."
sleep 10

print_step "检查服务状态..."
docker ps --filter "name=qcoach"

print_success "🚀 Q-Coach 服务已启动！"
echo "🌐 访问地址: http://localhost:3008"
echo "🔍 健康检查: http://localhost:3008/api/health"
echo ""
echo "查看日志: $DOCKER_COMPOSE_CMD logs -f qcoach-app"
echo "停止服务: $DOCKER_COMPOSE_CMD down" 