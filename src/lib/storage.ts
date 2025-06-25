import { v4 as uuidv4 } from 'uuid';
import { Session, UserHistory, Statistics, Achievement, SessionStatus, AppMode } from '@/types';

const STORAGE_KEYS = {
  SESSIONS: 'q-coach-sessions',
  USER_HISTORY: 'q-coach-user-history',
  STATISTICS: 'q-coach-statistics',
  ACHIEVEMENTS: 'q-coach-achievements',
} as const;

// 本地存储管理类
export class LocalStorageManager {
  // 检查localStorage是否可用
  private isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // 通用的存储方法
  private setItem<T>(key: string, value: T): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // 通用的读取方法
  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      // 恢复Date对象
      return this.reviveDates(parsed) as T;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  }

  // 恢复Date对象
  private reviveDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // 检查是否是ISO日期字符串
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (dateRegex.test(obj)) {
        return new Date(obj);
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.reviveDates(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.reviveDates(obj[key]);
      }
      return result;
    }
    
    return obj;
  }

  // 会话管理
  saveSessions(sessions: Session[]): void {
    this.setItem(STORAGE_KEYS.SESSIONS, sessions);
  }

  getSessions(): Session[] {
    return this.getItem<Session[]>(STORAGE_KEYS.SESSIONS, []);
  }

  addSession(session: Session): void {
    const sessions = this.getSessions();
    sessions.push(session);
    this.saveSessions(sessions);
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      this.saveSessions(sessions);
    }
  }

  getSession(sessionId: string): Session | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // 用户历史记录
  saveUserHistory(history: UserHistory): void {
    this.setItem(STORAGE_KEYS.USER_HISTORY, history);
  }

  getUserHistory(): UserHistory {
    return this.getItem<UserHistory>(STORAGE_KEYS.USER_HISTORY, {
      sessions: [],
      totalSessions: 0,
      averageScore: 0,
      lastUpdated: new Date()
    });
  }

  // 统计数据
  saveStatistics(stats: Statistics): void {
    this.setItem(STORAGE_KEYS.STATISTICS, stats);
  }

  getStatistics(): Statistics {
    return this.getItem<Statistics>(STORAGE_KEYS.STATISTICS, {
      totalQuestions: 0,
      averageScore: 0,
      scoreHistory: [],
      categoryDistribution: [],
      achievements: [],
      streaks: { current: 0, longest: 0 }
    });
  }

  // 成就管理
  saveAchievements(achievements: Achievement[]): void {
    this.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }

  getAchievements(): Achievement[] {
    return this.getItem<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
  }

  // 清除所有数据
  clearAll(): void {
    if (!this.isAvailable()) return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // 导出数据
  exportData(): string {
    const data = {
      sessions: this.getSessions(),
      userHistory: this.getUserHistory(),
      statistics: this.getStatistics(),
      achievements: this.getAchievements(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  // 导入数据
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sessions) this.saveSessions(data.sessions);
      if (data.userHistory) this.saveUserHistory(data.userHistory);
      if (data.statistics) this.saveStatistics(data.statistics);
      if (data.achievements) this.saveAchievements(data.achievements);
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// 创建单例实例
export const storage = new LocalStorageManager();

// 便捷的会话创建函数
export function createSession(
  originalQuestion: string,
  mode: AppMode
): Session {
  return {
    id: uuidv4(),
    mode,
    startTime: new Date(),
    originalQuestion,
    chatMessages: [],
    status: SessionStatus.ANALYZING
  };
} 