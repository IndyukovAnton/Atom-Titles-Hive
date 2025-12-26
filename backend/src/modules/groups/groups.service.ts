import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Group } from '../../entities/group.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupDto } from '../../dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
  ) {}

  async create(userId: number, dto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create({
      name: dto.name,
      userId,
    });

    return await this.groupRepository.save(group);
  }

  async findAll(userId: number): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
      relations: ['mediaEntries'],
    });
  }

  async findOne(id: number, userId: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, userId },
      relations: ['mediaEntries'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async update(id: number, userId: number, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id, userId);

    await this.groupRepository.update(id, dto);

    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const group = await this.findOne(id, userId);

    // Перенести все записи в "Без группы" (groupId = null)
    await this.mediaRepository.update(
      { groupId: id },
      { groupId: null }
    );

    await this.groupRepository.remove(group);
  }

  async getGroupStats(userId: number) {
    const groups = await this.findAll(userId);
    
    const ungroupedCount = await this.mediaRepository.count({
      where: { userId, groupId: IsNull() }
    });

    return {
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        count: group.mediaEntries?.length || 0,
      })),
      ungrouped: ungroupedCount,
    };
  }
}
