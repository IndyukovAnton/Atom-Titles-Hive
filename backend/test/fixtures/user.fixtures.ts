import { User } from '../../src/entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Test fixtures для User entity
 */

export const createMockUser = (overrides?: Partial<User>): User => {
  const user = new User();
  user.id = 1;
  user.username = 'testuser';
  user.email = 'test@example.com';
  user.password = 'hashedpassword123';
  user.createdAt = new Date('2024-01-01T00:00:00.000Z');

  return Object.assign(user, overrides);
};

export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => {
    const user = new User();
    user.id = i + 1;
    user.username = `testuser${i + 1}`;
    user.email = `test${i + 1}@example.com`;
    user.password = 'hashedpassword123';
    user.createdAt = new Date(`2024-01-0${i + 1}T00:00:00.000Z`);
    return user;
  });
};

/**
 * Создание пользователя с реальным хешированным паролем
 */
export const createUserWithHashedPassword = async (
  password: string = 'password123',
  overrides?: Partial<User>,
): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return createMockUser({
    password: hashedPassword,
    ...overrides,
  });
};

export const mockUserDto = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

export const mockRegisterDto = {
  username: 'newuser',
  email: 'new@example.com',
  password: 'password123',
};

export const mockLoginDto = {
  username: 'testuser',
  password: 'password123',
};
