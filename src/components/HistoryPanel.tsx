import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, Trash2, User, Bot, Search, Filter, ChevronDown, ChevronUp, Award, Target, PlayCircle, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Message {
  id: string;
  createdAt: string;
  role: 'user' | 'assistant';
  content: string;
  type: string;
  analysisScore?: number;
  analysisData?: any;
}

interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  mode: string;
  title: string;
  messageCount: number;
  questionCount: number;
  averageScore?: number;
  messages: Message[];
}

interface HistoryPanelProps {
  onSelectSession?: (sessionId: string) => void;
  onSessionSelect?: (session: any) => void;
}

// 对话周期阶段定义
enum ConversationStage {
  INITIAL_QUESTION = 'initial_question',
  ANALYSIS = 'analysis', 
  CLARIFICATION = 'clarification',
  REFINEMENT = 'refinement',
  FINAL_ANSWER = 'final_answer'
}

interface ConversationCycle {
  id: string;
  title: string;
  initialQuestion: string;
  finalAnswer?: string;
  stages: {
    stage: ConversationStage;
    messages: Message[];
    summary: string;
  }[];
  isComplete: boolean;
  duration: number;
  qualityScore?: number;
}

export default function HistoryPanel({ onSelectSession }: HistoryPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [modeFilter, setModeFilter] = useState<'ALL' | 'COACH' | 'ASSISTANT'>('ALL');

  // 获取会话历史
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError(data.error || '获取历史记录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('获取会话历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('确定要删除这个完整的对话周期吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        setExpandedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('删除失败，请稍后重试');
      console.error('删除会话失败:', err);
    }
  };

  // 切换会话展开状态
  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // 过滤会话
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesMode = modeFilter === 'ALL' || session.mode === modeFilter;
    
    return matchesSearch && matchesMode;
  });

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'MM-dd HH:mm', { locale: zhCN });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMinutes = Math.round((end - start) / 1000 / 60);
    
    if (diffMinutes < 1) return '不到1分钟';
    if (diffMinutes < 60) return `${diffMinutes}分钟`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}小时${minutes}分钟`;
  };

  // 分析对话周期结构
  const analyzeConversationCycle = (session: Session): ConversationCycle => {
    const messages = session.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // 提取初始问题和最终答案
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    const initialQuestion = userMessages[0]?.content || '';
    const finalAnswer = assistantMessages[assistantMessages.length - 1]?.content || '';
    
    // 分析对话阶段
    const stages: ConversationCycle['stages'] = [];
    let currentStage: ConversationStage = ConversationStage.INITIAL_QUESTION;
    let stageMessages: Message[] = [];
    
    messages.forEach((message, index) => {
      if (message.role === 'user' && message.type === 'question') {
        if (index === 0) {
          currentStage = ConversationStage.INITIAL_QUESTION;
        } else {
          // 保存前一阶段
          if (stageMessages.length > 0) {
            stages.push({
              stage: currentStage,
              messages: [...stageMessages],
              summary: generateStageSummary(currentStage, stageMessages)
            });
          }
          currentStage = ConversationStage.CLARIFICATION;
          stageMessages = [];
        }
      } else if (message.type === 'analysis') {
        currentStage = ConversationStage.ANALYSIS;
      }
      
      stageMessages.push(message);
    });
    
    // 添加最后阶段
    if (stageMessages.length > 0) {
      stages.push({
        stage: currentStage,
        messages: [...stageMessages],
        summary: generateStageSummary(currentStage, stageMessages)
      });
    }
    
    // 判断对话是否完成
    const isComplete = assistantMessages.length > 0 && 
      (finalAnswer.length > 100 || assistantMessages[assistantMessages.length - 1].type === 'answer');
    
    return {
      id: session.id,
      title: session.title,
      initialQuestion,
      finalAnswer,
      stages,
      isComplete,
      duration: new Date(session.updatedAt).getTime() - new Date(session.createdAt).getTime(),
      qualityScore: session.averageScore
    };
  };

  const generateStageSummary = (stage: ConversationStage, messages: Message[]): string => {
    const userMsgs = messages.filter(m => m.role === 'user').length;
    const aiMsgs = messages.filter(m => m.role === 'assistant').length;
    
    switch (stage) {
      case ConversationStage.INITIAL_QUESTION:
        return `用户提出初始问题`;
      case ConversationStage.ANALYSIS:
        return `AI分析问题质量并提供反馈`;
      case ConversationStage.CLARIFICATION:
        return `AI追问细节，用户补充信息 (${userMsgs}轮交互)`;
      case ConversationStage.REFINEMENT:
        return `问题优化和深入讨论 (${aiMsgs}次回复)`;
      case ConversationStage.FINAL_ANSWER:
        return `AI提供最终完整答案`;
      default:
        return `${userMsgs}个问题，${aiMsgs}个回复`;
    }
  };

  const getStageIcon = (stage: ConversationStage) => {
    switch (stage) {
      case ConversationStage.INITIAL_QUESTION:
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case ConversationStage.ANALYSIS:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case ConversationStage.CLARIFICATION:
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case ConversationStage.REFINEMENT:
        return <ArrowRight className="w-4 h-4 text-green-600" />;
      case ConversationStage.FINAL_ANSWER:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStageLabel = (stage: ConversationStage): string => {
    const labels = {
      [ConversationStage.INITIAL_QUESTION]: '🚀 问题提出',
      [ConversationStage.ANALYSIS]: '🔍 质量分析', 
      [ConversationStage.CLARIFICATION]: '💬 信息澄清',
      [ConversationStage.REFINEMENT]: '⚡ 问题优化',
      [ConversationStage.FINAL_ANSWER]: '✅ 完整解答'
    };
    return labels[stage] || '💭 对话交流';
  };

  // 渲染完整对话周期
  const renderConversationCycle = (cycle: ConversationCycle) => {
    return (
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        {/* 对话周期概览 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900 flex items-center">
              🎯 完整智能对话周期
              {cycle.isComplete && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
            </h4>
            <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
              耗时 {Math.round(cycle.duration / 1000 / 60)} 分钟
            </div>
          </div>
          
          {/* 问题到答案的概览 */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  初始问题
                </h5>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg text-sm">
                  "{cycle.initialQuestion.length > 150 
                    ? cycle.initialQuestion.substring(0, 150) + '...' 
                    : cycle.initialQuestion}"
                </p>
              </div>
              
              {cycle.finalAnswer && (
                <div>
                  <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    最终答案
                  </h5>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-lg text-sm">
                    "{cycle.finalAnswer.length > 150 
                      ? cycle.finalAnswer.substring(0, 150) + '...' 
                      : cycle.finalAnswer}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 对话阶段流程 */}
        <div className="space-y-4">
          <h5 className="font-semibold text-gray-800 mb-3">📋 对话发展阶段</h5>
          
          {cycle.stages.map((stageData, index) => (
            <div key={index} className="relative">
              {/* 连接线 */}
              {index < cycle.stages.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-blue-300 to-blue-200 z-0"></div>
              )}
              
              <div className="relative bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                {/* 阶段标题 */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    {getStageIcon(stageData.stage)}
                  </div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-900">
                      {getStageLabel(stageData.stage)}
                    </h6>
                    <p className="text-sm text-gray-600">{stageData.summary}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stageData.messages.length} 条消息
                  </div>
                </div>
                
                {/* 阶段内容 */}
                <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                  {stageData.messages.map((message, msgIndex) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        message.role === 'user' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {message.role === 'user' ? '👤' : '🤖'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-sm font-medium ${
                            message.role === 'user' ? 'text-blue-700' : 'text-green-700'
                          }`}>
                            {message.role === 'user' ? '用户' : 'AI助手'}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {format(new Date(message.createdAt), 'HH:mm:ss')}
                          </span>
                          {message.analysisScore && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              message.analysisScore >= 8 ? 'bg-green-100 text-green-800' :
                              message.analysisScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {message.analysisScore.toFixed(1)}分
                            </span>
                          )}
                        </div>
                        
                        <div className={`text-sm p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-blue-50 text-blue-900' 
                            : 'bg-gray-50 text-gray-800'
                        }`}>
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {message.content.length > 300 
                              ? message.content.substring(0, 300) + '...' 
                              : message.content}
                          </div>
                          
                          {message.analysisData?.feedback && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs text-gray-600">
                                <strong>💡 分析反馈：</strong>
                                {message.analysisData.feedback.length > 100 
                                  ? message.analysisData.feedback.substring(0, 100) + '...'
                                  : message.analysisData.feedback}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 对话周期总结 */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Award className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h6 className="font-semibold text-gray-900 mb-1">🎉 对话周期总结</h6>
              <p className="text-sm text-gray-700">
                这个{cycle.title.includes('教练') ? '教练模式' : '助手模式'}对话周期经历了{' '}
                <span className="font-semibold text-blue-600">{cycle.stages.length}</span> 个主要阶段，
                用户从最初的问题"{cycle.initialQuestion.substring(0, 50)}..."开始，
                通过AI的智能引导和分析，
                {cycle.isComplete ? (
                  <>最终获得了满意的完整答案，整个过程高效且富有成效。</>
                ) : (
                  <>对话仍在进行中，正在逐步完善问题和寻找最佳答案。</>
                )}
                {cycle.qualityScore && (
                  <>平均问题质量评分为 <span className="font-semibold text-green-600">{cycle.qualityScore.toFixed(1)}</span> 分。</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">加载对话周期中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和过滤栏 */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索对话周期..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as 'ALL' | 'COACH' | 'ASSISTANT')}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">全部模式</option>
            <option value="COACH">教练模式</option>
            <option value="ASSISTANT">助手模式</option>
          </select>
        </div>
      </div>

      {/* 智能对话周期列表 */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">
            {searchTerm || modeFilter !== 'ALL' ? '没有找到匹配的对话周期' : '还没有智能对话记录'}
          </p>
          <p className="text-sm">
            {searchTerm || modeFilter !== 'ALL' ? '尝试使用其他条件搜索' : '开始您的第一次智能对话吧！'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSessions.map((session) => {
            const isExpanded = expandedSessions.has(session.id);
            const hasMessages = session.messages && session.messages.length > 0;
            const cycle = hasMessages ? analyzeConversationCycle(session) : null;
            
            return (
              <div
                key={session.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* 对话周期头部 */}
                <div className="p-6 bg-gradient-to-r from-blue-50 via-white to-green-50 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                          session.mode === 'COACH' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {session.mode === 'COACH' ? (
                            <><Target className="w-4 h-4 mr-1" />🎯 教练模式</>
                          ) : (
                            <><MessageSquare className="w-4 h-4 mr-1" />💬 助手模式</>
                          )}
                        </span>
                        
                        {cycle?.isComplete && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            已完成
                          </span>
                        )}
                        
                        {session.averageScore && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <Award className="w-4 h-4 mr-1" />
                            {session.averageScore.toFixed(1)}分
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        🚀 {session.title}
                      </h3>
                      
                      {/* 对话周期概览统计 */}
                      {cycle && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                            <div className="text-lg font-bold text-blue-700">{cycle.stages.length}</div>
                            <div className="text-xs text-blue-600">个阶段</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                            <div className="text-lg font-bold text-green-700">{session.questionCount}</div>
                            <div className="text-xs text-green-600">个问题</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                            <div className="text-lg font-bold text-purple-700">{formatDuration(session.createdAt, session.updatedAt)}</div>
                            <div className="text-xs text-purple-600">总时长</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
                            <div className="text-lg font-bold text-orange-700">{cycle.isComplete ? '✅' : '⏳'}</div>
                            <div className="text-xs text-orange-600">{cycle.isComplete ? '已完成' : '进行中'}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        <span>🕐 {formatTime(session.createdAt)}</span>
                        <span className="mx-2">→</span>
                        <span>🏁 {formatTime(session.updatedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {hasMessages && (
                        <button
                          onClick={() => toggleSessionExpansion(session.id)}
                          className="flex items-center px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                        >
                          {isExpanded ? (
                            <><ChevronUp className="w-4 h-4 mr-1" />收起完整周期</>
                          ) : (
                            <><ChevronDown className="w-4 h-4 mr-1" />查看完整周期</>
                          )}
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除对话周期"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 完整对话周期展示 */}
                {isExpanded && cycle && renderConversationCycle(cycle)}

                {/* 简化预览 */}
                {!isExpanded && cycle && (
                  <div className="px-6 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <PlayCircle className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-700">对话周期预览</span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">💭 初始问题</div>
                          <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                            {cycle.initialQuestion.length > 80 
                              ? cycle.initialQuestion.substring(0, 80) + '...'
                              : cycle.initialQuestion}
                          </div>
                        </div>
                        
                        {cycle.finalAnswer && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">✅ 最终答案</div>
                            <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                              {cycle.finalAnswer.length > 80 
                                ? cycle.finalAnswer.substring(0, 80) + '...'
                                : cycle.finalAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="text-xs text-gray-500">
                          点击上方"查看完整周期"了解详细的对话发展过程
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 