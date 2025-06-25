import React, { useState } from 'react';
import { Send, Loader2, HelpCircle } from 'lucide-react';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  placeholder?: string;
  mode: 'coach' | 'assistant';
}

export default function QuestionInput({ 
  onSubmit, 
  isLoading, 
  placeholder = "在这里输入你的问题...",
  mode 
}: QuestionInputProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim());
      setQuestion('');
    }
  };

  const getPlaceholderText = () => {
    if (mode === 'coach') {
      return "输入你想问的问题，我会帮你分析并优化...";
    }
    return "有什么问题我可以帮助你解决？";
  };

  const examples = [
    "如何学好编程？",
    "我想转行做产品经理，该如何准备？",
    "Python和JavaScript哪个更值得学？"
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'coach' ? '🎯 提问分析' : '💬 智能助手'}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          {mode === 'coach' 
            ? '我会分析你的问题质量，并提供改进建议' 
            : '我会通过对话帮你解决问题'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {question.length}/1000
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            💡 提示：越具体的问题，越能得到准确的回答
          </div>
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{mode === 'coach' ? '分析问题' : '发送'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 示例问题 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">💭 试试这些问题：</h3>
        <div className="space-y-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuestion(example)}
              className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 