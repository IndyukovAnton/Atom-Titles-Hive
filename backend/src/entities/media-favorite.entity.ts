import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { MediaEntry } from './media-entry.entity';
import type { User } from './user.entity';

@Entity('media_favorites')
@Unique(['userId', 'mediaEntryId'])
@Index(['userId'])
@Index(['userId', 'createdAt'])
export class MediaFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne('MediaEntry', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mediaEntryId' })
  mediaEntry: MediaEntry;

  @Column()
  mediaEntryId: number;

  @CreateDateColumn()
  createdAt: Date;
}
