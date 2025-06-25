# Q-Coach Docker 部署指南

## 概述

本文档提供了Q-Coach项目的完整Docker部署方案，包括单容器部署和Docker Compose多服务部署。

## 前置要求

### 系统要求
- Docker 20.10+
- Docker Compose 2.0+ (或docker-compose 1.29+)
- 至少2GB可用内存
- 至少1GB可用磁盘空间

### 必需配置
- OpenRouter API Key

## 快速开始

### 1. 克隆项目
```bash
git clone <your-repository>
cd Q-coach
```

### 2. 配置环境变量
```bash
cp .env.local.example .env.local
# 编辑 .env.local 设置你的 OPENROUTER_API_KEY
```

### 3. 一键部署
```bash
./docker-deploy.sh
```

### 4. 访问应用
- 应用地址: http://localhost:3008
- 健康检查: http://localhost:3008/api/health

## 详细部署步骤

### 方式一：使用部署脚本（推荐）

#### 完整部署
```bash
# 完整部署（包括构建、配置、启动）
./docker-deploy.sh
```

#### 快速启动（已部署过）
```bash
# 快速启动已存在的服务
./docker-quick-start.sh
```

### 方式二：手动Docker Compose

#### 构建并启动
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

#### 仅启动应用（不包含Nginx）
```bash
docker-compose up -d qcoach-app
```

#### 启动包含Nginx代理
```bash
docker-compose --profile nginx up -d
```

### 方式三：纯Docker命令

#### 构建镜像
```bash
docker build -t qcoach-app:latest .
```

#### 运行容器
```bash
docker run -d \
  --name qcoach-app \
  -p 3008:3008 \
  -e OPENROUTER_API_KEY=your_api_key \
  -v qcoach-data:/app/prisma \
  qcoach-app:latest
```

## 服务管理

### 使用管理脚本
```bash
# 查看帮助
./docker-management.sh help

# 启动服务
./docker-management.sh start

# 停止服务
./docker-management.sh stop

# 重启服务
./docker-management.sh restart

# 查看状态
./docker-management.sh status

# 查看日志
./docker-management.sh logs

# 健康检查
./docker-management.sh health
```

### 直接使用Docker命令
```bash
# 查看容器状态
docker ps

# 查看日志
docker logs qcoach-app

# 进入容器
docker exec -it qcoach-app /bin/sh

# 重启容器
docker restart qcoach-app
```

## 配置文件说明

### Docker Compose 配置

#### 核心服务
- **qcoach-app**: 主应用服务，端口3008
- **qcoach-db-init**: 数据库初始化服务
- **qcoach-nginx**: Nginx反向代理（可选）

#### 数据卷
- **qcoach-data**: 持久化数据库文件

#### 网络
- **qcoach-network**: 内部通信网络

### 环境变量配置

#### 必需变量
```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

#### 可选变量
```bash
# 应用端口
PORT=3008

# 数据库URL
DATABASE_URL=file:./dev.db

# Node.js环境
NODE_ENV=production

# 禁用遥测
NEXT_TELEMETRY_DISABLED=1
```

### Nginx配置

如果启用Nginx代理，应用将通过以下方式访问：
- HTTP: http://localhost
- 直接访问: http://localhost:3008

Nginx配置包括：
- Gzip压缩
- 安全头设置
- 反向代理
- 健康检查端点

## 数据管理

### 数据持久化
数据库文件存储在Docker卷中，升级应用时数据不会丢失。

### 备份数据
```bash
# 使用管理脚本备份
./docker-management.sh backup

# 手动备份
docker cp qcoach-app:/app/prisma/dev.db ./backup-$(date +%Y%m%d).db
```

### 恢复数据
```bash
# 停止应用
docker-compose stop qcoach-app

# 恢复数据库文件
docker cp backup-20241227.db qcoach-app:/app/prisma/dev.db

# 重启应用
docker-compose start qcoach-app
```

### 重置数据库
```bash
# 使用管理脚本
./docker-management.sh db-reset

# 手动重置
docker-compose down
docker volume rm qcoach_qcoach-data
docker-compose up -d
```

## 监控和维护

### 健康检查
应用包含内置健康检查端点：
```bash
curl http://localhost:3008/api/health
```

### 查看日志
```bash
# 实时日志
docker-compose logs -f qcoach-app

# 最近100行日志
docker-compose logs --tail=100 qcoach-app
```

### 性能监控
```bash
# 查看容器资源使用
docker stats qcoach-app

# 查看容器详细信息
docker inspect qcoach-app
```

## 更新和升级

### 更新应用
```bash
# 使用管理脚本
./docker-management.sh update

# 手动更新
git pull
docker-compose build qcoach-app
docker-compose up -d qcoach-app
```

### 清理旧资源
```bash
# 使用管理脚本
./docker-management.sh clean

# 手动清理
docker system prune -f
docker image prune -f
```

## 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看容器日志
docker logs qcoach-app

# 检查配置
docker-compose config
```

#### 2. 数据库连接问题
```bash
# 检查数据库初始化
docker logs qcoach-db-init

# 重新初始化数据库
docker-compose up -d qcoach-db-init
```

#### 3. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :3008

# 修改端口配置
# 编辑 docker-compose.yml 中的端口映射
```

#### 4. 内存不足
```bash
# 检查系统资源
docker system df
free -h

# 清理未使用资源
docker system prune -a
```

### 调试模式

#### 启用调试日志
```bash
# 修改 docker-compose.yml 添加环境变量
environment:
  - DEBUG=*
  - NODE_ENV=development
```

#### 进入容器调试
```bash
# 进入运行中的容器
docker exec -it qcoach-app /bin/sh

# 运行临时调试容器
docker run -it --rm qcoach-app:latest /bin/sh
```

## 生产环境部署

### 安全配置

#### 1. 使用HTTPS
配置SSL证书并修改nginx.conf：
```bash
# 将SSL证书放在 ./ssl/ 目录
# 编辑 nginx.conf 启用HTTPS配置块
```

#### 2. 环境变量管理
```bash
# 使用Docker secrets管理敏感信息
echo "your_api_key" | docker secret create openrouter_key -
```

#### 3. 限制资源使用
在docker-compose.yml中添加：
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### 高可用部署

#### 多实例部署
```bash
# 扩展应用实例
docker-compose up -d --scale qcoach-app=3
```

#### 负载均衡
配置Nginx upstream实现负载均衡。

## 技术规格

### 镜像信息
- 基础镜像: node:18-alpine
- 应用端口: 3008
- 工作目录: /app
- 用户: nextjs (非root)

### 存储需求
- 应用镜像: ~200MB
- 数据卷: 根据使用量增长
- 临时存储: ~50MB

### 网络要求
- 出站: 访问OpenRouter API
- 入站: HTTP/HTTPS访问

## 支持和帮助

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查应用日志：`docker logs qcoach-app`
3. 查看容器状态：`docker ps`
4. 提交Issue到项目仓库 