'use client';

import React, { useState } from 'react';
import { QuestionAnalysis, AppMode } from '@/types';
import QuestionInput from '@/components/QuestionInput';
import AnalysisResult from '@/components/AnalysisResult';
import { BookOpen, Users, ToggleLeft, ToggleRight } from 'lucide-react';

export default function HomePage() {
  const [mode, setMode] = useState<AppMode>(AppMode.COACH);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [error, setError] = useState<string>('');

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
        // TODO: 实现助手模式
        setError('助手模式正在开发中...');
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
  };

  const resetSession = () => {
    setAnalysis(null);
    setError('');
    setCurrentQuestion('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Q-Coach</h1>
                <p className="text-sm text-gray-600">AI提问质量优化专家</p>
              </div>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 模式说明 */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              当前模式：{mode === AppMode.COACH ? '🎯 教练模式' : '💬 助手模式'}
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            {mode === AppMode.COACH 
              ? '我会分析你的问题质量，给出评分和改进建议，帮你学会提出更好的问题。'
              : '我会通过对话方式引导你提供更多信息，然后给出详细的答案。'}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium">出现错误</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        <div className="grid gap-8">
          {/* 问题输入区域 */}
          <QuestionInput
            onSubmit={handleQuestionSubmit}
            isLoading={isLoading}
            mode={mode === AppMode.COACH ? 'coach' : 'assistant'}
          />

          {/* 分析结果区域 */}
          {analysis && currentQuestion && (
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
        </div>

        {/* 使用统计或教育内容 */}
        {!analysis && !isLoading && (
          <div className="mt-12 grid md:grid-cols-2 gap-6">
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
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>Q-Coach - 让每一次提问都更有价值 ✨</p>
        </div>
      </footer>
    </div>
  );
}
