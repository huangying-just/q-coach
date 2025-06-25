# Q-Coach - AI提问质量优化专家 🎯

一个革命性的AI应用，通过即时反馈和智能引导，系统性地提升用户向AI提问的能力，从而解锁人机协作的全部潜力。

## ✨ 核心功能

### 🎯 教练模式 (Coach Mode)
- **智能分析**：对用户问题进行0-10分评分
- **问题分类**：识别问题类型（过于宽泛、缺少上下文等）
- **优化建议**：提供具体的改进建议和优化示例
- **即时反馈**：友好、建设性的反馈，避免批评

### 💬 助手模式 (Assistant Mode) 
- **智能引导**：通过追问获取关键信息（开发中）
- **自然对话**：像真人顾问一样友好交流
- **完整答案**：收集足够信息后提供详细回答

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装与运行
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
open http://localhost:3000
```

### 环境配置
创建 `.env.local` 文件：
```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash-lite-preview-06-17
NEXT_PUBLIC_APP_NAME=Q-Coach
```

## 🏗️ 技术架构

### 前端
- **Next.js 14** - React全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 现代化样式
- **Lucide React** - 图标库

### 后端
- **Next.js API Routes** - 服务器端API
- **OpenRouter** - AI模型接口
- **Axios** - HTTP客户端

### AI模型
- **Google Gemini 2.5 Flash Lite** - 快速、成本效益高的模型
- **系统提示词** - 精心设计的分析引擎

## 📁 项目结构

```
q-coach-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-question/route.ts  # 问题分析API
│   │   │   └── chat/route.ts              # 对话API
│   │   ├── page.tsx                       # 主页面
│   │   └── layout.tsx                     # 布局
│   ├── components/
│   │   ├── QuestionInput.tsx              # 问题输入组件
│   │   ├── AnalysisResult.tsx             # 分析结果展示
│   │   └── ChatInterface.tsx              # 对话界面(待开发)
│   ├── lib/
│   │   ├── openrouter.ts                  # OpenRouter客户端
│   │   └── prompts.ts                     # 系统提示词
│   └── types/
│       └── index.ts                       # 类型定义
├── .env.local                             # 环境变量
└── README.md
```

## 🎯 问题评分标准

Q-Coach基于以下四个维度对问题进行评分：

1. **清晰度 (Clarity)** - 问题是否无歧义？
2. **具体性 (Specificity)** - 是否包含足够的细节？
3. **上下文 (Context)** - 是否提供了必要的背景信息？
4. **可操作性 (Actionability)** - 问题是否导向明确的答案？

### 问题分类
- 过于宽泛
- 缺少上下文/细节
- 目标不明确
- 可以简单搜索
- 复合问题
- 包含错误假设

## 🌟 使用示例

### 低分问题 (3/10)
```
"如何学好编程？"
```

### 高分问题 (9/10)
```
"我是一名市场营销专业的大学生，对Python数据分析很感兴趣，
希望在毕业前掌握基础技能。我已经学完了Python基础语法，
现在应该学习哪些数据分析库，以及如何制定3个月的学习计划？"
```

## 🚀 开发路线图

### 阶段1：MVP ✅
- [x] 问题分析引擎
- [x] 教练模式UI
- [x] 基础评分系统
- [x] OpenRouter集成

### 阶段2：完善功能
- [ ] 助手模式实现
- [ ] 用户历史记录
- [ ] 成长看板
- [ ] 模式切换优化

### 阶段3：高级特性
- [ ] 用户系统
- [ ] 游戏化元素
- [ ] 多语言支持
- [ ] 性能优化

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进Q-Coach！

## 📄 许可证

MIT License

---

**Q-Coach - 让每一次提问都更有价值** ✨
