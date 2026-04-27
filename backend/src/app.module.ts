import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { MediaEntry } from './entities/media-entry.entity';
import { MediaFile } from './entities/media-file.entity';
import { MediaFavorite } from './entities/media-favorite.entity';
import { Group } from './entities/group.entity';
import { SavedRecommendation } from './entities/saved-recommendation.entity';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LibraryModule } from './modules/library/library.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { LoggerService } from './utils/logger.service';
import { CleanTypeOrmLogger } from './utils/clean-typeorm.logger';
import { HttpLoggerMiddleware } from './utils/http-logger.middleware';
import { validate } from './config/env.validation';
import { getDatabasePath } from './utils/path.utils';
import { InitialSchema1736729735000 } from './migrations/1736729735000-InitialSchema';
import { AddParentIdToGroups1768295470289 } from './migrations/1768295470289-AddParentIdToGroups';
import { AddMediaFiles1768297695198 } from './migrations/1768297695198-AddMediaFiles';
import { AddUserPersonalization1768446524526 } from './migrations/1768446524526-AddUserPersonalization';
import { AddGoogleAuthFields1768473242770 } from './migrations/1768473242770-AddGoogleAuthFields';
import { AddCreatedAtIndexes1777708800000 } from './migrations/1777708800000-AddCreatedAtIndexes';
import { AddLibraryEntities1782000000000 } from './migrations/1782000000000-AddLibraryEntities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>('NODE_ENV') || 'development';
        const dbPathConfig = configService.get<string>('DATABASE_PATH')!;

        const dbPath = getDatabasePath(env, dbPathConfig);
        console.log(`[Database] Using database at: ${dbPath}`);

        const isDev = env === 'development';
        const syncRequested =
          configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true';
        const synchronize = isDev && syncRequested;
        console.log(
          `[Database] Synchronize: ${synchronize} (env=${env}, raw=${configService.get<string>('TYPEORM_SYNCHRONIZE')})`,
        );

        const migrations = [
          InitialSchema1736729735000,
          AddParentIdToGroups1768295470289,
          AddMediaFiles1768297695198,
          AddUserPersonalization1768446524526,
          AddGoogleAuthFields1768473242770,
          AddCreatedAtIndexes1777708800000,
          AddLibraryEntities1782000000000,
        ];

        return {
          type: 'sqlite',
          database: dbPath,
          entities: [
            User,
            MediaEntry,
            MediaFile,
            MediaFavorite,
            Group,
            SavedRecommendation,
          ],
          synchronize,
          migrations,
          // We run migrations manually at bootstrap to support legacy DB upgrades
          // (existing schema without migrations table).
          migrationsRun: false,
          // logging: configService.get<string>('TYPEORM_LOGGING') === 'true',
          logger:
            configService.get<string>('TYPEORM_LOGGING') === 'true'
              ? new CleanTypeOrmLogger(new LoggerService())
              : undefined,
        };
      },
    }),
    AuthModule,
    MediaModule,
    GroupsModule,
    LibraryModule,
    ProfileModule,
    RecommendationsModule,
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
