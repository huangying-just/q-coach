import { NextRequest, NextResponse } from 'next/server';
import { getSessionDetail } from '@/lib/database';

// GET /api/sessions/[id] - 获取会话详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '会话ID不能为空' },
        { status: 400 }
      );
    }

    const session = await getSessionDetail(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: '会话不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('获取会话详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取会话详情失败' },
      { status: 500 }
    );
  }
} 