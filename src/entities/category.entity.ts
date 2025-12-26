import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { MediaEntry } from './media-entry.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.categories)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => MediaEntry, mediaEntry => mediaEntry.category)
  mediaEntries: MediaEntry[];
}