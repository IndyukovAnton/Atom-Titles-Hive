import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('media_entries')
@Index(['userId'])
@Index(['groupId'])
@Index(['userId', 'category'])
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
  user: any;

  @Column()
  userId: number;

  @ManyToOne('Group', 'mediaEntries', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: any;

  @Column({ nullable: true })
  groupId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
