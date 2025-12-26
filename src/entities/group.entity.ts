import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { MediaEntry } from './media-entry.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.groups)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => MediaEntry, mediaEntry => mediaEntry.group)
  mediaEntries: MediaEntry[];
}