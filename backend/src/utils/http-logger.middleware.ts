import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const userId = (req as any).user?.userId || 'anonymous';

    const startTime = Date.now();

    // Логируем входящий запрос
    this.logger.log(`${method} ${originalUrl} - User: ${userId}`);

    // Переопределяем метод end для логирования после завершения запроса
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any, callback?: any): any {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Логируем результат запроса
      if (statusCode >= 400) {
        // Ошибки
        const level = statusCode >= 500 ? 'ERROR' : 'WARN';
        const logMessage = `${method} ${originalUrl} - ${statusCode} - ${duration}ms - User: ${userId}`;
        
        if (level === 'ERROR') {
          logger.error(logMessage);
        } else {
          logger.warn(logMessage);
        }
      } else {
        // Успешные запросы
        logger.log(`${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
      }

      // Вызываем оригинальный метод end
      return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
  }
}
