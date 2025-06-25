import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatState, Session, SessionStatus, AppMode } from '@/types';
import { storage, createSession } from '@/lib/storage';

export function useChatHistory() {
  const [chatState, setChatState] = useState<ChatState>({
    sessionId: '',
    messages: [],
    isAnalyzing: false,
    needsMoreInfo: false,
    collectedInfo: {}
  });

  // 开始新的对话会话
  const startNewChat = useCallback((originalQuestion: string, mode: AppMode) => {
    const session = createSession(originalQuestion, mode);
    storage.addSession(session);

    const initialMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: originalQuestion,
      timestamp: new Date()
    };

    setChatState({
      sessionId: session.id,
      messages: [initialMessage],
      isAnalyzing: true,
      needsMoreInfo: false,
      collectedInfo: {}
    });

    return session.id;
  }, []);

  // 添加消息到对话
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      ...message
    };

    setChatState(prev => {
      const updatedMessages = [...prev.messages, newMessage];
      
      // 更新存储中的会话
      storage.updateSession(prev.sessionId, {
        chatMessages: updatedMessages
      });

      return {
        ...prev,
        messages: updatedMessages
      };
    });

    return newMessage;
  }, []);

  // 更新对话状态
  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  // 设置分析结果
  const setAnalysisResult = useCallback((analysis: any) => {
    storage.updateSession(chatState.sessionId, {
      analysis,
      status: analysis.is_good_question ? SessionStatus.COMPLETED : SessionStatus.CHATTING
    });
  }, [chatState.sessionId]);

  // 完成对话会话
  const completeSession = useCallback((finalAnswer?: string) => {
    storage.updateSession(chatState.sessionId, {
      finalAnswer,
      status: SessionStatus.COMPLETED,
      endTime: new Date()
    });

    setChatState(prev => ({
      ...prev,
      isAnalyzing: false,
      needsMoreInfo: false
    }));
  }, [chatState.sessionId]);

  // 获取当前会话
  const getCurrentSession = useCallback((): Session | null => {
    return storage.getSession(chatState.sessionId);
  }, [chatState.sessionId]);

  // 重置对话状态
  const resetChat = useCallback(() => {
    setChatState({
      sessionId: '',
      messages: [],
      isAnalyzing: false,
      needsMoreInfo: false,
      collectedInfo: {}
    });
  }, []);

  // 发送消息到API
  const sendMessage = useCallback(async (content: string) => {
    // 添加用户消息
    addMessage({ role: 'user', content });

    // 设置加载状态
    updateChatState({ isAnalyzing: true });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatState.messages, { role: 'user', content }],
          shouldProvideAnswer: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      // 添加AI回复
      addMessage({ role: 'assistant', content: data.message });

      // 更新状态
      updateChatState({
        isAnalyzing: false,
        needsMoreInfo: !data.shouldProvideAnswer
      });

      // 如果需要提供最终答案
      if (data.shouldProvideAnswer) {
        completeSession(data.message);
      }

      return data;
    } catch (error) {
      updateChatState({ isAnalyzing: false });
      throw error;
    }
  }, [chatState.messages, addMessage, updateChatState, completeSession]);

  return {
    chatState,
    startNewChat,
    addMessage,
    updateChatState,
    setAnalysisResult,
    completeSession,
    getCurrentSession,
    resetChat,
    sendMessage
  };
} 