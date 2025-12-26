import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from '../../entities/group.entity';
import { MediaEntry } from '../../entities/media-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, MediaEntry])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
