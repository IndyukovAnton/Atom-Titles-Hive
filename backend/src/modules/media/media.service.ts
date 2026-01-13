import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { CreateMediaDto } from '../../dto/create-media.dto';
import { UpdateMediaDto } from '../../dto/update-media.dto';
import { LoggerService } from '../../utils/logger.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
    private logger: LoggerService,
  ) {}

  async create(userId: number, dto: CreateMediaDto): Promise<MediaEntry> {
    try {
      const media = new MediaEntry();
      media.title = dto.title;
      media.image = dto.image ?? null;
      media.description = dto.description ?? null;
      media.rating = dto.rating;
      media.category = dto.category ?? null;
      media.groupId = dto.groupId ?? null;
      media.userId = userId;
      media.genres = dto.genres ? JSON.stringify(dto.genres) : null;
      media.tags = dto.tags ? JSON.stringify(dto.tags) : null;
      media.startDate = dto.startDate ? new Date(dto.startDate) : null;
      media.endDate = dto.endDate ? new Date(dto.endDate) : null;

      const saved = await this.mediaRepository.save(media);
      await this.logger.log(`Media created: "${dto.title}" (ID: ${saved.id}) by user ${userId}`);
      return saved;
    } catch (error) {
      await this.logger.error(
        `Failed to create media: ${dto.title} by user ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  async findAll(userId: number, filters?: {
    groupId?: number;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MediaEntry[]> {
    const query = this.mediaRepository.createQueryBuilder('media')
      .where('media.userId = :userId', { userId });

    if (filters) {
      if (filters.groupId !== undefined) {
        if (filters.groupId === null) {
          query.andWhere('media.groupId IS NULL');
        } else {
          query.andWhere('media.groupId = :groupId', { groupId: filters.groupId });
        }
      }

      if (filters.category) {
        query.andWhere('media.category = :category', { category: filters.category });
      }

      if (filters.search) {
        query.andWhere('media.title LIKE :search', { search: `%${filters.search}%` });
      }
    }

    query.orderBy('media.createdAt', 'DESC');

    // Добавляем пагинацию
    if (filters?.limit) {
      query.take(filters.limit);
    }
    if (filters?.offset) {
      query.skip(filters.offset);
    }

    const result = await query.getMany();
    
    // Парсим JSON поля
    return result.map(media => this.parseJsonFields(media));
  }

  async findOne(id: number, userId: number): Promise<MediaEntry> {
    const media = await this.mediaRepository.findOne({ 
      where: { id, userId },
      relations: ['group']
    });

    if (!media) {
      throw new NotFoundException('Media entry not found');
    }

    return this.parseJsonFields(media);
  }

  async update(id: number, userId: number, dto: UpdateMediaDto): Promise<MediaEntry> {
    const media = await this.findOne(id, userId);

    const updateData: any = { ...dto };
    
    if (dto.genres !== undefined) {
      updateData.genres = Array.isArray(dto.genres) ? JSON.stringify(dto.genres) : dto.genres;
    }
    
    if (dto.tags !== undefined) {
      updateData.tags = Array.isArray(dto.tags) ? JSON.stringify(dto.tags) : dto.tags;
    }

    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    await this.mediaRepository.update(id, updateData);

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const media = await this.findOne(id, userId);
    await this.mediaRepository.remove(media);
    await this.logger.log(`Media deleted: ID ${id} ("${media.title}") by user ${userId}`);
  }

  async search(userId: number, query: string): Promise<MediaEntry[]> {
    const result = await this.mediaRepository.find({
      where: [
        { userId, title: Like(`%${query}%`) },
        { userId, description: Like(`%${query}%`) },
        { userId, category: Like(`%${query}%`) }
      ],
      order: { createdAt: 'DESC' }
    });

    return result.map(media => this.parseJsonFields(media));
  }

  async getCategories(userId: number): Promise<string[]> {
    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .select('DISTINCT media.category', 'category')
      .where('media.userId = :userId', { userId })
      .andWhere('media.category IS NOT NULL')
      .getRawMany();

    return result.map(r => r.category).filter(Boolean);
  }

  private parseJsonFields(media: MediaEntry): MediaEntry {
    const parsed = {
      ...media,
      genres: typeof media.genres === 'string' && media.genres ? JSON.parse(media.genres) : [],
      tags: typeof media.tags === 'string' && media.tags ? JSON.parse(media.tags) : [],
    };
    return parsed as MediaEntry;
  }
}
