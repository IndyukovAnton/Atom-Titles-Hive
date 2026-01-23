import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('top-rated')
  async getTopRated(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit: number,
  ) {
    return this.recommendationsService.getTopRatedInLibrary(
      req.user.userId,
      limit,
    );
  }

  @Get('genres')
  getByGenres(@Request() req: AuthenticatedRequest) {
    return this.recommendationsService.getRecommendationsByGenre(
      req.user.userId,
    );
  }

  @Post('ai')
  getAiRecommendations(
    @Body() body: { prompt: string; provider: string; apiKey?: string },
  ) {
    return this.recommendationsService.getAiRecommendations(
      body.prompt,
      body.provider,
    );
  }
}
