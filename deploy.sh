#!/bin/bash

# Q-Coach 自动化部署脚本
# 适用于 Ubuntu 22.04 服务器
# 作者: Q-Coach Team
# 版本: 2.0.0

set -e  # 遇到错误时立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志文件
LOG_FILE="/tmp/q-coach-deploy-$(date +%Y%m%d_%H%M%S).log"
ERROR_LOG="/tmp/q-coach-error-$(date +%Y%m%d_%H%M%S).log"

# 项目配置
PROJECT_NAME="q-coach"
APP_DIR="/opt/q-coach"
SERVICE_USER="qcoach"
NODE_VERSION="20"
PORT="3008"

# 函数：打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}" | tee -a "$LOG_FILE"
}

# 函数：打印错误并退出
print_error() {
    local message=$1
    print_message "$RED" "❌ 错误: $message"
    echo "详细错误信息已保存到: $ERROR_LOG"
    exit 1
}

# 函数：检查命令执行结果
check_result() {
    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✅ $1 - 成功"
    else
        print_error "$1 - 失败"
    fi
}

# 函数：检查系统要求
check_system() {
    print_message "$CYAN" "🔍 检查系统环境..."
    
    # 检查操作系统
    if ! grep -q "Ubuntu 22" /etc/os-release; then
        print_message "$YELLOW" "⚠️  警告: 建议使用 Ubuntu 22.04，当前系统可能不完全兼容"
    fi
    
    # 检查root权限
    if [ "$EUID" -ne 0 ]; then
        print_error "此脚本需要root权限运行，请使用 sudo ./deploy.sh"
    fi
    
    # 检查磁盘空间
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then  # 2GB
        print_error "磁盘空间不足，至少需要2GB可用空间"
    fi
    
    print_message "$GREEN" "✅ 系统检查通过"
}

# 函数：更新系统
update_system() {
    print_message "$BLUE" "📦 更新系统包..."
    apt update 2>&1 | tee -a "$LOG_FILE" || print_error "系统更新失败"
    apt upgrade -y 2>&1 | tee -a "$LOG_FILE" || print_error "系统升级失败"
    check_result "系统更新"
}

# 函数：安装基础依赖
install_dependencies() {
    print_message "$BLUE" "🔧 安装基础依赖..."
    
    # 安装基础工具
    apt install -y curl wget git unzip software-properties-common 2>&1 | tee -a "$LOG_FILE"
    check_result "基础工具安装"
    
    # 安装构建工具
    apt install -y build-essential 2>&1 | tee -a "$LOG_FILE"
    check_result "构建工具安装"
}

# 函数：安装Node.js
install_nodejs() {
    print_message "$BLUE" "🟢 安装Node.js $NODE_VERSION..."
    
    # 检查Node.js是否已安装
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_message "$GREEN" "✅ Node.js $NODE_CURRENT 已安装，跳过安装"
            return
        fi
    fi
    
    # 安装NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - 2>&1 | tee -a "$LOG_FILE"
    check_result "NodeSource仓库添加"
    
    # 安装Node.js
    apt install -y nodejs 2>&1 | tee -a "$LOG_FILE"
    check_result "Node.js安装"
    
    # 验证安装
    node --version | tee -a "$LOG_FILE"
    npm --version | tee -a "$LOG_FILE"
    
    # 配置npm镜像源（解决网络问题）
    print_message "$BLUE" "🔧 配置npm镜像源..."
    npm config set registry https://registry.npmmirror.com/ 2>&1 | tee -a "$LOG_FILE"
    check_result "npm镜像源配置"
}

# 函数：安装PM2
install_pm2() {
    print_message "$BLUE" "⚡ 安装PM2进程管理器..."
    
    if command -v pm2 &> /dev/null; then
        print_message "$GREEN" "✅ PM2已安装，跳过安装"
        return
    fi
    
    npm install -g pm2 2>&1 | tee -a "$LOG_FILE"
    check_result "PM2安装"
    
    # 设置PM2开机自启
    pm2 startup 2>&1 | tee -a "$LOG_FILE"
    check_result "PM2开机自启设置"
}

# 函数：安装Nginx
install_nginx() {
    print_message "$BLUE" "🌐 安装Nginx..."
    
    if command -v nginx &> /dev/null; then
        print_message "$GREEN" "✅ Nginx已安装，跳过安装"
        return
    fi
    
    apt install -y nginx 2>&1 | tee -a "$LOG_FILE"
    check_result "Nginx安装"
    
    # 启动并设置开机自启
    systemctl start nginx 2>&1 | tee -a "$LOG_FILE"
    systemctl enable nginx 2>&1 | tee -a "$LOG_FILE"
    check_result "Nginx服务启动"
}

