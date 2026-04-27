import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedRecommendation } from '../../entities/saved-recommendation.entity';
import {
  SaveRecommendationDto,
  SavedRecStatus,
} from './dto/save-recommendation.dto';

@Injectable()
export class SavedRecommendationsService {
  constructor(
    @InjectRepository(SavedRecommendation)
    private readonly repo: Repository<SavedRecommendation>,
  ) {}

  list(
    userId: number,
    status?: SavedRecStatus,
  ): Promise<SavedRecommendation[]> {
    const qb = this.repo
      .createQueryBuilder('rec')
      .where('rec.userId = :userId', { userId })
      .orderBy('rec.createdAt', 'DESC');
    if (status) qb.andWhere('rec.status = :status', { status });
    return qb.getMany();
  }

  async create(
    userId: number,
    dto: SaveRecommendationDto,
  ): Promise<SavedRecommendation> {
    const entity = this.repo.create({
      userId,
      title: dto.title,
      originalTitle: dto.originalTitle ?? null,
      type: dto.type,
      year: dto.year ?? null,
      genres: dto.genres ?? null,
      whyRecommended: dto.whyRecommended,
      estimatedRating: dto.estimatedRating ?? null,
      releasedRecently: dto.releasedRecently ?? null,
      posterUrl: dto.posterUrl ?? null,
      sourceModel: dto.sourceModel ?? null,
      status: dto.status ?? 'considering',
    });
    return this.repo.save(entity);
  }

  async updateStatus(
    userId: number,
    id: number,
    status: SavedRecStatus,
  ): Promise<SavedRecommendation> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) throw new NotFoundException('SavedRecommendation not found');
    existing.status = status;
    return this.repo.save(existing);
  }

  async remove(userId: number, id: number): Promise<void> {
    const result = await this.repo.delete({ id, userId });
    if (result.affected === 0)
      throw new NotFoundException('SavedRecommendation not found');
  }
}
