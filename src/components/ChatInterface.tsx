import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'question' | 'analysis' | 'chat' | 'answer';
  analysisScore?: number;
  analysisData?: any;
}

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  isAnalyzing: boolean;
  needsMoreInfo: boolean;
  collectedInfo: Record<string, any>;
}

interface ChatInterfaceProps {
  initialQuestion: string;
  onComplete?: (finalAnswer: string) => void;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function ChatInterface({ 
  initialQuestion, 
  onComplete,
  onAnalysisComplete 
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState('');
  const [chatState, setChatState] = useState<ChatState>({
    sessionId: '',
    messages: [],
    isAnalyzing: false,
    needsMoreInfo: false,
    collectedInfo: {}
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  // 更新聊天状态的辅助函数
  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  // 添加消息到对话
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    return newMessage;
  }, []);

  // 初始化对话：分析问题
  useEffect(() => {
    if (initialQuestion && chatState.messages.length === 0) {
      handleInitialAnalysis();
    }
  }, [initialQuestion]);

  const handleInitialAnalysis = useCallback(async () => {
    if (!initialQuestion.trim()) return;

    // 添加用户的初始问题
    addMessage({ 
      role: 'user', 
      content: initialQuestion,
      type: 'question'
    });

    // 设置分析状态
    updateChatState({ isAnalyzing: true });

    try {
      // 调用问题分析API
      const response = await fetch('/api/analyze-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: initialQuestion.trim(),
          sessionId: chatState.sessionId // 传递当前sessionId，如果为空则API会创建新的
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }

      // 保存sessionId（如果是新创建的）
      if (data.sessionId && !chatState.sessionId) {
        updateChatState({ sessionId: data.sessionId });
      }

      // 添加分析结果消息
      addMessage({ 
        role: 'assistant', 
        content: data.analysis.feedback,
        type: 'analysis',
        analysisScore: data.analysis.score,
        analysisData: data.analysis
      });

      // 通知父组件分析完成
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }

      // 根据分析结果决定下一步
      if (data.analysis.is_good_question) {
        // 问题质量良好，开始提供答案
        await provideDirectAnswer();
      } else {
        // 问题需要改进，开始追问流程
        await startFollowUpQuestions();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析问题时发生错误');
      updateChatState({ isAnalyzing: false });
    }
  }, [initialQuestion, onAnalysisComplete, addMessage, updateChatState]);

  // 直接提供答案（适用于高质量问题）
  const provideDirectAnswer = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatState.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          shouldProvideAnswer: true,
          sessionId: chatState.sessionId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // 更新sessionId（如果有返回新的）
        if (data.sessionId && data.sessionId !== chatState.sessionId) {
          updateChatState({ sessionId: data.sessionId });
        }

        // 添加最终答案
        addMessage({ 
          role: 'assistant', 
          content: data.message,
          type: 'answer'
        });

        // 通知完成
        if (onComplete) {
          onComplete(data.message);
        }

        updateChatState({ isAnalyzing: false });
      } else {
        throw new Error(data.error || '获取答案失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取答案时发生错误');
      updateChatState({ isAnalyzing: false });
    }
  };

  // 开始追问流程  
  const startFollowUpQuestions = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...chatState.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { 
              role: 'system', 
              content: '这个问题需要更多信息才能给出准确答案。请提供针对性的追问建议，帮助用户完善问题。' 
            }
          ],
          shouldProvideAnswer: false,
          sessionId: chatState.sessionId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // 更新sessionId（如果有返回新的）
        if (data.sessionId && data.sessionId !== chatState.sessionId) {
          updateChatState({ sessionId: data.sessionId });
        }

        // 添加AI的追问建议
        addMessage({ 
          role: 'assistant', 
          content: data.message,
          type: 'chat'
        });
        
        updateChatState({ isAnalyzing: false, needsMoreInfo: true });
      } else {
        throw new Error(data.error || '获取追问建议失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
      updateChatState({ isAnalyzing: false });
    }
  };

  // 处理用户发送消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatState.isAnalyzing) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setError('');

    // 添加用户消息
    addMessage({ 
      role: 'user', 
      content: message,
      type: 'question'
    });

    // 设置加载状态
    updateChatState({ isAnalyzing: true });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...chatState.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          shouldProvideAnswer: false,
          sessionId: chatState.sessionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      // 更新sessionId（如果有返回新的）
      if (data.sessionId && data.sessionId !== chatState.sessionId) {
        updateChatState({ sessionId: data.sessionId });
      }

      // 添加AI回复
      addMessage({ 
        role: 'assistant', 
        content: data.message,
        type: data.shouldProvideAnswer ? 'answer' : 'chat'
      });

      // 更新状态
      updateChatState({
        isAnalyzing: false,
        needsMoreInfo: !data.shouldProvideAnswer
      });

      // 如果提供了最终答案，通知完成
      if (data.shouldProvideAnswer && onComplete) {
        onComplete(data.message);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
      updateChatState({ isAnalyzing: false });
    }
  };

  // 重新开始
  const handleRestart = () => {
    setChatState({
      sessionId: '',
      messages: [],
      isAnalyzing: false,
      needsMoreInfo: false,
      collectedInfo: {}
    });
    setError('');
    setInputMessage('');
  };

  const getMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: zhCN });
  };

  const getMessageStatusIcon = (role: 'user' | 'assistant') => {
    if (role === 'user') {
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    return <MessageCircle className="w-4 h-4 text-green-500" />;
  };

  const getMessageTypeIcon = (type?: string) => {
    switch (type) {
      case 'question':
        return '❓';
      case 'analysis':
        return '🔍';
      case 'chat':
        return '💬';
      case 'answer':
        return '✅';
      default:
        return '💭';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">智能助手对话</h2>
          {chatState.sessionId && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
              会话ID: {chatState.sessionId.slice(-8)}
            </span>
          )}
        </div>
        <button
          onClick={handleRestart}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          重新开始
        </button>
      </div>

      {/* 对话内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {chatState.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs opacity-75">
                  {getMessageTypeIcon(message.type)} {message.role === 'user' ? '您' : 'AI助手'}
                </span>
                <span className="text-xs opacity-75">
                  {getMessageTime(message.timestamp)}
                </span>
                {message.analysisScore && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    message.analysisScore >= 8 ? 'bg-green-100 text-green-800' :
                    message.analysisScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {message.analysisScore.toFixed(1)}分
                  </span>
                )}
                {getMessageStatusIcon(message.role)}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {chatState.isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      {chatState.needsMoreInfo && (
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="请继续补充信息..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={chatState.isAnalyzing}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || chatState.isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>发送</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 