# 函数：创建应用用户
create_app_user() {
    print_message "$BLUE" "👤 创建应用用户..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        print_message "$GREEN" "✅ 用户 $SERVICE_USER 已存在，跳过创建"
        return
    fi
    
    useradd -r -s /bin/bash -d "$APP_DIR" "$SERVICE_USER" 2>&1 | tee -a "$LOG_FILE"
    check_result "应用用户创建"
}

# 函数：部署应用代码
deploy_application() {
    print_message "$BLUE" "🚀 部署应用代码..."
    
    # 创建应用目录
    mkdir -p "$APP_DIR" 2>&1 | tee -a "$LOG_FILE"
    check_result "应用目录创建"
    
    # 如果当前目录包含package.json，则复制当前代码
    if [ -f "package.json" ]; then
        print_message "$BLUE" "📁 复制本地代码到部署目录..."
        cp -r . "$APP_DIR/" 2>&1 | tee -a "$LOG_FILE"
        check_result "代码复制"
    else
        print_message "$YELLOW" "⚠️  当前目录没有package.json，请手动上传代码到 $APP_DIR"
        return
    fi
    
    # 设置目录权限
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" 2>&1 | tee -a "$LOG_FILE"
    check_result "目录权限设置"
    
    # 切换到应用目录
    cd "$APP_DIR"
    
    # 安装依赖
    print_message "$BLUE" "📦 安装应用依赖..."
    
    # 设置环境变量避免网络问题
    export NEXT_TELEMETRY_DISABLED=1
    export NPM_CONFIG_FUND=false
    export NPM_CONFIG_AUDIT=false
    
    # 以应用用户身份安装依赖
    sudo -u "$SERVICE_USER" npm ci --production 2>&1 | tee -a "$LOG_FILE"
    check_result "依赖安装"
    
    # 构建应用
    print_message "$BLUE" "🔨 构建应用..."
    sudo -u "$SERVICE_USER" npm run build 2>&1 | tee -a "$LOG_FILE"
    check_result "应用构建"
}

# 函数：配置环境变量
setup_environment() {
    print_message "$BLUE" "🔧 配置环境变量..."
    
    # 创建环境变量文件
    cat > "$APP_DIR/.env.production" << EOF
# 生产环境配置
NODE_ENV=production
PORT=$PORT
NEXT_TELEMETRY_DISABLED=1

# 数据库配置 - 请根据实际情况修改
DATABASE_URL="file:./dev.db"

# OpenRouter API配置 - 请填入您的API密钥
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 其他配置
HOSTNAME=0.0.0.0
EOF
    
    chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/.env.production"
    check_result "环境变量配置"
    
    print_message "$YELLOW" "⚠️  请编辑 $APP_DIR/.env.production 文件，填入正确的配置信息"
}

# 函数：初始化数据库
init_database() {
    print_message "$BLUE" "🗄️  初始化数据库..."
    
    cd "$APP_DIR"
    
    # 生成Prisma客户端
    sudo -u "$SERVICE_USER" npx prisma generate 2>&1 | tee -a "$LOG_FILE"
    check_result "Prisma客户端生成"
    
    # 推送数据库结构
    sudo -u "$SERVICE_USER" npx prisma db push 2>&1 | tee -a "$LOG_FILE"
    check_result "数据库结构推送"
}

# 函数：配置PM2
setup_pm2() {
    print_message "$BLUE" "⚡ 配置PM2应用..."
    
    # 创建PM2配置文件
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
         env: {
       NODE_ENV: 'production',
       PORT: 3008,
       NEXT_TELEMETRY_DISABLED: 1
     },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '$APP_DIR/logs/err.log',
    out_file: '$APP_DIR/logs/out.log',
    log_file: '$APP_DIR/logs/combined.log',
    time: true
  }]
};
EOF
    
    # 创建日志目录
    mkdir -p "$APP_DIR/logs"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/logs"
    chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/ecosystem.config.js"
    
    check_result "PM2配置文件创建"
}

