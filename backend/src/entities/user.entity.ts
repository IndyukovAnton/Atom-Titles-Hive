import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { MediaEntry } from './media-entry.entity';
import type { Group } from './group.entity';

export interface UserPreferences {
  theme?: 'light' | 'dark';
  background?: string;
  fontSize?: number;
  fontFamily?: string;
  language?: string;
  aiProvider?: string;
  aiKey?: string;
  aiLimits?: {
    dailyRequests?: number;
    maxTokens?: number;
  };
  privacySettings?: {
    shareWatchHistory?: boolean;
    shareBirthDate?: boolean;
  };
  tmdbApiKey?: string;
  avatar?: string;
  addEntryPreviewStyle?: 'mirror' | 'poster';
  /** Закреплённое пользователем звание (code из ProfileStats.earnedTitles).
      Если null/undefined — используется авто-расчёт по топ-категории/жанру. */
  selectedTitle?: string | null;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255, nullable: true })
  password?: string; // Будет храниться хеш, может быть пустым для Google-пользователей

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date | null;

  @Column({ type: 'json', nullable: true })
  preferences?: UserPreferences | null;

  @Column({ default: false })
  hasCompletedOnboarding: boolean;

  @OneToMany('MediaEntry', 'user')
  mediaEntries: MediaEntry[];

  @OneToMany('Group', 'user')
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
