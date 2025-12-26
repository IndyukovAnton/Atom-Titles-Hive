import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { User } from '../../entities/user.entity';
import { MediaEntry } from '../../entities/media-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, MediaEntry])],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
