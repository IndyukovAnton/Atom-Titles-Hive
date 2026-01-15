import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
import { User } from './src/entities/user.entity';
import { MediaEntry } from './src/entities/media-entry.entity';
import { MediaFile } from './src/entities/media-file.entity';
import { Group } from './src/entities/group.entity';

export default new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH!,
  entities: [User, MediaEntry, MediaFile, Group],
  migrations: ['src/migrations/*.ts'],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: process.env.TYPEORM_LOGGING === 'true',
});
