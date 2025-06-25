# Q-Coach 数据库设置指南

## 📋 概述

Q-Coach使用PostgreSQL数据库来存储会话历史记录和用户统计数据。本指南将帮助您完成数据库的安装和配置。

## 🚀 快速开始

### 步骤1：安装PostgreSQL

#### 方式A：使用Homebrew（推荐）
```bash
# 安装PostgreSQL
brew install postgresql

# 启动PostgreSQL服务
brew services start postgresql

# 创建数据库用户（可选）
createuser --interactive --pwprompt qcoach_user

# 创建数据库
createdb qcoach
```

#### 方式B：使用PostgreSQL.app
1. 访问 https://postgresapp.com/ 下载并安装
2. 启动PostgreSQL.app
3. 点击"Initialize"初始化数据库
4. 使用内置的命令行工具创建数据库：
   ```bash
   createdb qcoach
   ```

#### 方式C：使用Docker
```bash
# 拉取PostgreSQL镜像并运行
docker run --name qcoach-postgres \
  -e POSTGRES_DB=qcoach \
  -e POSTGRES_USER=qcoach_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# 检查容器状态
docker ps
```

### 步骤2：配置环境变量

编辑项目根目录的 `.env.local` 文件：

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Database Configuration
# 根据您的实际配置选择其中一种：

# 本地默认配置（无密码）
DATABASE_URL="postgresql://postgres:@localhost:5432/qcoach?schema=public"

# 本地有密码配置
DATABASE_URL="postgresql://qcoach_user:your_password@localhost:5432/qcoach?schema=public"

# Docker配置
DATABASE_URL="postgresql://qcoach_user:your_password@localhost:5432/qcoach?schema=public"

# 开发环境标识
NODE_ENV=development
```

### 步骤3：运行数据库迁移

```bash
# 生成并运行迁移
npx prisma migrate dev --name init

# 生成Prisma客户端
npx prisma generate
```

### 步骤4：验证数据库连接

```bash
# 查看数据库状态
npx prisma db pull

# 查看生成的表结构
npx prisma studio
```

## 🏗️ 数据库架构

### 表结构说明

#### Sessions 表（会话记录）
- `id`: 会话唯一标识
- `mode`: 模式类型（COACH/ASSISTANT）
- `title`: 会话标题
- `messageCount`: 消息总数
- `questionCount`: 问题总数
- `averageScore`: 平均评分
- `createdAt/updatedAt`: 时间戳

#### Messages 表（消息记录）
- `id`: 消息唯一标识
- `sessionId`: 所属会话ID
- `role`: 角色（user/assistant）
- `content`: 消息内容
- `type`: 消息类型
- `analysisScore`: 分析评分
- `analysisData`: 详细分析数据

#### UserStats 表（用户统计）
- `totalSessions`: 总会话数
- `totalQuestions`: 总问题数
- `averageScore`: 平均评分
- `bestScore`: 最高评分
- `achievementCounts`: 成就统计

## 🔧 常见问题排查

### 问题1：连接被拒绝
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**解决方案：**
- 检查PostgreSQL服务是否运行：`brew services list | grep postgresql`
- 启动服务：`brew services start postgresql`

### 问题2：数据库不存在
```
Error: database "qcoach" does not exist
```
**解决方案：**
```bash
createdb qcoach
```

### 问题3：权限问题
```
Error: permission denied for database
```
**解决方案：**
```bash
# 给用户授权
psql postgres
GRANT ALL PRIVILEGES ON DATABASE qcoach TO your_username;
```

### 问题4：端口占用
```
Error: port 5432 already in use
```
**解决方案：**
- 检查端口占用：`lsof -i :5432`
- 修改端口或停止其他PostgreSQL实例

## 🎯 开发环境推荐

### 可视化工具
1. **Prisma Studio**: `npx prisma studio`
2. **pgAdmin**: https://www.pgadmin.org/
3. **TablePlus**: https://tableplus.com/
4. **DBeaver**: https://dbeaver.io/

### 常用命令
```bash
# 查看数据库状态
npx prisma db pull

# 重置数据库
npx prisma migrate reset

# 查看迁移历史
npx prisma migrate status

# 部署迁移到生产环境
npx prisma migrate deploy
```

## 🚀 生产环境部署

### 推荐的云数据库服务
1. **Vercel Postgres**: https://vercel.com/storage/postgres
2. **Supabase**: https://supabase.com/
3. **PlanetScale**: https://planetscale.com/
4. **Railway**: https://railway.app/
5. **Heroku Postgres**: https://www.heroku.com/postgres

### 环境变量配置
```env
# 生产环境
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
NODE_ENV=production
```

## 📚 相关文档

- [Prisma文档](https://www.prisma.io/docs)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Next.js数据库集成](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

**注意**: 请确保在生产环境中使用强密码，并启用SSL连接。 