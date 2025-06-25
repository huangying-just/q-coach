import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class OpenRouterClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: OpenRouterMessage[]): Promise<string> {
    try {
      const response = await axios.post<OpenRouterResponse>(
        OPENROUTER_API_URL,
        {
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Q-Coach',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`API调用失败: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error('未知错误');
    }
  }

  async analyzeQuestion(question: string, systemPrompt: string): Promise<string> {
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];

    return this.chat(messages);
  }

  async continueConversation(messages: OpenRouterMessage[]): Promise<string> {
    return this.chat(messages);
  }
}

// 创建默认客户端实例
export function createOpenRouterClient(): OpenRouterClient {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite-preview-06-17';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY 环境变量未设置');
  }

  return new OpenRouterClient(apiKey, model);
} 