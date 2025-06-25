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

// 会话类型
export interface Session {
  id: string;
  mode: AppMode;
  startTime: Date;
  endTime?: Date;
  originalQuestion: string;
  analysis?: QuestionAnalysis;
  chatMessages: ChatMessage[];
  finalAnswer?: string;
  status: SessionStatus;
}

// 会话状态
export enum SessionStatus {
  PENDING = "pending",
  ANALYZING = "analyzing",
  CHATTING = "chatting", 
  COMPLETED = "completed",
  ABANDONED = "abandoned"
}

// 用户历史记录类型
export interface UserHistory {
  sessions: Session[];
  totalSessions: number;
  averageScore: number;
  lastUpdated: Date;
}

// 应用模式
export enum AppMode {
  COACH = "coach", // 教练模式
  ASSISTANT = "assistant" // 助手模式
}

// 统计数据类型
export interface Statistics {
  totalQuestions: number;
  averageScore: number;
  scoreHistory: ScoreEntry[];
  categoryDistribution: CategoryStats[];
  achievements: Achievement[];
  streaks: {
    current: number;
    longest: number;
  };
}

// 评分历史条目
export interface ScoreEntry {
  date: Date;
  score: number;
  category?: ProblemCategory;
  mode: AppMode;
}

// 分类统计
export interface CategoryStats {
  category: ProblemCategory;
  count: number;
  percentage: number;
  trend: 'improving' | 'stable' | 'declining';
}

// 成就类型
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number; // 0-100
  target: number;
}

// 对话状态类型
export interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  isAnalyzing: boolean;
  needsMoreInfo: boolean;
  collectedInfo: Record<string, any>;
}

// API响应类型
export interface AnalysisResponse {
  analysis: QuestionAnalysis;
}

export interface ChatResponse {
  message: string;
  shouldProvideAnswer: boolean;
  needsMoreInfo?: boolean;
  suggestedQuestions?: string[];
} 