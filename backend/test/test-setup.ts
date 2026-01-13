import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { MediaEntry } from '../src/entities/media-entry.entity';
import { Group } from '../src/entities/group.entity';

/**
 * In-memory SQLite конфигурация для тестов
 */
export const testDataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [User, MediaEntry, Group],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

/**
 * Создание тестового DataSource
 */
export const createTestDataSource = async (): Promise<DataSource> => {
  const dataSource = new DataSource(testDataSourceOptions);
  await dataSource.initialize();
  return dataSource;
};

/**
 * Очистка всех таблиц
 */
export const clearDatabase = async (dataSource: DataSource): Promise<void> => {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
};
