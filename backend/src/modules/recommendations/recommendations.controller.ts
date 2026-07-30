import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';
import { AiOrchestratorService } from './ai/ai-orchestrator.service';
import { CliStatusService } from './ai/cli-status.service';
import { AiRecommendationRequestDto } from './dto/ai-recommendation.dto';
import { RecommendationsService } from './recommendations.service';
import {
  AI_THROTTLE_LIMIT,
  THROTTLE_TTL_MS,
} from '../../config/throttle.config';

const SSE_KEEPALIVE_INTERVAL_MS = 15_000;

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly aiOrchestrator: AiOrchestratorService,
    private readonly cliStatus: CliStatusService,
  ) {}

  @Get('top-rated')
  async getTopRated(
    @Req() req: AuthenticatedRequest,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.recommendationsService.getTopRatedInLibrary(
      req.user.userId,
      limit,
    );
  }

  @Get('genres')
  getByGenres(@Req() req: AuthenticatedRequest) {
    return this.recommendationsService.getRecommendationsByGenre(
      req.user.userId,
    );
  }

  @Get('ai/cli-status')
  async getCliStatus(@Req() req: AuthenticatedRequest) {
    return this.cliStatus.check(req.user.userId);
  }

  @Get('ai/codex-cli-status')
  async getCodexCliStatus(@Req() req: AuthenticatedRequest) {
    return this.cliStatus.checkCodex(req.user.userId);
  }

  /**
   * Streams recommendations via SSE. Claude API / Claude CLI / Codex CLI
   * use the same protocol — frontend doesn't care about the underlying engine.
   *
   * Auth is JWT — for browser fetch streaming we honor the Authorization header
   * already attached by JwtAuthGuard.
   */
  // AI-вызовы дорогие (внешние API) — отдельный жёсткий лимит.
  @Throttle({ default: { limit: AI_THROTTLE_LIMIT, ttl: THROTTLE_TTL_MS } })
  @Post('ai')
  async streamAiRecommendations(
    @Req() req: AuthenticatedRequest & Request,
    @Res() res: Response,
    @Body() body: AiRecommendationRequestDto,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    const writeEvent = (event: string, data: unknown): void => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Initial ping so the browser knows the stream is alive.
    writeEvent('open', { ts: Date.now() });

    // SSE-keepalive: защищает от idle-timeout прокси (nginx ~60s), форсирует
    // обнаружение мёртвых сокетов и даёт фронту сигнал живости для watchdog.
    const keepalive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        // сокет мёртв — req.on('close') уже сделал abort
      }
    }, SSE_KEEPALIVE_INTERVAL_MS);

    try {
      for await (const evt of this.aiOrchestrator.stream(
        req.user.userId,
        body,
        abortController.signal,
      )) {
        if (abortController.signal.aborted) break;
        writeEvent(evt.kind, evt);
      }
    } catch (err) {
      writeEvent('error', {
        kind: 'error',
        code: 'unknown',
        message:
          err instanceof Error ? err.message : 'Неизвестная ошибка стрима',
      });
    } finally {
      clearInterval(keepalive);
      res.end();
    }
  }
}
