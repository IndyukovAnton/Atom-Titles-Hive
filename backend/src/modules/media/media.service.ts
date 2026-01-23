import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { MediaFile } from '../../entities/media-file.entity';
import { CreateMediaDto } from '../../dto/create-media.dto';
import { UpdateMediaDto } from '../../dto/update-media.dto';
import { LoggerService } from '../../utils/logger.service';
import { MediaFilters } from '../../types/media-filters.interface';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
    @InjectRepository(MediaFile)
    private mediaFileRepository: Repository<MediaFile>,
    private logger: LoggerService,
    private dataSource: DataSource,
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
      await this.logger.log(
        `Media created: "${dto.title}" (ID: ${saved.id}) by user ${userId}`,
      );
      return saved;
    } catch (error) {
      await this.logger.error(
        `Failed to create media: ${dto.title} by user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findAll(userId: number, filters?: MediaFilters): Promise<MediaEntry[]> {
    const query = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.userId = :userId', { userId });

    if (filters) {
      if (filters.groupId !== undefined) {
        if (filters.groupId === null) {
          query.andWhere('media.groupId IS NULL');
        } else {
          query.andWhere('media.groupId = :groupId', {
            groupId: filters.groupId,
          });
        }
      }

      if (filters.category) {
        query.andWhere('media.category = :category', {
          category: filters.category,
        });
      }

      if (filters.search) {
        query.andWhere('media.title LIKE :search', {
          search: `%${filters.search}%`,
        });
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
    return result.map((media) => this.parseJsonFields(media));
  }

  async findOne(id: number, userId: number): Promise<MediaEntry> {
    const media = await this.mediaRepository.findOne({
      where: { id, userId },
      relations: ['group', 'files'],
    });

    if (!media) {
      throw new NotFoundException('Media entry not found');
    }

    return this.parseJsonFields(media);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateMediaDto,
  ): Promise<MediaEntry> {
    await this.findOne(id, userId);

    const updateData: Partial<MediaEntry> = {};

    // Копируем простые поля
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.groupId !== undefined) updateData.groupId = dto.groupId;

    // Преобразуем массивы в JSON строки
    if (dto.genres !== undefined) {
      updateData.genres = Array.isArray(dto.genres)
        ? JSON.stringify(dto.genres)
        : dto.genres;
    }

    if (dto.tags !== undefined) {
      updateData.tags = Array.isArray(dto.tags)
        ? JSON.stringify(dto.tags)
        : dto.tags;
    }

    // Преобразуем строки в даты
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
    await this.logger.log(
      `Media deleted: ID ${id} ("${media.title}") by user ${userId}`,
    );
  }

  async search(userId: number, query: string): Promise<MediaEntry[]> {
    const result = await this.mediaRepository.find({
      where: [
        { userId, title: Like(`%${query}%`) },
        { userId, description: Like(`%${query}%`) },
        { userId, category: Like(`%${query}%`) },
      ],
      order: { createdAt: 'DESC' },
    });

    return result.map((media) => this.parseJsonFields(media));
  }

  async getCategories(userId: number): Promise<string[]> {
    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .select('DISTINCT media.category', 'category')
      .where('media.userId = :userId', { userId })
      .andWhere('media.category IS NOT NULL')
      .getRawMany<{ category: string }>();

    return result.map((r) => r.category).filter((c): c is string => Boolean(c));
  }

  private parseJsonFields(media: MediaEntry): MediaEntry {
    const genres =
      typeof media.genres === 'string' && media.genres
        ? (JSON.parse(media.genres) as string[])
        : [];
    const tags =
      typeof media.tags === 'string' && media.tags
        ? (JSON.parse(media.tags) as string[])
        : [];

    return {
      ...media,
      genres: genres as unknown as string,
      tags: tags as unknown as string,
    } as MediaEntry;
  }

  async addFile(
    id: number,
    userId: number,
    url: string,
    type: 'image' | 'video',
  ): Promise<MediaFile> {
    try {
      const media = await this.findOne(id, userId);
      const file = new MediaFile();
      file.url = url;
      file.type = type;
      file.media = media;
      return await this.mediaFileRepository.save(file);
    } catch (error) {
      await this.logger.error(
        `Failed to add file to media ${id} for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async removeFile(fileId: number, userId: number): Promise<void> {
    const file = await this.mediaFileRepository.findOne({
      where: { id: fileId },
      relations: ['media'],
    });

    if (!file || file.media.userId !== userId) {
      throw new NotFoundException('File not found or access denied');
    }

    await this.mediaFileRepository.remove(file);
  }

  async factoryReset(userId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query('PRAGMA foreign_keys = OFF;');

      await queryRunner.query('DELETE FROM media_files;');
      await queryRunner.query('DELETE FROM media_entries;');
      await queryRunner.query('DELETE FROM groups;');

      await queryRunner.query('PRAGMA foreign_keys = ON;');
      await queryRunner.commitTransaction();

      await this.logger.warn(
        `User ${userId} performed a Factory Reset. All media data deleted.`,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
