# Q-Coach - AI提问质量优化专家 🎯

一个完整的AI应用，通过双模式智能引导系统性地提升用户向AI提问的能力。采用教练模式和助手模式，从问题分析到最终答案，提供完整的智能对话优化解决方案。

## ✨ 核心功能

### 🎯 教练模式 (Coach Mode)
- **智能分析**：基于4个维度进行0-10分评分
- **问题分类**：识别6种常见问题类型
- **优化建议**：提供具体的改进建议和优化示例
- **即时反馈**：友好、建设性的反馈体验

### 💬 助手模式 (Assistant Mode) 
- **智能引导**：通过追问获取关键信息
- **自然对话**：像真人顾问一样友好交流
- **完整流程**：从问题分析到最终答案的闭环体验

### 📊 数据管理
- **完整对话周期**：每个session包含完整的交互历史
- **智能历史记录**：时间线式对话展示和统计分析
- **成长看板**：用户问题质量趋势和数据洞察

## 🚀 快速开始

### 📋 环境要求

- **Node.js**: 18.0 或更高版本
- **npm**: 8.0 或更高版本
- **Git**: 用于克隆项目

### 📥 安装步骤

#### 1. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/huangying-just/q-coach.git

# 进入项目目录
cd q-coach
```

#### 2. 安装依赖

```bash
# 安装所有依赖包
npm install
```

#### 3. 环境配置

创建 `.env.local` 文件：

```bash
# 复制环境变量模板
cp .env .env.local
```

在 `.env.local` 文件中配置：

```env
# OpenRouter API配置 (必需)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.5-flash-lite

# 应用配置 (可选)
NEXT_PUBLIC_APP_NAME=Q-Coach
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 数据库配置 (自动生成)
DATABASE_URL="file:./dev.db"
```

#### 4. 获取OpenRouter API Key

1. 访问 [OpenRouter官网](https://openrouter.ai/)
2. 注册账号并获取API Key
3. 将API Key填入 `.env.local` 文件中的 `OPENROUTER_API_KEY`

#### 5. 数据库初始化

```bash
# 生成Prisma客户端
npx prisma generate

# 初始化数据库
npx prisma db push

# (可选) 查看数据库
npx prisma studio
```

#### 6. 启动开发服务器

```bash
# 启动开发服务器
npm run dev
```

#### 7. 访问应用

```bash
# 自动打开浏览器 (macOS)
open http://localhost:3000

