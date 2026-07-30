import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Group } from '../../entities/group.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupDto } from '../../dto/update-group.dto';
import { MoveGroupDto } from '../../dto/move-group.dto';
import { LoggerService } from '../../utils/logger.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
    private logger: LoggerService,
  ) {}

  async create(userId: number, dto: CreateGroupDto): Promise<Group> {
    if (dto.parentId != null) {
      await this.assertParentGroupOwnership(dto.parentId, userId);
    }

    const sortOrder = await this.getNextSortOrder(userId, dto.parentId ?? null);

    const group = this.groupRepository.create({
      name: dto.name,
      userId,
      parentId: dto.parentId ?? null,
      sortOrder,
    });

    const saved = await this.groupRepository.save(group);
    await this.logger.log(
      `Group created: "${dto.name}" (ID: ${saved.id}) by user ${userId}`,
    );
    return saved;
  }

  async findAll(userId: number): Promise<Group[]> {
    return await this.groupRepository.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
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

  async update(
    id: number,
    userId: number,
    dto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.findOne(id, userId);

    const payload: Partial<Group> = {};
    if (dto.name !== undefined) {
      payload.name = dto.name;
    }

    // parentId может быть явным null — проверяем присутствие ключа,
    // а не truthiness, иначе вынос в корень молча игнорируется.
    if (dto.parentId !== undefined) {
      if (dto.parentId !== null) {
        await this.assertValidNewParent(id, dto.parentId, userId);
      }
      payload.parentId = dto.parentId;

      if (dto.parentId !== group.parentId) {
        payload.sortOrder = await this.getNextSortOrder(userId, dto.parentId);
      }
    }

    await this.groupRepository.update(id, payload);
    await this.logger.log(
      `Group updated: ID ${id} ("${dto.name || group.name}") by user ${userId}`,
    );

    return this.findOne(id, userId);
  }

  /**
   * Перемещение группы: смена родителя и позиции среди siblings за один
   * вызов. sortOrder всех затронутых siblings перенормализуется (0..n-1),
   * чтобы порядок оставался плотным и детерминированным.
   */
  async move(id: number, userId: number, dto: MoveGroupDto): Promise<Group> {
    const group = await this.findOne(id, userId);

    if (dto.parentId !== null) {
      await this.assertValidNewParent(id, dto.parentId, userId);
    }
    if (dto.beforeId != null && dto.beforeId === id) {
      throw new BadRequestException('Group cannot be placed before itself');
    }

    await this.groupRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Group);

      const siblings = await repo.find({
        where: {
          userId,
          parentId: dto.parentId === null ? IsNull() : dto.parentId,
        },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });

      const orderedIds = siblings.map((s) => s.id).filter((s) => s !== id);

      let insertIndex = orderedIds.length;
      if (dto.beforeId != null) {
        const beforeIndex = orderedIds.indexOf(dto.beforeId);
        if (beforeIndex === -1) {
          throw new BadRequestException(
            'beforeId does not belong to the target parent',
          );
        }
        insertIndex = beforeIndex;
      }
      orderedIds.splice(insertIndex, 0, id);

      for (let index = 0; index < orderedIds.length; index++) {
        const siblingId = orderedIds[index];
        await repo.update(siblingId, {
          sortOrder: index,
          ...(siblingId === id ? { parentId: dto.parentId } : {}),
        });
      }
    });

    await this.logger.log(
      `Group moved: ID ${id} ("${group.name}") to parent ${dto.parentId ?? 'root'} by user ${userId}`,
    );

    return this.findOne(id, userId);
  }

  /**
   * Родительская группа обязана принадлежать тому же пользователю —
   * иначе по произвольному id можно встроиться в чужую иерархию.
   */
  private async assertParentGroupOwnership(
    parentId: number,
    userId: number,
  ): Promise<void> {
    const parent = await this.groupRepository.findOne({
      where: { id: parentId, userId },
    });

    if (!parent) {
      throw new BadRequestException('Parent group not found or access denied');
    }
  }

  /**
   * Новый родитель валиден, если он принадлежит пользователю и не является
   * самой группой или её потомком (иначе получим цикл и сломанное дерево).
   */
  private async assertValidNewParent(
    id: number,
    parentId: number,
    userId: number,
  ): Promise<void> {
    if (parentId === id) {
      throw new BadRequestException('Group cannot be its own parent');
    }
    await this.assertParentGroupOwnership(parentId, userId);

    const descendantIds = await this.collectDescendantIds(userId, id);
    if (descendantIds.has(parentId)) {
      throw new BadRequestException(
        'Group cannot be moved into its own descendant',
      );
    }
  }

  /**
   * BFS по поддереву группы. Загружаем группы пользователя один раз —
   * дерево у пользователя небольшое, рекурсивные запросы не нужны.
   */
  private async collectDescendantIds(
    userId: number,
    rootId: number,
  ): Promise<Set<number>> {
    const groups = await this.groupRepository.find({
      where: { userId },
      select: ['id', 'parentId'],
    });

    const childrenByParent = new Map<number, number[]>();
    for (const group of groups) {
      if (group.parentId == null) continue;
      const children = childrenByParent.get(group.parentId) ?? [];
      children.push(group.id);
      childrenByParent.set(group.parentId, children);
    }

    const descendants = new Set<number>();
    const stack = [...(childrenByParent.get(rootId) ?? [])];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (descendants.has(current)) continue;
      descendants.add(current);
      stack.push(...(childrenByParent.get(current) ?? []));
    }
    return descendants;
  }

  private async getNextSortOrder(
    userId: number,
    parentId: number | null,
  ): Promise<number> {
    const lastSibling = await this.groupRepository.findOne({
      where: { userId, parentId: parentId === null ? IsNull() : parentId },
      order: { sortOrder: 'DESC' },
    });

    return lastSibling ? lastSibling.sortOrder + 1 : 0;
  }

  async remove(id: number, userId: number): Promise<void> {
    const group = await this.findOne(id, userId);
    const mediaCount = group.mediaEntries?.length || 0;

    // Перенести все записи в "Без группы" (groupId = null)
    await this.mediaRepository.update({ groupId: id }, { groupId: null });

    await this.groupRepository.remove(group);
    await this.logger.log(
      `Group deleted: ID ${id} ("${group.name}"). ${mediaCount} media entries moved to ungrouped by user ${userId}`,
    );
  }

  async getGroupStats(userId: number) {
    const groups = await this.findAll(userId);

    const ungroupedCount = await this.mediaRepository.count({
      where: { userId, groupId: IsNull() },
    });

    const childrenByParent = new Map<number, Group[]>();
    for (const group of groups) {
      if (group.parentId == null) continue;
      const children = childrenByParent.get(group.parentId) ?? [];
      children.push(group);
      childrenByParent.set(group.parentId, children);
    }

    // totalCount = записи самой группы + записи всех потомков.
    // Считается снизу вверх с мемоизацией, чтобы не пересчитывать поддеревья.
    const totalCountMemo = new Map<number, number>();
    // Защита от циклов в повреждённых данных: re-entry даёт 0 вклада,
    // иначе рекурсия уходит в бесконечность и endpoint падает с 500.
    const visiting = new Set<number>();
    const computeTotalCount = (group: Group): number => {
      const cached = totalCountMemo.get(group.id);
      if (cached !== undefined) return cached;
      if (visiting.has(group.id)) return 0;

      visiting.add(group.id);
      const own = group.mediaEntries?.length || 0;
      const total = (childrenByParent.get(group.id) ?? []).reduce(
        (sum, child) => sum + computeTotalCount(child),
        own,
      );
      visiting.delete(group.id);
      totalCountMemo.set(group.id, total);
      return total;
    };

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        parentId: group.parentId,
        sortOrder: group.sortOrder,
        count: group.mediaEntries?.length || 0,
        totalCount: computeTotalCount(group),
      })),
      ungrouped: ungroupedCount,
    };
  }
}
