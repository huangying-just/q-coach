import { PrismaClient } from '../generated/prisma';

// 创建全局的Prisma客户端实例，避免在开发环境中重复创建连接
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 数据库连接健康检查
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 创建会话
export async function createSession(mode: 'COACH' | 'ASSISTANT', title?: string) {
  try {
    const session = await prisma.session.create({
      data: {
        mode,
        title: title || `${mode === 'COACH' ? '教练' : '助手'}模式对话`,
      },
    });
    return session;
  } catch (error) {
    console.error('创建会话失败:', error);
    throw new Error('创建会话失败');
  }
}

// 保存消息
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  type: 'question' | 'analysis' | 'chat' | 'answer',
  analysisScore?: number,
  analysisData?: any
) {
  try {
    const message = await prisma.message.create({
      data: {
        sessionId,
        role,
        content,
        type,
        analysisScore,
        analysisData,
      },
    });

    // 更新会话统计
    await updateSessionStats(sessionId, type);
    
    return message;
  } catch (error) {
    console.error('保存消息失败:', error);
    throw new Error('保存消息失败');
  }
}

// 更新会话统计
async function updateSessionStats(sessionId: string, messageType: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!session) return;

    const messageCount = session.messages.length + 1;
    const questionCount = session.messages.filter((m: any) => m.type === 'question').length + 
                         (messageType === 'question' ? 1 : 0);
    
    // 计算平均分数（仅针对有分析结果的消息）
    const analysisMessages = session.messages.filter((m: any) => m.analysisScore !== null);
    const averageScore = analysisMessages.length > 0 
      ? analysisMessages.reduce((sum: number, m: any) => sum + (m.analysisScore || 0), 0) / analysisMessages.length
      : null;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        messageCount,
        questionCount,
        averageScore,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('更新会话统计失败:', error);
  }
}

// 获取会话历史
export async function getSessionHistory(limit = 50, offset = 0) {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          // 不限制消息数量，获取完整对话历史
        },
      },
    });
    return sessions;
  } catch (error) {
    console.error('获取会话历史失败:', error);
    throw new Error('获取会话历史失败');
  }
}

// 获取完整会话详情
export async function getSessionDetail(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return session;
  } catch (error) {
    console.error('获取会话详情失败:', error);
    throw new Error('获取会话详情失败');
  }
}

// 删除会话
export async function deleteSession(sessionId: string) {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
    return true;
  } catch (error) {
    console.error('删除会话失败:', error);
    throw new Error('删除会话失败');
  }
}

// 获取用户统计数据
export async function getUserStats() {
  try {
    let stats = await prisma.userStats.findFirst();
    
    if (!stats) {
      // 如果没有统计记录，创建一个初始记录
      stats = await prisma.userStats.create({
        data: {},
      });
    }
    
    return stats;
  } catch (error) {
    console.error('获取用户统计失败:', error);
    throw new Error('获取用户统计失败');
  }
}

// 更新用户统计数据
export async function updateUserStats() {
  try {
    // 计算总体统计
    const totalSessions = await prisma.session.count();
    const totalQuestions = await prisma.message.count({
      where: { type: 'question' },
    });
    const totalCoachSessions = await prisma.session.count({
      where: { mode: 'COACH' },
    });
    const totalChatSessions = await prisma.session.count({
      where: { mode: 'ASSISTANT' },
    });

    // 计算平均分数
    const analysisMessages = await prisma.message.findMany({
      where: { 
        analysisScore: { not: null } 
      },
      select: { analysisScore: true },
    });
    
    const averageScore = analysisMessages.length > 0
      ? analysisMessages.reduce((sum: number, m: any) => sum + (m.analysisScore || 0), 0) / analysisMessages.length
      : null;
    
    const bestScore = analysisMessages.length > 0
      ? Math.max(...analysisMessages.map((m: any) => m.analysisScore || 0))
      : null;

    // 更新或创建统计记录
    const stats = await prisma.userStats.upsert({
      where: { id: 'user-stats' },
      update: {
        totalSessions,
        totalQuestions,
        totalCoachSessions,
        totalChatSessions,
        averageScore,
        bestScore,
        updatedAt: new Date(),
      },
      create: {
        id: 'user-stats',
        totalSessions,
        totalQuestions,
        totalCoachSessions,
        totalChatSessions,
        averageScore,
        bestScore,
      },
    });
    
    return stats;
  } catch (error) {
    console.error('更新用户统计失败:', error);
    throw new Error('更新用户统计失败');
  }
} 