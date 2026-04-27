import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { User } from '../../entities/user.entity';
import { LoggerService } from '../../utils/logger.service';
import { ImageSearchService } from '../media/image-search.service';
import { AiOrchestratorService } from './ai/ai-orchestrator.service';
import { ClaudeApiAdapter } from './ai/adapters/claude-api.adapter';
import { ClaudeCliAdapter } from './ai/adapters/claude-cli.adapter';
import { CliStatusService } from './ai/cli-status.service';
import { RecommendationContextBuilder } from './ai/recommendation-context.builder';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntry, User])],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    LoggerService,
    ImageSearchService,
    RecommendationContextBuilder,
    ClaudeApiAdapter,
    ClaudeCliAdapter,
    AiOrchestratorService,
    CliStatusService,
  ],
})
export class RecommendationsModule {}
