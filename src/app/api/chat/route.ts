import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter';
import { ASSISTANT_MODE_PROMPT, FINAL_ANSWER_PROMPT } from '@/lib/prompts';
import { ChatMessage } from '@/types';
import { createSession, saveMessage, getSessionDetail } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { messages, shouldProvideAnswer = false, sessionId } = await request.json();

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

    // 保存会话和消息到数据库
    try {
      let currentSessionId = sessionId;
      
      // 如果没有会话ID，创建新会话
      if (!currentSessionId) {
        const firstUserMessage = messages.find((msg: ChatMessage) => msg.role === 'user');
        const title = firstUserMessage ? 
          `助手对话: ${firstUserMessage.content.slice(0, 30)}...` : 
          '助手模式对话';
        const session = await createSession('ASSISTANT', title);
        currentSessionId = session.id;
        
        // 保存所有历史消息（如果是新session）
        for (const msg of messages) {
          await saveMessage(
            currentSessionId,
            msg.role,
            msg.content,
            msg.role === 'user' ? 'question' : 'chat'
          );
        }
      } else {
        // 如果提供了sessionId，检查是否有新的用户消息需要保存
        const existingSession = await getSessionDetail(currentSessionId);
        if (existingSession) {
          const existingMessageCount = existingSession.messages.length;
          const newMessages = messages.slice(existingMessageCount);
          
          // 只保存新的消息
          for (const msg of newMessages) {
            await saveMessage(
              currentSessionId,
              msg.role,
              msg.content,
              msg.role === 'user' ? 'question' : 'chat'
            );
          }
        } else {
          // sessionId无效，创建新会话
          const firstUserMessage = messages.find((msg: ChatMessage) => msg.role === 'user');
          const title = firstUserMessage ? 
            `助手对话: ${firstUserMessage.content.slice(0, 30)}...` : 
            '助手模式对话';
          const session = await createSession('ASSISTANT', title);
          currentSessionId = session.id;
          
          // 保存所有消息
          for (const msg of messages) {
            await saveMessage(
              currentSessionId,
              msg.role,
              msg.content,
              msg.role === 'user' ? 'question' : 'chat'
            );
          }
        }
      }
      
      // 保存AI回复
      await saveMessage(
        currentSessionId,
        'assistant',
        response,
        shouldProvideAnswer ? 'answer' : 'chat'
      );
      
      return NextResponse.json({ 
        message: response,
        shouldProvideAnswer,
        sessionId: currentSessionId
      });
    } catch (dbError) {
      console.error('保存到数据库失败:', dbError);
      // 即使数据库保存失败，也返回聊天结果
      return NextResponse.json({ 
        message: response,
        shouldProvideAnswer,
        sessionId: sessionId || null
      });
    }

  } catch (error) {
    console.error('对话处理时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 