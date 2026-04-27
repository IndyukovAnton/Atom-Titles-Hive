import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';
import {
  SaveRecommendationDto,
  UpdateSavedRecommendationStatusDto,
} from './dto/save-recommendation.dto';
import type { SavedRecStatus } from './dto/save-recommendation.dto';
import { MediaFavoritesService } from './media-favorites.service';
import { SavedRecommendationsService } from './saved-recommendations.service';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(
    private readonly savedRecs: SavedRecommendationsService,
    private readonly favorites: MediaFavoritesService,
  ) {}

  @Get('considerations')
  listConsiderations(@Req() req: AuthenticatedRequest) {
    return this.savedRecs.list(req.user.userId, 'considering');
  }

  @Get('saved-recommendations')
  listAllSaved(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: SavedRecStatus,
  ) {
    return this.savedRecs.list(req.user.userId, status);
  }

  @Post('saved-recommendations')
  saveRecommendation(
    @Req() req: AuthenticatedRequest,
    @Body() body: SaveRecommendationDto,
  ) {
    return this.savedRecs.create(req.user.userId, body);
  }

  @Patch('saved-recommendations/:id/status')
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSavedRecommendationStatusDto,
  ) {
    return this.savedRecs.updateStatus(req.user.userId, id, body.status);
  }

  @Delete('saved-recommendations/:id')
  @HttpCode(204)
  async removeSavedRecommendation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.savedRecs.remove(req.user.userId, id);
  }

  @Get('favorites')
  listFavoritedMedia(@Req() req: AuthenticatedRequest) {
    return this.favorites.list(req.user.userId);
  }

  @Get('favorites/ids')
  listFavoriteIds(@Req() req: AuthenticatedRequest) {
    return this.favorites.listIds(req.user.userId);
  }

  @Put('favorites/media/:mediaId')
  addFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    return this.favorites.add(req.user.userId, mediaId);
  }

  @Delete('favorites/media/:mediaId')
  @HttpCode(204)
  async removeFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    await this.favorites.remove(req.user.userId, mediaId);
  }
}
