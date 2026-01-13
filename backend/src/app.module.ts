import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { MediaEntry } from './entities/media-entry.entity';
import { Group } from './entities/group.entity';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ProfileModule } from './modules/profile/profile.module';
import { LoggerService } from './utils/logger.service';
import { HttpLoggerMiddleware } from './utils/http-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database/app.db',
      entities: [User, MediaEntry, Group],
      synchronize: false, // Отключено для production, используются миграции
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      migrationsRun: true, // Автоматический запуск миграций при старте
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    MediaModule,
    GroupsModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService, // Глобальный LoggerService
  ],
  exports: [LoggerService], // Экспортируем для использования в других модулях
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes('*'); // Применяем ко всем маршрутам
  }
}

