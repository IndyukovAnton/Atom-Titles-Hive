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
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string; // Будет храниться хеш

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
