#!/bin/bash

# Q-Coach Docker 部署脚本
# 适用于 Docker 和 Docker Compose 环境

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_step() {
    echo -e "${BLUE}[步骤] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[成功] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[警告] $1${NC}"
}

print_error() {
    echo -e "${RED}[错误] $1${NC}"
}

# 检查必要工具
check_requirements() {
    print_step "检查必要工具..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "docker-compose 未找到，尝试使用 docker compose"
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    
    print_success "Docker 环境检查完成"
}

# 检查环境变量
check_env() {
    print_step "检查环境变量..."
    
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local 文件不存在，创建示例文件"
        cat > .env.local << EOF
# OpenRouter API Key (必需)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 数据库配置
DATABASE_URL=file:./dev.db

# Next.js配置
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
PORT=3008
EOF
        print_warning "请编辑 .env.local 文件并设置正确的 OPENROUTER_API_KEY"
        read -p "按回车键继续，或 Ctrl+C 退出去编辑环境变量..."
    fi
    
    # 读取环境变量
    export $(grep -v '^#' .env.local | xargs)
    
    if [ -z "$OPENROUTER_API_KEY" ] || [ "$OPENROUTER_API_KEY" = "your_openrouter_api_key_here" ]; then
        print_error "请在 .env.local 中设置正确的 OPENROUTER_API_KEY"
        exit 1
    fi
    
    print_success "环境变量检查完成"
}

# 创建健康检查API
create_health_api() {
    print_step "创建健康检查API..."
    
    mkdir -p src/app/api/health
    cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Q-Coach'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Service unavailable' },
      { status: 503 }
    );
  }
}
EOF
    
    print_success "健康检查API创建完成"
}

# 构建Docker镜像
build_images() {
    print_step "构建Docker镜像..."
    
    # 构建主应用镜像
    print_step "构建主应用镜像..."
    docker build -t qcoach-app:latest .
    
    # 构建数据库初始化镜像
    print_step "构建数据库初始化镜像..."
    docker build -f Dockerfile.db-init -t qcoach-db-init:latest .
    
    print_success "Docker镜像构建完成"
}

# 停止现有容器
stop_existing() {
    print_step "停止现有容器..."
    
    $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    
    # 清理停止的容器
    docker container prune -f 2>/dev/null || true
    
    print_success "现有容器已停止"
}

# 启动服务
start_services() {
    print_step "启动Q-Coach服务..."
    
    # 启动核心服务
    $DOCKER_COMPOSE_CMD up -d qcoach-db-init qcoach-app
    
    # 等待数据库初始化完成
    print_step "等待数据库初始化..."
    sleep 10
    
    # 检查数据库初始化状态
    if docker logs qcoach-db-init 2>&1 | grep -q "Error"; then
        print_warning "数据库初始化可能有问题，继续启动应用..."
    else
        print_success "数据库初始化完成"
    fi
    
    # 等待应用启动
    print_step "等待应用启动..."
    sleep 15
    
    print_success "Q-Coach服务启动完成"
}

# 启动Nginx（可选）
start_nginx() {
    read -p "是否启动Nginx反向代理？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "启动Nginx反向代理..."
        $DOCKER_COMPOSE_CMD --profile nginx up -d qcoach-nginx
        print_success "Nginx代理启动完成"
        print_success "应用可通过 http://localhost 访问"
    else
        print_success "跳过Nginx配置"
        print_success "应用可通过 http://localhost:3008 访问"
    fi
}

# 健康检查
health_check() {
    print_step "执行健康检查..."
    
    # 检查容器状态
    if ! docker ps | grep -q qcoach-app; then
        print_error "Q-Coach应用容器未运行"
        return 1
    fi
    
    # 检查应用响应
    sleep 5
    for i in {1..10}; do
        if curl -f http://localhost:3008/api/health >/dev/null 2>&1; then
            print_success "应用健康检查通过"
            return 0
        fi
        print_step "等待应用响应... ($i/10)"
        sleep 3
    done
    
    print_warning "应用可能需要更多时间启动，请稍后手动检查"
    return 0
}

# 显示状态信息
show_status() {
    print_step "显示服务状态..."
    
    echo
    echo "=== Docker 容器状态 ==="
    docker ps --filter "name=qcoach"
    
    echo
    echo "=== 服务访问信息 ==="
    if docker ps | grep -q qcoach-nginx; then
        echo "🌐 主应用地址: http://localhost"
        echo "🌐 直接访问: http://localhost:3008"
    else
        echo "🌐 应用地址: http://localhost:3008"
    fi
    echo "🔍 健康检查: http://localhost:3008/api/health"
    
    echo
    echo "=== 常用管理命令 ==="
    echo "查看日志: $DOCKER_COMPOSE_CMD logs -f qcoach-app"
    echo "重启服务: $DOCKER_COMPOSE_CMD restart qcoach-app"
    echo "停止服务: $DOCKER_COMPOSE_CMD down"
    echo "更新应用: docker build -t qcoach-app:latest . && $DOCKER_COMPOSE_CMD up -d qcoach-app"
}

# 主部署流程
main() {
    echo "========================================"
    echo "    Q-Coach Docker 部署脚本 v1.0"
    echo "========================================"
    echo
    
    check_requirements
    check_env
    create_health_api
    build_images
    stop_existing
    start_services
    start_nginx
    health_check
    show_status
    
    echo
    print_success "🎉 Q-Coach Docker 部署完成！"
    echo
}

# 错误处理
trap 'print_error "部署过程中出现错误，请检查上面的错误信息"' ERR

# 执行主函数
main "$@" 