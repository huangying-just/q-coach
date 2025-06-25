import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter';
import { QUESTION_ANALYSIS_PROMPT } from '@/lib/prompts';
import { QuestionAnalysis } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: '请提供一个有效的问题' },
        { status: 400 }
      );
    }

    const client = createOpenRouterClient();
    const rawResponse = await client.analyzeQuestion(question.trim(), QUESTION_ANALYSIS_PROMPT);

    // 尝试解析JSON响应
    let analysis: QuestionAnalysis;
    try {
      // 提取JSON部分（移除可能的markdown格式）
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      console.error('原始响应:', rawResponse);
      
      // 如果JSON解析失败，返回一个默认的分析结果
      analysis = {
        score: 5,
        is_good_question: false,
        primary_issue: {
          category: "目标不明确" as any,
          explanation: "AI无法正确解析你的问题，请尝试重新表述"
        },
        feedback: "抱歉，我在分析你的问题时遇到了一些困难。请尝试用更清晰、更具体的方式重新提问。",
        improved_question: "请提供一个更具体的问题，包含你的背景信息和期望达到的目标。"
      };
    }

    // 验证分析结果的基本结构
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 10) {
      analysis.score = Math.max(0, Math.min(10, Math.round(analysis.score || 5)));
    }

    analysis.is_good_question = analysis.score >= 7;

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('分析问题时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 