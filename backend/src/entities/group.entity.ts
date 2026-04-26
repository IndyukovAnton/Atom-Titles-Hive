import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import type { User } from './user.entity';
import type { MediaEntry } from './media-entry.entity';

@Entity('groups')
@Index(['userId'])
@Index(['userId', 'createdAt'])
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne('User', 'groups', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ nullable: true })
  parentId: number | null;

  @ManyToOne(() => Group, (group) => group.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Group;

  @OneToMany(() => Group, (group) => group.parent)
  children: Group[];

  @OneToMany('MediaEntry', 'group')
  mediaEntries: MediaEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
