import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MediaEntry } from './media-entry.entity';

@Entity('media_files')
export class MediaFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 20, default: 'image' })
  type: 'image' | 'video';

  @ManyToOne(() => MediaEntry, (media) => media.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mediaId' })
  media: MediaEntry;

  @Column()
  mediaId: number;

  @CreateDateColumn()
  createdAt: Date;
}
