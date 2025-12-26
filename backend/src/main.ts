import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from './utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS для frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'tauri://localhost', 'http://tauri.localhost'],
    credentials: true,
  });
  
  const port = process.env.PORT || 1221;
  await app.listen(port);
  
  const message = `Backend running on http://localhost:${port}`;
  console.log(`🚀 ${message}`);
  Logger.info(message);
}

bootstrap().catch(err => {
  Logger.error(`Application failed to start: ${err.message}`);
  process.exit(1);
});

