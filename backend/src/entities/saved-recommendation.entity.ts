import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from './user.entity';

export type SavedRecommendationStatus = 'considering' | 'favorited';

export type SavedRecommendationContentType =
  | 'movie'
  | 'series'
  | 'anime'
  | 'book'
  | 'game'
  | 'other';

@Entity('saved_recommendations')
@Index(['userId'])
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
export class SavedRecommendation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  originalTitle?: string | null;

  @Column({ type: 'varchar', length: 16 })
  type: SavedRecommendationContentType;

  @Column({ type: 'integer', nullable: true })
  year?: number | null;

  @Column({ type: 'json', nullable: true })
  genres?: string[] | null;

  @Column({ type: 'text' })
  whyRecommended: string;

  @Column({ type: 'real', nullable: true })
  estimatedRating?: number | null;

  @Column({ type: 'boolean', nullable: true })
  releasedRecently?: boolean | null;

  @Column({ type: 'text', nullable: true })
  posterUrl?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceModel?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'considering' })
  status: SavedRecommendationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
