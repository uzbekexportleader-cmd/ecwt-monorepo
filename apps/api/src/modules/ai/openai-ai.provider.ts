import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AI_SYSTEM_PROMPT, type AiContext, type AiProvider } from './ai.provider';
import type { Env } from '../../config/env';

/**
 * OpenAI adapteri.
 * API kaliti faqat serverda qoladi — mobil ilovaga hech qachon uzatilmaydi.
 * Kalit berilmagan bo'lsa provayder xato qaytaradi.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  readonly isReal = true;

  constructor(private readonly env: Env) {}

  async ask(message: string, context: AiContext): Promise<string> {
    if (!this.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableException('AI assistant sozlanmagan: OPENAI_API_KEY kerak');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'system', content: `Foydalanuvchi konteksti: ${JSON.stringify(context)}` },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!res.ok) {
      throw new ServiceUnavailableException('AI assistant hozir javob bera olmadi');
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? 'Javob olinmadi.';
  }
}