# 或手动访问
# Windows: start http://localhost:3000
# Linux: xdg-open http://localhost:3000
```

### 🔧 常见问题解决

#### 端口冲突
如果3000端口被占用，Next.js会自动使用其他端口（如3001、3002等）

#### API Key错误
确保OpenRouter API Key正确且有足够的额度

#### 数据库错误
```bash
# 重新生成数据库
rm prisma/dev.db
npx prisma db push
```

#### 依赖问题
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 🎮 使用指南

### 🎯 教练模式使用

1. **输入问题**
   - 在首页输入框中输入您的问题
   - 点击"分析问题"按钮

2. **查看分析结果**
   - 评分：0-10分的质量评分
   - 分类：问题类型识别
   - 反馈：具体改进建议
   - 优化示例：改进后的问题版本

3. **应用建议**
   - 根据反馈优化您的问题
   - 重新提交分析验证改进效果

### 💬 助手模式使用

1. **切换模式**
   - 在页面顶部选择"助手模式"

2. **开始对话**
   - 输入您的初始问题
   - AI会根据需要进行追问

3. **配合交互**
   - 回答AI的追问以提供更多信息
   - 每次回复都会让AI更好地理解您的需求

4. **获得答案**
   - 信息收集完整后，AI会提供详细的最终答案
   - 整个对话会保存在历史记录中

### 📊 历史记录查看

1. **访问历史**
   - 点击侧边栏的"历史记录"
   - 查看所有完整的对话周期

2. **对话详情**
   - 展开任意对话查看详细时间线
   - 包含统计信息和对话总结

3. **成长分析**
   - 查看问题质量趋势
   - 分析改进进展

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 15** - React全栈框架，使用App Router
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 原子化CSS框架
- **Lucide React** - 现代化图标库
- **date-fns** - 日期处理库（中文本地化）

### 后端技术栈
- **Next.js API Routes** - 服务器端API
- **Prisma ORM** - 类型安全的数据库ORM
- **SQLite** - 轻量级本地数据库
- **OpenRouter** - AI模型接口服务

### AI技术
- **Google Gemini 2.5 Flash Lite** - 快速响应的AI模型
- **系统提示词工程** - 精心设计的分析引擎
- **智能JSON解析** - 支持多种AI回复格式

### 开发工具
- **ESLint** - 代码质量检查
- **Turbopack** - 快速的开发构建工具
- **Git** - 版本控制

## 📁 项目结构详解

```
Q-coach/
├── src/                          # 源代码目录
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API路由
│   │   │   ├── analyze-question/ # 问题分析API
│   │   │   ├── chat/            # 智能对话API
│   │   │   └── sessions/        # 会话管理API
│   │   ├── dashboard/           # 成长看板页面
│   │   ├── history/             # 历史记录页面
│   │   ├── layout.tsx           # 根布局
│   │   ├── page.tsx             # 首页
│   │   └── globals.css          # 全局样式
│   ├── components/              # React组件
│   │   ├── ChatInterface.tsx    # 智能对话界面
│   │   ├── HistoryPanel.tsx     # 历史记录面板
│   │   ├── GrowthDashboard.tsx  # 成长看板
│   │   ├── Sidebar.tsx          # 侧边栏导航
│   │   ├── QuestionInput.tsx    # 问题输入组件
│   │   └── AnalysisResult.tsx   # 分析结果展示
│   ├── hooks/                   # 自定义React Hooks
│   │   ├── useChatHistory.ts    # 对话历史管理
│   │   └── useLocalStorage.ts   # 本地存储
│   ├── lib/                     # 工具库
│   │   ├── openrouter.ts        # OpenRouter客户端
│   │   ├── prompts.ts           # 系统提示词
│   │   ├── database.ts          # 数据库操作
│   │   ├── analytics.ts         # 数据分析
│   │   └── storage.ts           # 存储管理
│   └── types/                   # TypeScript类型定义
│       └── index.ts             # 统一类型导出
├── prisma/                      # 数据库相关
│   └── schema.prisma            # 数据模型定义
├── public/                      # 静态资源
├── .env.local                   # 环境变量 (需要创建)
├── package.json                 # 项目依赖
├── tsconfig.json                # TypeScript配置
├── tailwind.config.ts           # Tailwind配置
├── next.config.ts               # Next.js配置
├── CHANGELOG.md                 # 更新日志
├── PROJECT_SUMMARY.md           # 项目总结
└── README.md                    # 项目文档
```

## 🎯 问题评分标准

Q-Coach基于以下四个维度对问题进行综合评分：

### 评分维度
1. **清晰度 (Clarity)** - 问题是否无歧义，表达清楚？
2. **具体性 (Specificity)** - 是否包含足够的细节和具体信息？
3. **上下文 (Context)** - 是否提供了必要的背景信息？
4. **可操作性 (Actionability)** - 问题是否导向明确的答案或行动？

### 问题分类（当分数<7时）
- **过于宽泛** - 问题范围太大，无法在一次回答中有效解决
- **缺少上下文/细节** - 没有提供理解问题所需的背景信息
- **目标不明确** - 不清楚提问者希望通过答案实现什么
- **可以简单搜索** - 可以通过搜索引擎快速找到答案的事实性问题
- **复合问题** - 在一个问题中包含太多不相关的小问题
- **包含错误假设** - 问题基于一个不正确的假设

## 🌟 使用示例

### ❌ 低分问题示例 (3/10)
```
"如何学好编程？"
```
**问题分析**: 过于宽泛，缺少具体背景和目标

### ✅ 高分问题示例 (9/10)
```
"我是一名市场营销专业的大学生，对Python数据分析很感兴趣，
希望在毕业前掌握基础技能用于市场数据分析。我已经学完了Python
基础语法，现在应该按什么顺序学习pandas、matplotlib、seaborn
这些数据分析库，以及如何制定一个3个月的学习计划？"
```
**优势**: 提供了明确的背景、具体目标、当前状态和期望时间框架

## 🎮 完整对话周期体验

### 阶段1：问题提出 🚀
用户输入初始问题，系统接收并准备分析

### 阶段2：质量分析 🔍  
AI分析问题质量，提供评分和分类反馈

### 阶段3：信息澄清 💬
AI智能追问，收集必要的补充信息

### 阶段4：问题优化 ⚡
深入讨论，优化问题表达和目标

### 阶段5：完整解答 ✅
AI提供详细、实用的最终答案

## 🚀 开发和部署

### 开发环境

```bash
# 开发模式启动
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库管理
npx prisma studio
```

### 生产部署

1. **环境变量配置**
   ```env
   OPENROUTER_API_KEY=your_production_api_key
   DATABASE_URL=your_production_database_url
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. **构建和部署**
   ```bash
   npm run build
   npm start
   ```

3. **数据库迁移**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 🛠️ 开发指南

### 添加新功能

1. **API路由**：在 `src/app/api/` 目录下创建新的路由
2. **组件**：在 `src/components/` 目录下创建新组件
3. **类型定义**：在 `src/types/index.ts` 中添加类型
4. **数据模型**：在 `prisma/schema.prisma` 中定义新模型

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint规则
- 组件使用函数式组件和Hooks
- API路由使用async/await模式

### 测试

```bash
# 运行类型检查
npx tsc --noEmit

# 运行ESLint检查
npm run lint
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. **Fork项目**
2. **创建功能分支**：`git checkout -b feature/your-feature`
3. **提交更改**：`git commit -m 'Add some feature'`
4. **推送分支**：`git push origin feature/your-feature`
5. **创建Pull Request**

### Commit规范
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建过程或辅助工具变动

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [项目仓库](https://github.com/huangying-just/q-coach)
- [问题反馈](https://github.com/huangying-just/q-coach/issues)
- [OpenRouter官网](https://openrouter.ai/)
- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看本文档的常见问题部分
2. 搜索现有的 [Issues](https://github.com/huangying-just/q-coach/issues)
3. 创建新的Issue进行反馈

---

**Q-Coach v2.0 - 让每一次AI对话都成为学习和成长的机会** ✨

*从问题分析到最终答案，体验完整的智能对话优化之旅*
