import { Inject, Injectable } from '@nestjs/common';
import type { AiMessageDto } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { AI_PROVIDER, type AiContext, type AiProvider } from './ai.provider';
import { ArtisanProfileService } from '../artisan-profile/artisan-profile.service';
import { SubsidiesService } from '../subsidies/subsidies.service';
import { STATUS_LABEL_UZ } from '@ecwt/types';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ArtisanProfileService,
    private readonly subsidies: SubsidiesService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  /**
   * Haqiqiy AI xizmati ulanganmi.
   *
   * `mock` — kalit berilmagan, javoblar ilovaning o'z qoidalaridan
   * tayyorlanadi. Ilova buni foydalanuvchiga ochiq aytadi.
   */
  status(): { connected: boolean; provider: string } {
    return { connected: this.provider.name !== 'mock', provider: this.provider.name };
  }

  async ask(userId: string, message: string): Promise<AiMessageDto> {
    const context = await this.buildContext(userId);

    await this.prisma.aiMessage.create({ data: { userId, role: 'user', content: message } });
    const answer = await this.provider.ask(message, context);
    const saved = await this.prisma.aiMessage.create({
      data: { userId, role: 'assistant', content: answer },
    });

    return {
      role: 'assistant',
      content: saved.content,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async history(userId: string): Promise<AiMessageDto[]> {
    const rows = await this.prisma.aiMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return rows.map((r) => ({
      role: r.role === 'user' ? 'user' : 'assistant',
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private async buildContext(userId: string): Promise<AiContext> {
    const completion = await this.profiles.completion(userId).catch(() => null);
    const subsidies = await this.subsidies.listWithEligibility(userId, true).catch(() => []);
    const apps = await this.prisma.subsidyApplication.findMany({
      where: { userId, status: { notIn: ['PAID', 'REJECTED', 'CANCELLED'] } },
      include: { subsidy: { select: { title: true } } },
      take: 10,
    });

    return {
      profileCompletion: completion?.percent,
      missingProfileItems: completion?.items
        .filter((i) => i.status !== 'DONE')
        .map((i) => i.label),
      eligibleSubsidies: subsidies
        .filter((s) => s.eligibility.verdict === 'ELIGIBLE')
        .map((s) => s.title),
      openApplications: apps.map((a) => ({
        number: a.number,
        status: STATUS_LABEL_UZ[a.status],
        subsidy: a.subsidy.title,
      })),
    };
  }
}
