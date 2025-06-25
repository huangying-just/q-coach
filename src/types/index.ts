// 问题分析结果类型
export interface QuestionAnalysis {
  score: number; // 0-10分
  is_good_question: boolean;
  primary_issue?: {
    category: ProblemCategory;
    explanation: string;
  };
  feedback: string;
  improved_question?: string;
}

// 问题分类枚举
export enum ProblemCategory {
  TOO_BROAD = "过于宽泛",
  MISSING_CONTEXT = "缺少上下文/细节", 
  UNCLEAR_GOAL = "目标不明确",
  EASILY_SEARCHABLE = "可以简单搜索",
  COMPOUND_QUESTION = "复合问题",
  FAULTY_PREMISE = "包含错误假设"
}

// 对话消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 用户历史记录类型
export interface UserHistory {
  id: string;
  originalQuestion: string;
  analysis?: QuestionAnalysis;
  chatMessages?: ChatMessage[];
  finalAnswer?: string;
  timestamp: Date;
}

// 应用模式
export enum AppMode {
  COACH = "coach", // 教练模式
  ASSISTANT = "assistant" // 助手模式
} 