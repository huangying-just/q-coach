import { Session, Statistics, ScoreEntry, CategoryStats, ProblemCategory, AppMode, SessionStatus } from '@/types';
import { startOfDay, subDays, format } from 'date-fns';

export class AnalyticsEngine {
  // 计算用户统计数据
  static calculateStatistics(sessions: Session[]): Statistics {
    const completedSessions = sessions.filter(s => s.status === SessionStatus.COMPLETED && s.analysis);
    
    if (completedSessions.length === 0) {
      return {
        totalQuestions: 0,
        averageScore: 0,
        scoreHistory: [],
        categoryDistribution: [],
        achievements: [],
        streaks: { current: 0, longest: 0 }
      };
    }

    const totalQuestions = completedSessions.length;
    const averageScore = completedSessions.reduce((sum, s) => sum + (s.analysis?.score || 0), 0) / totalQuestions;
    
    return {
      totalQuestions,
      averageScore,
      scoreHistory: this.generateScoreHistory(completedSessions),
      categoryDistribution: this.calculateCategoryDistribution(completedSessions),
      achievements: this.calculateAchievements(completedSessions),
      streaks: this.calculateStreaks(completedSessions)
    };
  }

  // 生成评分历史
  private static generateScoreHistory(sessions: Session[]): ScoreEntry[] {
    return sessions
      .map(session => ({
        date: session.startTime,
        score: session.analysis?.score || 0,
        category: session.analysis?.primary_issue?.category,
        mode: session.mode
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 计算分类分布
  private static calculateCategoryDistribution(sessions: Session[]): CategoryStats[] {
    const lowScoreSessions = sessions.filter(s => (s.analysis?.score || 0) < 7);
    
    if (lowScoreSessions.length === 0) {
      return [];
    }

    const categoryCounts = new Map<ProblemCategory, number>();
    
    // 统计各类别问题的数量
    lowScoreSessions.forEach(session => {
      const category = session.analysis?.primary_issue?.category;
      if (category) {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      }
    });

    // 计算趋势（最近30天 vs 之前30天）
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);
    
    const categoryStats: CategoryStats[] = [];
    
    categoryCounts.forEach((count, category) => {
      const percentage = (count / lowScoreSessions.length) * 100;
      
      const recentCount = lowScoreSessions.filter(s => 
        new Date(s.startTime) >= thirtyDaysAgo && 
        s.analysis?.primary_issue?.category === category
      ).length;
      
      const previousCount = lowScoreSessions.filter(s => 
        new Date(s.startTime) >= sixtyDaysAgo && 
        new Date(s.startTime) < thirtyDaysAgo &&
        s.analysis?.primary_issue?.category === category
      ).length;

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (previousCount > 0) {
        const trendRatio = recentCount / previousCount;
        if (trendRatio < 0.8) trend = 'improving';
        else if (trendRatio > 1.2) trend = 'declining';
      }

      categoryStats.push({
        category,
        count,
        percentage,
        trend
      });
    });

    return categoryStats.sort((a, b) => b.count - a.count);
  }

  // 计算连续记录
  private static calculateStreaks(sessions: Session[]): { current: number; longest: number } {
    if (sessions.length === 0) return { current: 0, longest: 0 };

    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // 计算当前连续天数
    for (const session of sortedSessions) {
      const sessionDate = startOfDay(new Date(session.startTime));
      
      if (!lastDate) {
        currentStreak = 1;
        tempStreak = 1;
        lastDate = sessionDate;
      } else {
        const daysDiff = Math.abs((sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          if (currentStreak === 0) currentStreak = tempStreak;
        } else if (daysDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          currentStreak = 0;
        }
        
        lastDate = sessionDate;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { current: currentStreak, longest: longestStreak };
  }

  // 计算成就
  private static calculateAchievements(sessions: Session[]): any[] {
    const achievements = [];
    const totalQuestions = sessions.length;
    const averageScore = sessions.reduce((sum, s) => sum + (s.analysis?.score || 0), 0) / totalQuestions;
    const highScoreCount = sessions.filter(s => (s.analysis?.score || 0) >= 8).length;

    // 新手成就
    if (totalQuestions >= 1) {
      achievements.push({
        id: 'first_question',
        title: '初次提问',
        description: '提出了第一个问题',
        icon: '🎯',
        unlockedAt: sessions[0].startTime,
        progress: 100,
        target: 1
      });
    }

    // 积极提问者
    if (totalQuestions >= 10) {
      achievements.push({
        id: 'active_questioner',
        title: '积极提问者',
        description: '已提出10个问题',
        icon: '💪',
        unlockedAt: sessions[9].startTime,
        progress: 100,
        target: 10
      });
    }

    // 高质量提问者
    if (highScoreCount >= 5) {
      achievements.push({
        id: 'quality_questioner',
        title: '高质量提问者',
        description: '获得5次高分评价(≥8分)',
        icon: '⭐',
        unlockedAt: new Date(),
        progress: 100,
        target: 5
      });
    }

    // 持续改进者
    if (averageScore >= 7) {
      achievements.push({
        id: 'continuous_improver',
        title: '持续改进者',
        description: '平均得分达到7分',
        icon: '📈',
        unlockedAt: new Date(),
        progress: 100,
        target: 7
      });
    }

    return achievements;
  }

  // 生成最近30天的趋势数据
  static generateTrendData(sessions: Session[]): { date: string; score: number; count: number }[] {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MM-dd'),
        fullDate: startOfDay(date),
        score: 0,
        count: 0
      };
    });

    const completedSessions = sessions.filter(s => 
      s.status === SessionStatus.COMPLETED && 
      s.analysis &&
      new Date(s.startTime) >= subDays(new Date(), 30)
    );

    // 按日期分组计算平均分
    const sessionsByDate = new Map<string, Session[]>();
    completedSessions.forEach(session => {
      const dateKey = format(startOfDay(new Date(session.startTime)), 'MM-dd');
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }
      sessionsByDate.get(dateKey)!.push(session);
    });

    // 计算每天的平均分和问题数
    last30Days.forEach(day => {
      const daySessions = sessionsByDate.get(day.date) || [];
      if (daySessions.length > 0) {
        day.score = daySessions.reduce((sum, s) => sum + (s.analysis?.score || 0), 0) / daySessions.length;
        day.count = daySessions.length;
      }
    });

    return last30Days.map(({ date, score, count }) => ({ date, score, count }));
  }

  // 获取改进建议
  static getImprovementSuggestions(stats: Statistics): string[] {
    const suggestions = [];

    if (stats.averageScore < 5) {
      suggestions.push('建议多提供问题的背景信息和具体细节');
    }

    if (stats.averageScore < 7) {
      suggestions.push('尝试将问题描述得更加具体和明确');
    }

    // 根据问题分类给出建议
    const topCategory = stats.categoryDistribution[0];
    if (topCategory) {
      switch (topCategory.category) {
        case ProblemCategory.TOO_BROAD:
          suggestions.push('将宽泛的问题分解为具体的小问题');
          break;
        case ProblemCategory.MISSING_CONTEXT:
          suggestions.push('提问时请提供更多的上下文和背景信息');
          break;
        case ProblemCategory.UNCLEAR_GOAL:
          suggestions.push('明确说明你希望通过这个问题达到什么目标');
          break;
        case ProblemCategory.EASILY_SEARCHABLE:
          suggestions.push('对于基础问题，可以先尝试搜索，然后问更深入的问题');
          break;
      }
    }

    if (stats.streaks.current === 0) {
      suggestions.push('保持每天练习提问，养成良好的思考习惯');
    }

    return suggestions;
  }
} 