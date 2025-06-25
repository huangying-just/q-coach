import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter';
import { QUESTION_ANALYSIS_PROMPT } from '@/lib/prompts';
import { QuestionAnalysis } from '@/types';
import { createSession, saveMessage } from '@/lib/database';

// 清理AI回复中的markdown格式
function cleanJsonResponse(response: string): string {
  // 移除可能的markdown代码块标记
  let cleaned = response.trim();
  
  // 移除开头的```json或```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  
  // 移除结尾的```
  cleaned = cleaned.replace(/\s*```\s*$/, '');
  
  // 移除其他可能的文本内容，只保留JSON部分
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}') + 1;
  
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd);
  }
  
  return cleaned.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { question, sessionId } = await request.json();

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: '请提供有效的问题内容' },
        { status: 400 }
      );
    }

    const client = createOpenRouterClient();
    const analysisPrompt = QUESTION_ANALYSIS_PROMPT + `\n\n问题：${question.trim()}`;
    
    const response = await client.chat([
      { role: 'user', content: analysisPrompt }
    ]);

    let analysis: QuestionAnalysis;
    try {
      // 清理AI回复中的markdown格式
      const cleanedResponse = cleanJsonResponse(response);
      console.log('Cleaned AI response:', cleanedResponse); // Debug log
      
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('解析分析结果失败:', parseError);
      console.error('Original response:', response);
      
      // 创建一个默认的分析结果作为fallback
      analysis = {
        score: 5,
        is_good_question: false,
        primary_issue: {
          category: "目标不明确" as any,
          explanation: "AI回复格式异常，无法正确解析分析结果"
        },
        feedback: "抱歉，分析过程中出现了技术问题。建议您稍后再试，或者尝试重新表述您的问题。",
        improved_question: question.trim()
      };
    }

    // 验证和修复分析结果格式
    if (typeof analysis.score !== 'number' || isNaN(analysis.score)) {
      analysis.score = 5; // 默认分数
    }
    
    if (!analysis.feedback) {
      analysis.feedback = "问题已收到，建议提供更多具体信息以获得更好的回答。";
    }

    // 确保分数在合理范围内
    if (analysis.score < 0) analysis.score = 0;
    if (analysis.score > 10) analysis.score = 10;

    // 根据分数判断是否是好问题
    analysis.is_good_question = analysis.score >= 7;

    // 保存会话和消息到数据库
    try {
      let currentSessionId = sessionId;
      
      // 如果没有提供sessionId，创建新会话
      if (!currentSessionId) {
        const session = await createSession('COACH', `问题分析: ${question.slice(0, 30)}...`);
        currentSessionId = session.id;
        
        // 保存用户问题
        await saveMessage(
          currentSessionId,
          'user',
          question.trim(),
          'question'
        );
      }
      
      // 保存分析结果
      await saveMessage(
        currentSessionId,
        'assistant',
        analysis.feedback,
        'analysis',
        analysis.score,
        analysis
      );
      
      return NextResponse.json({ 
        analysis,
        sessionId: currentSessionId 
      });
    } catch (dbError) {
      console.error('保存到数据库失败:', dbError);
      // 即使数据库保存失败，也返回分析结果
      return NextResponse.json({ analysis });
    }

  } catch (error) {
    console.error('分析问题时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 