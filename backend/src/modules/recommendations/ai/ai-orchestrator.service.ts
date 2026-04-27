import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { ClaudeApiAdapter } from './adapters/claude-api.adapter';
import { ClaudeCliAdapter } from './adapters/claude-cli.adapter';
import { RecommendationContextBuilder } from './recommendation-context.builder';
import { AiRequestParams, AiSourceAdapter, AiStreamEvent } from './types';

@Injectable()
export class AiOrchestratorService {
  constructor(
    private readonly contextBuilder: RecommendationContextBuilder,
    private readonly apiAdapter: ClaudeApiAdapter,
    private readonly cliAdapter: ClaudeCliAdapter,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async resolveSource(
    userId: number,
    requested?: AiRequestParams['source'],
  ): Promise<AiRequestParams> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const prefs = user?.preferences;

    const source = requested ?? prefs?.aiSource ?? 'claude-api';

    return {
      source,
      apiKey: prefs?.anthropicApiKey,
      model: prefs?.claudeModel ?? 'claude-sonnet-4-6',
      useWebSearch: prefs?.claudeUseWebSearch ?? true,
      cliPath: prefs?.claudeCliPath,
      count: 10,
    };
  }

  async *stream(
    userId: number,
    request: Partial<AiRequestParams> & {
      source?: AiRequestParams['source'];
      count?: number;
    },
    abortSignal: AbortSignal,
  ): AsyncIterable<AiStreamEvent> {
    const baseline = await this.resolveSource(userId, request.source);

    const params: AiRequestParams = {
      ...baseline,
      prompt: request.prompt,
      mood: request.mood,
      filters: request.filters,
      count: Math.min(Math.max(request.count ?? 10, 1), 20),
      newForMe: request.newForMe,
      excludeTitles: request.excludeTitles,
    };

    const ctx = await this.contextBuilder.build(userId, params);

    const adapter: AiSourceAdapter =
      params.source === 'claude-cli' ? this.cliAdapter : this.apiAdapter;

    yield* adapter.stream(ctx, params, abortSignal);
  }
}