# 函数：配置Nginx
setup_nginx() {
    print_message "$BLUE" "🌐 配置Nginx反向代理..."
    
    # 创建Nginx配置文件
    cat > "/etc/nginx/sites-available/$PROJECT_NAME" << EOF
server {
    listen 80;
    server_name _;
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 日志配置
    access_log /var/log/nginx/${PROJECT_NAME}_access.log;
    error_log /var/log/nginx/${PROJECT_NAME}_error.log;
    
         # 反向代理到Node.js应用
     location / {
         proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
         # 静态文件缓存
     location /_next/static/ {
         proxy_pass http://127.0.0.1:3008;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # 启用站点
    ln -sf "/etc/nginx/sites-available/$PROJECT_NAME" "/etc/nginx/sites-enabled/"
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试Nginx配置
    nginx -t 2>&1 | tee -a "$LOG_FILE"
    check_result "Nginx配置测试"
    
    # 重载Nginx
    systemctl reload nginx 2>&1 | tee -a "$LOG_FILE"
    check_result "Nginx配置重载"
}

# 函数：启动应用
start_application() {
    print_message "$BLUE" "🚀 启动应用..."
    
    cd "$APP_DIR"
    
    # 停止可能存在的进程
    sudo -u "$SERVICE_USER" pm2 delete "$PROJECT_NAME" 2>/dev/null || true
    
    # 启动应用
    sudo -u "$SERVICE_USER" pm2 start ecosystem.config.js 2>&1 | tee -a "$LOG_FILE"
    check_result "应用启动"
    
    # 保存PM2配置
    sudo -u "$SERVICE_USER" pm2 save 2>&1 | tee -a "$LOG_FILE"
    check_result "PM2配置保存"
    
    # 等待应用启动
    print_message "$BLUE" "⏳ 等待应用启动..."
    sleep 10
    
    # 检查应用状态
    sudo -u "$SERVICE_USER" pm2 status 2>&1 | tee -a "$LOG_FILE"
}

# 函数：验证部署
verify_deployment() {
    print_message "$BLUE" "🔍 验证部署状态..."
    
         # 检查端口监听
     if netstat -tlnp | grep ":3008 " > /dev/null; then
         print_message "$GREEN" "✅ 应用端口 3008 正在监听"
     else
         print_error "应用端口 3008 未在监听"
     fi
    
         # 检查HTTP响应
     sleep 5
     if curl -f http://localhost:3008 > /dev/null 2>&1; then
        print_message "$GREEN" "✅ 应用HTTP响应正常"
    else
        print_message "$YELLOW" "⚠️  应用HTTP响应异常，请检查日志"
    fi
    
    # 检查Nginx状态
    if systemctl is-active --quiet nginx; then
        print_message "$GREEN" "✅ Nginx服务运行正常"
    else
        print_error "Nginx服务未运行"
    fi
    
    # 显示服务状态
    print_message "$CYAN" "📊 服务状态概览:"
    echo "----------------------------------------" | tee -a "$LOG_FILE"
    systemctl status nginx --no-pager -l | tee -a "$LOG_FILE"
    echo "----------------------------------------" | tee -a "$LOG_FILE"
    sudo -u "$SERVICE_USER" pm2 status | tee -a "$LOG_FILE"
    echo "----------------------------------------" | tee -a "$LOG_FILE"
}

# 函数：配置防火墙
setup_firewall() {
    print_message "$BLUE" "🔥 配置防火墙..."
    
    # 检查ufw是否安装
    if ! command -v ufw &> /dev/null; then
        apt install -y ufw 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # 配置防火墙规则
    ufw --force reset 2>&1 | tee -a "$LOG_FILE"
    ufw default deny incoming 2>&1 | tee -a "$LOG_FILE"
    ufw default allow outgoing 2>&1 | tee -a "$LOG_FILE"
    ufw allow ssh 2>&1 | tee -a "$LOG_FILE"
    ufw allow 'Nginx Full' 2>&1 | tee -a "$LOG_FILE"
    ufw --force enable 2>&1 | tee -a "$LOG_FILE"
    
    check_result "防火墙配置"
}

# 函数：创建管理脚本
create_management_scripts() {
    print_message "$BLUE" "📝 创建管理脚本..."
    
    # 创建启动脚本
    cat > "/usr/local/bin/qcoach-start" << 'EOF'
#!/bin/bash
echo "启动Q-Coach应用..."
cd /opt/q-coach
sudo -u qcoach pm2 start ecosystem.config.js
sudo -u qcoach pm2 save
echo "应用已启动"
EOF
    
    # 创建停止脚本
    cat > "/usr/local/bin/qcoach-stop" << 'EOF'
#!/bin/bash
echo "停止Q-Coach应用..."
sudo -u qcoach pm2 stop q-coach
echo "应用已停止"
EOF
    
    # 创建重启脚本
    cat > "/usr/local/bin/qcoach-restart" << 'EOF'
#!/bin/bash
echo "重启Q-Coach应用..."
cd /opt/q-coach
sudo -u qcoach pm2 restart q-coach
echo "应用已重启"
EOF
    
    # 创建状态检查脚本
    cat > "/usr/local/bin/qcoach-status" << 'EOF'
#!/bin/bash
echo "=== Q-Coach 应用状态 ==="
sudo -u qcoach pm2 status
echo ""
echo "=== Nginx 状态 ==="
systemctl status nginx --no-pager -l
echo ""
 echo "=== 端口监听状态 ==="
 netstat -tlnp | grep ":3008"
EOF
    
    # 创建日志查看脚本
    cat > "/usr/local/bin/qcoach-logs" << 'EOF'
#!/bin/bash
echo "=== Q-Coach 应用日志 ==="
echo "选择要查看的日志:"
echo "1) 应用输出日志"
echo "2) 应用错误日志"
echo "3) Nginx访问日志"
echo "4) Nginx错误日志"
echo "5) PM2日志"
read -p "请输入选项 (1-5): " choice

case $choice in
    1) tail -f /opt/q-coach/logs/out.log ;;
    2) tail -f /opt/q-coach/logs/err.log ;;
    3) tail -f /var/log/nginx/q-coach_access.log ;;
    4) tail -f /var/log/nginx/q-coach_error.log ;;
    5) sudo -u qcoach pm2 logs q-coach ;;
    *) echo "无效选项" ;;
