'use client';

import React, { useState } from 'react';
import { QuestionAnalysis, AppMode } from '@/types';
import QuestionInput from '@/components/QuestionInput';
import AnalysisResult from '@/components/AnalysisResult';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import HistoryPanel from '@/components/HistoryPanel';
import { BookOpen, Users, ToggleLeft, ToggleRight } from 'lucide-react';

export default function HomePage() {
  const [mode, setMode] = useState<AppMode>(AppMode.COACH);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [error, setError] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<string>('chat');

  const handleQuestionSubmit = async (question: string) => {
    setIsLoading(true);
    setError('');
    setCurrentQuestion(question);
    setAnalysis(null);

    try {
      if (mode === AppMode.COACH) {
        const response = await fetch('/api/analyze-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '分析失败');
        }

        setAnalysis(data.analysis);
      } else {
        // 助手模式：显示对话界面
        setShowChat(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === AppMode.COACH ? AppMode.ASSISTANT : AppMode.COACH);
    setAnalysis(null);
    setError('');
    setCurrentQuestion('');
    setShowChat(false);
  };

  const resetSession = () => {
    setAnalysis(null);
    setError('');
    setCurrentQuestion('');
    setShowChat(false);
  };

  const handleChatComplete = (finalAnswer: string) => {
    // 当助手模式完成对话时的回调
    setShowChat(false);
    setCurrentQuestion('');
  };

  const handleAnalysisComplete = (analysisResult: QuestionAnalysis) => {
    // 当分析完成时的回调
    setAnalysis(analysisResult);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    // 重置当前状态
    resetSession();
  };

  const renderMainContent = () => {
    switch (currentPage) {
      case 'chat':
        return renderChatPage();
      case 'history':
        return renderHistoryPage();
      case 'dashboard':
        return renderDashboardPage();
      case 'settings':
        return renderSettingsPage();
      case 'help':
        return renderHelpPage();
      default:
        return renderChatPage();
    }
  };

  const renderChatPage = () => (
    <div className="space-y-8">
      {/* 模式说明 */}
      <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              当前模式：{mode === AppMode.COACH ? '🎯 教练模式' : '💬 助手模式'}
            </h3>
          </div>
          
          {/* 模式切换 */}
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${mode === AppMode.COACH ? 'text-blue-600' : 'text-gray-500'}`}>
              教练模式
            </span>
            <button
              onClick={toggleMode}
              className="flex items-center p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {mode === AppMode.COACH ? (
                <ToggleLeft className="w-8 h-8 text-blue-600" />
              ) : (
                <ToggleRight className="w-8 h-8 text-green-600" />
              )}
            </button>
            <span className={`text-sm font-medium ${mode === AppMode.ASSISTANT ? 'text-green-600' : 'text-gray-500'}`}>
              助手模式
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          {mode === AppMode.COACH 
            ? '我会分析你的问题质量，给出评分和改进建议，帮你学会提出更好的问题。'
            : '我会通过对话方式引导你提供更多信息，然后给出详细的答案。'}
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">出现错误</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* 问题输入区域 - 只在非对话模式时显示 */}
      {!showChat && (
        <QuestionInput
          onSubmit={handleQuestionSubmit}
          isLoading={isLoading}
          mode={mode === AppMode.COACH ? 'coach' : 'assistant'}
        />
      )}

      {/* 助手模式对话界面 */}
      {showChat && currentQuestion && mode === AppMode.ASSISTANT && (
        <ChatInterface
          initialQuestion={currentQuestion}
          onComplete={handleChatComplete}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

      {/* 教练模式分析结果区域 */}
      {analysis && currentQuestion && mode === AppMode.COACH && (
        <div className="space-y-4">
          <AnalysisResult 
            analysis={analysis} 
            originalQuestion={currentQuestion}
          />
          
          {/* 重新开始按钮 */}
          <div className="flex justify-center">
            <button
              onClick={resetSession}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 分析新问题
            </button>
          </div>
        </div>
      )}

      {/* 使用统计或教育内容 */}
      {!analysis && !isLoading && !showChat && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">💡 好问题的特征</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>具体明确</strong>：避免过于宽泛的问题</li>
              <li>• <strong>提供背景</strong>：包含必要的上下文信息</li>
              <li>• <strong>目标清晰</strong>：明确想要达到什么目的</li>
              <li>• <strong>可操作</strong>：问题能够得到具体的答案</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">🚀 使用技巧</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>教练模式</strong>：学习如何提出更好的问题</li>
              <li>• <strong>助手模式</strong>：快速获得问题的答案</li>
              <li>• <strong>多尝试</strong>：不断练习，提升提问技能</li>
              <li>• <strong>记录成长</strong>：观察自己的进步轨迹</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryPage = () => (
    <HistoryPanel onSelectSession={handleSelectSession} />
  );

  const handleSelectSession = (sessionId: string) => {
    // 切换到智能对话页面并加载选中的会话
    setCurrentPage('chat');
    // TODO: 实现会话加载逻辑
    console.log('选中会话:', sessionId);
  };

  const renderDashboardPage = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 成长看板</h2>
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg mb-2">成长看板功能正在开发中</p>
        <p className="text-sm">很快就能看到您的提问技能成长轨迹了</p>
      </div>
    </div>
  );

  const renderSettingsPage = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">⚙️ 设置</h2>
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg mb-2">设置功能正在开发中</p>
        <p className="text-sm">很快就能个性化定制您的Q-Coach了</p>
      </div>
    </div>
  );

  const renderHelpPage = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">❓ 帮助中心</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 如何使用教练模式</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• 输入您想要分析的问题</li>
            <li>• 系统会从清晰度、具体性、上下文、可操作性四个维度评分</li>
            <li>• 查看详细的改进建议和优化示例</li>
            <li>• 反复练习，提升问题质量</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💬 如何使用助手模式</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• 直接提出您的问题</li>
            <li>• 系统会通过对话引导您提供更多信息</li>
            <li>• 获得更准确、更有用的答案</li>
            <li>• 学习如何更好地描述问题</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 提问技巧</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• <strong>背景信息</strong>：说明问题的来源和背景</li>
            <li>• <strong>具体描述</strong>：避免模糊和抽象的表达</li>
            <li>• <strong>明确目标</strong>：说明希望达到什么结果</li>
            <li>• <strong>限制范围</strong>：给出具体的约束条件</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 侧边栏 */}
      <Sidebar 
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* 主内容区域 */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentPage === 'chat' && '智能对话'}
                  {currentPage === 'history' && '历史记录'}
                  {currentPage === 'dashboard' && '成长看板'}
                  {currentPage === 'settings' && '设置'}
                  {currentPage === 'help' && '帮助中心'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentPage === 'chat' && 'AI提问质量优化专家'}
                  {currentPage === 'history' && '查看您的所有对话记录'}
                  {currentPage === 'dashboard' && '追踪您的成长轨迹'}
                  {currentPage === 'settings' && '个性化您的使用体验'}
                  {currentPage === 'help' && '学习如何更好地提问'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="p-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
