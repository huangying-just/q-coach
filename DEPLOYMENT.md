# Q-Coach Ubuntu 22 服务器部署指南

## 🚀 自动化部署

本项目提供了完整的Ubuntu 22.04服务器自动化部署脚本，可以一键部署Q-Coach应用。

### 📋 部署前准备

1. **服务器要求**：
   - Ubuntu 22.04 LTS
   - 至少2GB磁盘空间
   - 2GB以上内存
   - Root权限

2. **上传代码**：
   ```bash
   # 将项目代码上传到服务器
   scp -r ./q-coach/ user@your-server-ip:/tmp/
   ```

3. **连接服务器**：
   ```bash
   ssh user@your-server-ip
   cd /tmp/q-coach
   ```

### 🎯 一键部署

运行自动化部署脚本：

```bash
sudo ./deploy.sh
```

部署脚本将自动完成以下操作：

1. ✅ **系统检查** - 验证操作系统和资源
2. 📦 **系统更新** - 更新系统包
3. 🔧 **安装依赖** - 安装基础工具和构建环境
4. 🟢 **安装Node.js 20** - 使用NodeSource仓库
5. ⚡ **安装PM2** - 进程管理器
6. 🌐 **安装Nginx** - 反向代理服务器
7. 👤 **创建应用用户** - 安全运行应用
8. 🚀 **部署代码** - 复制和配置应用
9. 🔧 **配置环境** - 创建生产环境配置
10. 🗄️ **初始化数据库** - Prisma数据库设置
11. ⚡ **配置PM2** - 应用进程管理
12. 🌐 **配置Nginx** - 反向代理和负载均衡
13. 🔥 **配置防火墙** - 安全设置
14. 🚀 **启动应用** - 启动所有服务
15. 🔍 **验证部署** - 检查服务状态

### 📝 部署日志

部署过程中会生成详细的日志文件：
- 部署日志：`/tmp/q-coach-deploy-YYYYMMDD_HHMMSS.log`
- 错误日志：`/tmp/q-coach-error-YYYYMMDD_HHMMSS.log`

## 🔧 网络问题修复

如果遇到网络连接问题（如ETIMEDOUT错误），运行网络修复脚本：

```bash
./fix-network-issue.sh
```

此脚本会：
- 禁用npm遥测数据收集
- 配置国内镜像源
- 清除缓存并重新安装依赖
- 重新构建应用

## 🎮 应用管理

部署完成后，可以使用以下命令管理应用：

```bash
# 启动应用
qcoach-start

# 停止应用
qcoach-stop

# 重启应用
qcoach-restart

# 查看状态
qcoach-status

# 查看日志
qcoach-logs
```

## 📁 重要文件位置

- **应用目录**：`/opt/q-coach/`
- **环境配置**：`/opt/q-coach/.env.production`
- **PM2配置**：`/opt/q-coach/ecosystem.config.js`
- **Nginx配置**：`/etc/nginx/sites-available/q-coach`
- **应用日志**：`/opt/q-coach/logs/`

## ⚙️ 配置修改

### 1. 修改环境变量

编辑生产环境配置：
```bash
sudo nano /opt/q-coach/.env.production
```

必要的配置项：
```env
# OpenRouter API配置
OPENROUTER_API_KEY=your_actual_api_key

# 数据库配置
DATABASE_URL="file:./production.db"

# 应用配置
NODE_ENV=production
PORT=3008
NEXT_TELEMETRY_DISABLED=1
```

### 2. 重启应用使配置生效

```bash
qcoach-restart
```

## 🔍 故障排查

### 常见问题

1. **网络连接超时**：
   ```bash
   ./fix-network-issue.sh
   ```

2. **应用无法启动**：
   ```bash
   qcoach-logs
   # 选择查看错误日志
   ```

3. **端口被占用**：
   ```bash
   sudo netstat -tlnp | grep :3008
   sudo kill -9 <PID>
   qcoach-restart
   ```

4. **Nginx配置错误**：
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

5. **数据库问题**：
   ```bash
   cd /opt/q-coach
   sudo -u qcoach npx prisma db push
   ```

### 查看服务状态

```bash
# 检查所有服务状态
qcoach-status

# 查看系统资源使用
top
df -h
free -h

# 查看网络连接
netstat -tlnp
```

### 日志文件位置

- **应用输出日志**：`/opt/q-coach/logs/out.log`
- **应用错误日志**：`/opt/q-coach/logs/err.log`
- **Nginx访问日志**：`/var/log/nginx/q-coach_access.log`
- **Nginx错误日志**：`/var/log/nginx/q-coach_error.log`
- **系统日志**：`/var/log/syslog`

## 🔒 安全配置

### 防火墙规则

```bash
# 查看防火墙状态
sudo ufw status

# 允许特定IP访问
sudo ufw allow from YOUR_IP_ADDRESS

# 限制SSH访问
sudo ufw limit ssh
```

### SSL证书配置（可选）

使用Let's Encrypt配置HTTPS：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 性能优化

### PM2集群模式

修改`/opt/q-coach/ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'q-coach',
    script: 'npm',
    args: 'start',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    // ... 其他配置
  }]
};
```

### Nginx优化

编辑`/etc/nginx/sites-available/q-coach`添加缓存和压缩配置。

## 🔄 更新部署

更新应用代码：

```bash
# 停止应用
qcoach-stop

# 备份当前版本
sudo cp -r /opt/q-coach /opt/q-coach-backup-$(date +%Y%m%d)

# 上传新代码并覆盖
sudo cp -r /path/to/new/code/* /opt/q-coach/

# 安装新依赖
cd /opt/q-coach
sudo -u qcoach npm ci --production
sudo -u qcoach npm run build

# 重启应用
qcoach-start
```

## 📞 技术支持

如果遇到问题，请：

1. 检查部署日志文件
2. 运行`qcoach-status`查看服务状态
3. 查看相关错误日志
4. 检查网络连接和防火墙设置

部署成功后，通过浏览器访问：`http://your-server-ip`

---

**注意**：首次部署后，请务必修改默认配置并重启应用以确保安全性和功能正常。 