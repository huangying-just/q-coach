import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, Target, Award, Calendar, BookOpen, Lightbulb } from 'lucide-react';
import { useSessions } from '@/hooks/useLocalStorage';
import { AnalyticsEngine } from '@/lib/analytics';
import { ProblemCategory } from '@/types';

export default function GrowthDashboard() {
  const [sessions] = useSessions();

  // 计算统计数据
  const statistics = useMemo(() => {
    return AnalyticsEngine.calculateStatistics(sessions);
  }, [sessions]);

  // 生成趋势数据
  const trendData = useMemo(() => {
    return AnalyticsEngine.generateTrendData(sessions);
  }, [sessions]);

  // 获取改进建议
  const suggestions = useMemo(() => {
    return AnalyticsEngine.getImprovementSuggestions(statistics);
  }, [statistics]);

  // 分类数据的颜色
  const CATEGORY_COLORS = {
    [ProblemCategory.TOO_BROAD]: '#ef4444',
    [ProblemCategory.MISSING_CONTEXT]: '#f97316',
    [ProblemCategory.UNCLEAR_GOAL]: '#eab308',
    [ProblemCategory.EASILY_SEARCHABLE]: '#22c55e',
    [ProblemCategory.COMPOUND_QUESTION]: '#3b82f6',
    [ProblemCategory.FAULTY_PREMISE]: '#8b5cf6'
  };

  const getCategoryColor = (category: ProblemCategory, index: number) => {
    return CATEGORY_COLORS[category] || `hsl(${index * 60}, 70%, 50%)`;
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➖';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">开始你的成长之旅</h3>
          <p className="text-gray-600">提出第一个问题，开始记录你的成长轨迹吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总问题数</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.totalQuestions}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均得分</p>
              <p className={`text-3xl font-bold ${getScoreColor(statistics.averageScore)}`}>
                {statistics.averageScore.toFixed(1)}
              </p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">连续天数</p>
              <p className="text-3xl font-bold text-purple-600">{statistics.streaks.current}</p>
              <p className="text-xs text-gray-500">最长 {statistics.streaks.longest} 天</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已获成就</p>
              <p className="text-3xl font-bold text-yellow-600">{statistics.achievements.length}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* 评分趋势图 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">评分趋势 (最近30天)</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'score' ? `${value.toFixed(1)}分` : `${value}个问题`,
                  name === 'score' ? '平均得分' : '问题数量'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 问题分类分布 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">问题分类分析</h3>
          {statistics.categoryDistribution.length > 0 ? (
            <>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statistics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category, index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}个`, '问题数量']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {statistics.categoryDistribution.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(item.category, index) }}
                      />
                      <span>{item.category}</span>
                      <span>{getTrendIcon(item.trend)}</span>
                    </div>
                    <div className="text-gray-600">
                      {item.count}个 ({item.percentage.toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>太棒了！你的问题质量都很高</p>
              <p className="text-sm">继续保持良好的提问习惯</p>
            </div>
          )}
        </div>

        {/* 成就展示 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-gray-800">成就徽章</h3>
          </div>
          {statistics.achievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {statistics.achievements.map((achievement) => (
                <div key={achievement.id} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <h4 className="font-semibold text-gray-800 text-sm">{achievement.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>继续提问解锁你的第一个成就！</p>
            </div>
          )}
        </div>
      </div>

      {/* 改进建议 */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-gray-800">个性化建议</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-800">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近活动 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">最近活动</h3>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-800 truncate">
                  {session.originalQuestion.substring(0, 60)}...
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(session.startTime).toLocaleDateString('zh-CN')}
                </p>
              </div>
              {session.analysis?.score && (
                <div className={`px-2 py-1 rounded-full text-sm font-medium ${
                  session.analysis.score >= 8 ? 'bg-green-100 text-green-800' :
                  session.analysis.score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {session.analysis.score}/10
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 