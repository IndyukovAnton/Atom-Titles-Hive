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

@Entity('groups')
@Index(['userId'])
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne('User', 'groups', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;

  @Column()
  userId: number;

  @OneToMany('MediaEntry', 'group')
  mediaEntries: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
