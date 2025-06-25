'use client';

import React, { useState } from 'react';
import HistoryPanel from '@/components/HistoryPanel';
import { Session } from '@/types';

export default function HistoryPage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-4rem)]">
          {/* 历史记录面板 */}
          <div className="lg:col-span-2">
            <HistoryPanel onSessionSelect={handleSessionSelect} />
          </div>

          {/* 会话详情面板 */}
          <div className="lg:col-span-1">
            {selectedSession ? (
              <div className="bg-white rounded-lg shadow-lg h-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">会话详情</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedSession.startTime).toLocaleString('zh-CN')}
                  </p>
                </div>

                <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
                  {/* 原始问题 */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">原始问题</h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-gray-800">{selectedSession.originalQuestion}</p>
                    </div>
                  </div>

                  {/* 分析结果 */}
                  {selectedSession.analysis && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">分析结果</h4>
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">评分</span>
                          <span className={`font-bold ${
                            selectedSession.analysis.score >= 8 ? 'text-green-600' :
                            selectedSession.analysis.score >= 6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {selectedSession.analysis.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          {selectedSession.analysis.feedback}
                        </p>
                        {selectedSession.analysis.primary_issue && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                            <p className="text-sm">
                              <strong>主要问题：</strong> {selectedSession.analysis.primary_issue.category}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedSession.analysis.primary_issue.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 对话记录 */}
                  {selectedSession.chatMessages && selectedSession.chatMessages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">对话记录</h4>
                      <div className="space-y-3">
                        {selectedSession.chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-100 ml-4'
                                : 'bg-gray-100 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">
                                {message.role === 'user' ? '你' : 'AI助手'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 最终答案 */}
                  {selectedSession.finalAnswer && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">最终答案</h4>
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {selectedSession.finalAnswer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p>选择一个会话查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 