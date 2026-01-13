import { Group } from '../../src/entities/group.entity';
import { CreateGroupDto } from '../../src/dto/create-group.dto';
import { UpdateGroupDto } from '../../src/dto/update-group.dto';

/**
 * Test fixtures для Group entity
 */

export const createMockGroup = (overrides?: Partial<Group>): Group => {
  const group = new Group();
  group.id = 1;
  group.name = 'Test Group';
  group.userId = 1;
  group.createdAt = new Date('2024-01-01T00:00:00.000Z');
  group.mediaEntries = [];

  return Object.assign(group, overrides);
};

export const createMockGroups = (
  count: number,
  userId: number = 1,
): Group[] => {
  return Array.from({ length: count }, (_, i) => {
    const group = new Group();
    group.id = i + 1;
    group.name = `Test Group ${i + 1}`;
    group.userId = userId;
    group.createdAt = new Date(`2024-01-0${i + 1}T00:00:00.000Z`);
    group.mediaEntries = [];
    return group;
  });
};

export const mockCreateGroupDto: CreateGroupDto = {
  name: 'New Group',
};

export const mockUpdateGroupDto: UpdateGroupDto = {
  name: 'Updated Group',
};
