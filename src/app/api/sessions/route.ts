import { NextRequest, NextResponse } from 'next/server';
import { getSessionHistory, createSession, deleteSession } from '@/lib/database';

// GET /api/sessions - 获取会话历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await getSessionHistory(limit, offset);
    
    return NextResponse.json({
      success: true,
      sessions,
      total: sessions.length,
    });
  } catch (error) {
    console.error('获取会话历史失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取会话历史失败' 
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions - 创建新会话
export async function POST(request: NextRequest) {
  try {
    const { mode, title } = await request.json();
    
    if (!mode || (mode !== 'COACH' && mode !== 'ASSISTANT')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的会话模式' 
        },
        { status: 400 }
      );
    }

    const session = await createSession(mode, title);
    
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '创建会话失败' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions - 删除会话
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少会话ID' 
        },
        { status: 400 }
      );
    }

    await deleteSession(sessionId);
    
    return NextResponse.json({
      success: true,
      message: '会话删除成功',
    });
  } catch (error) {
    console.error('删除会话失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '删除会话失败' 
      },
      { status: 500 }
    );
  }
} 