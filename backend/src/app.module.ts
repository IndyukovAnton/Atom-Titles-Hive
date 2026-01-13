import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_PATH')!,
        entities: [User, MediaEntry, Group],
        synchronize:
          configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: true,
        logging: configService.get<string>('TYPEORM_LOGGING') === 'true',
      }),
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
    consumer.apply(HttpLoggerMiddleware).forRoutes('*'); // Применяем ко всем маршрутам
  }
}
