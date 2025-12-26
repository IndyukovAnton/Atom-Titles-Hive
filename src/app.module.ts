import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CollectionsModule } from './collections/collections.module';
import { ProfileModule } from './profile/profile.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/app.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Только для разработки
    }),
    AuthModule,
    CollectionsModule,
    ProfileModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
