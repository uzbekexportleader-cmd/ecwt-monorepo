import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER, type AiProvider } from './ai.provider';
import { MockAiProvider } from './mock-ai.provider';
import { OpenAiProvider } from './openai-ai.provider';
import { ArtisanProfileModule } from '../artisan-profile/artisan-profile.module';
import { SubsidiesModule } from '../subsidies/subsidies.module';

@Module({
  imports: [ArtisanProfileModule, SubsidiesModule],
  controllers: [AiController],
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): AiProvider =>
        env.AI_PROVIDER === 'openai' ? new OpenAiProvider(env) : new MockAiProvider(),
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
