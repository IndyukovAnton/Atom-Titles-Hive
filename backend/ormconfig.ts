import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { MediaEntry } from './src/entities/media-entry.entity';
import { Group } from './src/entities/group.entity';

export default new DataSource({
  type: 'sqlite',
  database: 'database/app.db',
  entities: [User, MediaEntry, Group],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
