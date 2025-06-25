import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter';
import { ASSISTANT_MODE_PROMPT, FINAL_ANSWER_PROMPT } from '@/lib/prompts';
import { ChatMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { messages, shouldProvideAnswer = false } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的对话历史' },
        { status: 400 }
      );
    }

    const client = createOpenRouterClient();
    
    // 构建对话消息
    const conversationMessages = [
      { 
        role: 'system' as const, 
        content: shouldProvideAnswer ? FINAL_ANSWER_PROMPT : ASSISTANT_MODE_PROMPT 
      },
      ...messages.map((msg: ChatMessage) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    const response = await client.continueConversation(conversationMessages);

    return NextResponse.json({ 
      message: response,
      shouldProvideAnswer 
    });

  } catch (error) {
    console.error('对话处理时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 