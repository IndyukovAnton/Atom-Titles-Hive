import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export interface UserPreferences {
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
  tmdbApiKey?: string;
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
  mediaEntries: any[];

  @OneToMany('Group', 'user')
  groups: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
