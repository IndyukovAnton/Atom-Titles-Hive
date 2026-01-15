import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaEntry } from '../../entities/media-entry.entity';
import { MediaFile } from '../../entities/media-file.entity';
import { LoggerService } from '../../utils/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntry, MediaFile])],
  controllers: [MediaController],
  providers: [MediaService, LoggerService],
  exports: [MediaService],
})
export class MediaModule {}
