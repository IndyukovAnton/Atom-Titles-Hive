import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { MediaFile } from './media-file.entity';
import type { User } from './user.entity';
import type { Group } from './group.entity';

@Entity('media_entries')
@Index(['userId'])
@Index(['groupId'])
@Index(['userId', 'category'])
@Index(['userId', 'createdAt'])
export class MediaEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  image: string | null; // URL или base64

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', default: 5 })
  rating: number; // 1-10

  @Column({ type: 'datetime', nullable: true })
  startDate: Date | null;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date | null;

  @Column({ type: 'text', nullable: true })
  genres: string | null; // JSON массив в БД

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null; // Фильм, Сериал, Аниме и т.д.

  @Column({ type: 'text', nullable: true })
  tags: string | null; // JSON массив в БД

  @ManyToOne('User', 'mediaEntries', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne('Group', 'mediaEntries', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: Group | null;

  @Column({ nullable: true })
  groupId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MediaFile, (file) => file.media, { cascade: true })
  files: MediaFile[];
}