esac
EOF
    
    # 设置执行权限
    chmod +x /usr/local/bin/qcoach-*
    
    check_result "管理脚本创建"
}

# 函数：显示部署完成信息
show_completion_info() {
    print_message "$GREEN" "🎉 部署完成！"
    echo ""
    echo "========================================" | tee -a "$LOG_FILE"
    echo "           Q-Coach 部署完成            " | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo ""
    echo "📍 应用信息:" | tee -a "$LOG_FILE"
    echo "   - 应用目录: $APP_DIR" | tee -a "$LOG_FILE"
    echo "   - 运行用户: $SERVICE_USER" | tee -a "$LOG_FILE"
         echo "   - 运行端口: 3008" | tee -a "$LOG_FILE"
    echo "   - 访问地址: http://your-server-ip" | tee -a "$LOG_FILE"
    echo ""
    echo "🔧 管理命令:" | tee -a "$LOG_FILE"
    echo "   - 启动应用: qcoach-start" | tee -a "$LOG_FILE"
    echo "   - 停止应用: qcoach-stop" | tee -a "$LOG_FILE"
    echo "   - 重启应用: qcoach-restart" | tee -a "$LOG_FILE"
    echo "   - 查看状态: qcoach-status" | tee -a "$LOG_FILE"
    echo "   - 查看日志: qcoach-logs" | tee -a "$LOG_FILE"
    echo ""
    echo "📁 重要文件:" | tee -a "$LOG_FILE"
    echo "   - 应用配置: $APP_DIR/.env.production" | tee -a "$LOG_FILE"
    echo "   - PM2配置: $APP_DIR/ecosystem.config.js" | tee -a "$LOG_FILE"
    echo "   - Nginx配置: /etc/nginx/sites-available/$PROJECT_NAME" | tee -a "$LOG_FILE"
    echo "   - 部署日志: $LOG_FILE" | tee -a "$LOG_FILE"
    echo ""
    echo "⚠️  下一步操作:" | tee -a "$LOG_FILE"
    echo "   1. 编辑 $APP_DIR/.env.production 填入正确的配置" | tee -a "$LOG_FILE"
    echo "   2. 运行 qcoach-restart 重启应用" | tee -a "$LOG_FILE"
    echo "   3. 访问 http://your-server-ip 测试应用" | tee -a "$LOG_FILE"
    echo ""
    echo "🆘 故障排查:" | tee -a "$LOG_FILE"
    echo "   - 查看应用日志: qcoach-logs" | tee -a "$LOG_FILE"
    echo "   - 检查服务状态: qcoach-status" | tee -a "$LOG_FILE"
    echo "   - 完整部署日志: $LOG_FILE" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
}

# 主函数
main() {
    print_message "$PURPLE" "🚀 开始Q-Coach自动化部署..."
    print_message "$CYAN" "📝 部署日志保存到: $LOG_FILE"
    
    # 重定向错误输出到错误日志
    exec 2> >(tee -a "$ERROR_LOG")
    
    # 执行部署步骤
    check_system
    update_system
    install_dependencies
    install_nodejs
    install_pm2
    install_nginx
    create_app_user
    deploy_application
    setup_environment
    init_database
    setup_pm2
    setup_nginx
    setup_firewall
    start_application
    verify_deployment
    create_management_scripts
    show_completion_info
    
    print_message "$GREEN" "🎊 部署成功完成！"
}

# 捕获错误并显示帮助信息
trap 'print_error "部署过程中发生错误，请查看日志文件: $LOG_FILE 和 $ERROR_LOG"' ERR

# 执行主函数
main "$@" 