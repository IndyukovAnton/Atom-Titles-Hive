import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';
import { AiOrchestratorService } from './ai/ai-orchestrator.service';
import { CliStatusService } from './ai/cli-status.service';
import { AiRecommendationRequestDto } from './dto/ai-recommendation.dto';
import { RecommendationsService } from './recommendations.service';

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
    @Query('limit') limit: number,
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

  /**
   * Streams recommendations via SSE. Both 'claude-api' and 'claude-cli' sources
   * use the same protocol — frontend doesn't care about the underlying engine.
   *
   * Auth is JWT — for browser fetch streaming we honor the Authorization header
   * already attached by JwtAuthGuard.
   */
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
      res.end();
    }
  }
}
