import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { MediaFavorite } from '../../entities/media-favorite.entity';

@Injectable()
export class MediaFavoritesService {
  constructor(
    @InjectRepository(MediaFavorite)
    private readonly favRepo: Repository<MediaFavorite>,
    @InjectRepository(MediaEntry)
    private readonly mediaRepo: Repository<MediaEntry>,
  ) {}

  async list(userId: number): Promise<MediaEntry[]> {
    const rows = await this.favRepo
      .createQueryBuilder('fav')
      .innerJoinAndSelect('fav.mediaEntry', 'media')
      .where('fav.userId = :userId', { userId })
      .andWhere('media.userId = :userId', { userId })
      .orderBy('fav.createdAt', 'DESC')
      .getMany();
    return rows.map((r) => r.mediaEntry);
  }

  async listIds(userId: number): Promise<number[]> {
    const rows = await this.favRepo.find({
      where: { userId },
      select: ['mediaEntryId'],
    });
    return rows.map((r) => r.mediaEntryId);
  }

  async add(userId: number, mediaEntryId: number): Promise<MediaFavorite> {
    // Defensive: must own the media entry to favorite it.
    const owns = await this.mediaRepo.exist({
      where: { id: mediaEntryId, userId },
    });
    if (!owns) {
      throw new ConflictException(
        'Media entry does not belong to user or does not exist',
      );
    }

    const existing = await this.favRepo.findOne({
      where: { userId, mediaEntryId },
    });
    if (existing) return existing;

    const fav = this.favRepo.create({ userId, mediaEntryId });
    return this.favRepo.save(fav);
  }

  async remove(userId: number, mediaEntryId: number): Promise<void> {
    await this.favRepo.delete({ userId, mediaEntryId });
  }
}
