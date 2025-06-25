#!/bin/bash

# Q-Coach Docker 管理脚本
# 提供常用的Docker管理功能

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# 检查docker-compose命令
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# 显示帮助信息
show_help() {
    echo "Q-Coach Docker 管理脚本"
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo "可用命令:"
    echo "  start         启动所有服务"
    echo "  stop          停止所有服务"
    echo "  restart       重启所有服务"
    echo "  status        显示服务状态"
    echo "  logs          显示实时日志"
    echo "  logs-app      显示应用日志"
    echo "  logs-nginx    显示Nginx日志"
    echo "  build         重新构建镜像"
    echo "  clean         清理未使用的镜像和容器"
    echo "  shell         进入应用容器shell"
    echo "  db-reset      重置数据库"
    echo "  backup        备份数据"
    echo "  health        检查应用健康状态"
    echo "  update        更新并重启应用"
    echo ""
}

# 启动服务
start_services() {
    print_info "启动Q-Coach服务..."
    $DOCKER_COMPOSE_CMD up -d
    print_success "服务启动完成"
}

# 停止服务
stop_services() {
    print_info "停止Q-Coach服务..."
    $DOCKER_COMPOSE_CMD down
    print_success "服务停止完成"
}

# 重启服务
restart_services() {
    print_info "重启Q-Coach服务..."
    $DOCKER_COMPOSE_CMD restart
    print_success "服务重启完成"
}

# 显示服务状态
show_status() {
    print_info "Q-Coach 服务状态:"
    echo ""
    $DOCKER_COMPOSE_CMD ps
    echo ""
    print_info "Docker 容器状态:"
    docker ps --filter "name=qcoach" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 显示日志
show_logs() {
    print_info "显示所有服务日志 (Ctrl+C 退出):"
    $DOCKER_COMPOSE_CMD logs -f
}

# 显示应用日志
show_app_logs() {
    print_info "显示应用日志 (Ctrl+C 退出):"
    $DOCKER_COMPOSE_CMD logs -f qcoach-app
}

# 显示Nginx日志
show_nginx_logs() {
    if $DOCKER_COMPOSE_CMD ps | grep -q qcoach-nginx; then
        print_info "显示Nginx日志 (Ctrl+C 退出):"
        $DOCKER_COMPOSE_CMD logs -f qcoach-nginx
    else
        print_warning "Nginx 服务未运行"
    fi
}

# 重新构建镜像
rebuild_images() {
    print_info "重新构建Docker镜像..."
    $DOCKER_COMPOSE_CMD build --no-cache
    print_success "镜像构建完成"
}

# 清理未使用的资源
clean_docker() {
    print_info "清理未使用的Docker资源..."
    docker system prune -f
    docker image prune -f
    print_success "清理完成"
}

# 进入应用容器
enter_shell() {
    if docker ps | grep -q qcoach-app; then
        print_info "进入应用容器shell..."
        docker exec -it qcoach-app /bin/sh
    else
        print_error "应用容器未运行"
        exit 1
    fi
}

# 重置数据库
reset_database() {
    print_warning "这将删除所有数据，确定要继续吗? (y/N)"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "重置数据库..."
        $DOCKER_COMPOSE_CMD stop qcoach-app
        docker volume rm qcoach_qcoach-data 2>/dev/null || true
        $DOCKER_COMPOSE_CMD up -d qcoach-db-init
        sleep 5
        $DOCKER_COMPOSE_CMD up -d qcoach-app
        print_success "数据库重置完成"
    else
        print_info "操作已取消"
    fi
}

# 备份数据
backup_data() {
    print_info "备份数据..."
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if docker ps | grep -q qcoach-app; then
        docker cp qcoach-app:/app/prisma/dev.db "$BACKUP_DIR/database.db" 2>/dev/null || true
        print_success "数据备份到: $BACKUP_DIR"
    else
        print_error "应用容器未运行，无法备份"
    fi
}

# 健康检查
health_check() {
    print_info "检查应用健康状态..."
    
    if ! docker ps | grep -q qcoach-app; then
        print_error "应用容器未运行"
        return 1
    fi
    
    if curl -s -f http://localhost:3008/api/health >/dev/null; then
        print_success "✅ 应用运行正常"
        curl -s http://localhost:3008/api/health | jq . 2>/dev/null || curl -s http://localhost:3008/api/health
    else
        print_error "❌ 应用健康检查失败"
        return 1
    fi
}

# 更新应用
update_app() {
    print_info "更新Q-Coach应用..."
    
    # 拉取最新代码 (如果是git仓库)
    if [ -d ".git" ]; then
        print_info "拉取最新代码..."
        git pull
    fi
    
    # 重新构建和启动
    print_info "重新构建镜像..."
    $DOCKER_COMPOSE_CMD build qcoach-app
    
    print_info "重启应用..."
    $DOCKER_COMPOSE_CMD up -d qcoach-app
    
    print_success "应用更新完成"
}

# 主函数
main() {
    case "${1:-}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        logs-app)
            show_app_logs
            ;;
        logs-nginx)
            show_nginx_logs
            ;;
        build)
            rebuild_images
            ;;
        clean)
            clean_docker
            ;;
        shell)
            enter_shell
            ;;
        db-reset)
            reset_database
            ;;
        backup)
            backup_data
            ;;
        health)
            health_check
            ;;
        update)
            update_app
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 