import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { MediaFavorite } from '../../entities/media-favorite.entity';
import { SavedRecommendation } from '../../entities/saved-recommendation.entity';
import { LibraryController } from './library.controller';
import { MediaFavoritesService } from './media-favorites.service';
import { SavedRecommendationsService } from './saved-recommendations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedRecommendation, MediaFavorite, MediaEntry]),
  ],
  controllers: [LibraryController],
  providers: [SavedRecommendationsService, MediaFavoritesService],
})
export class LibraryModule {}
