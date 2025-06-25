import React from 'react';
import { QuestionAnalysis } from '@/types';
import { CheckCircle, AlertCircle, Lightbulb, Target } from 'lucide-react';

interface AnalysisResultProps {
  analysis: QuestionAnalysis;
  originalQuestion: string;
}

export default function AnalysisResult({ analysis, originalQuestion }: AnalysisResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreText = (score: number) => {
    if (score >= 8) return '优秀问题';
    if (score >= 6) return '还不错';
    return '需要改进';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* 原始问题 */}
      <div className="border-l-4 border-gray-300 pl-4">
        <h3 className="text-sm font-medium text-gray-500 mb-1">你的问题：</h3>
        <p className="text-gray-800">{originalQuestion}</p>
      </div>

      {/* 评分展示 */}
      <div className="flex items-center space-x-4">
        <div className={`px-4 py-2 rounded-full ${getScoreColor(analysis.score)}`}>
          <span className="text-2xl font-bold">{analysis.score}/10</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            {analysis.is_good_question ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="font-medium">{getScoreText(analysis.score)}</span>
          </div>
        </div>
      </div>

      {/* 问题分析 */}
      {analysis.primary_issue && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">主要问题：{analysis.primary_issue.category}</h4>
          </div>
          <p className="text-orange-700">{analysis.primary_issue.explanation}</p>
        </div>
      )}

      {/* AI反馈 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">AI教练的建议</h4>
        </div>
        <p className="text-blue-700 leading-relaxed">{analysis.feedback}</p>
      </div>

      {/* 优化示例 */}
      {analysis.improved_question && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">✨ 优化后的问题示例：</h4>
          <div className="bg-white border border-green-300 rounded p-3">
            <p className="text-green-700 italic">"{analysis.improved_question}"</p>
          </div>
        </div>
      )}

      {analysis.is_good_question && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">做得很好！</span>
          </div>
          <p className="text-green-700 mt-2">这是一个高质量的问题。现在让我来为你提供详细的答案。</p>
        </div>
      )}
    </div>
  );
} 