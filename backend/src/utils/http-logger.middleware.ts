import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userId =
      (req as Partial<AuthenticatedRequest>).user?.userId || 'anonymous';

    const startTime = Date.now();

    // Логируем входящий запрос
    void this.logger.log(`${method} ${originalUrl} - User: ${userId}`);

    // Переопределяем метод end для логирования после завершения запроса
    const originalEnd = res.end.bind(res) as typeof res.end;
    const loggerInstance = this.logger;

    res.end = function (
      this: Response,
      chunk?: unknown,
      encoding?: BufferEncoding | (() => void),
      callback?: () => void,
    ): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Логируем результат запроса
      if (statusCode >= 400) {
        // Ошибки
        const level = statusCode >= 500 ? 'ERROR' : 'WARN';
        const logMessage = `${method} ${originalUrl} - ${statusCode} - ${duration}ms - User: ${userId}`;

        if (level === 'ERROR') {
          void loggerInstance.error(logMessage);
        } else {
          void loggerInstance.warn(logMessage);
        }
      } else {
        // Успешные запросы
        void loggerInstance.log(
          `${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );
      }

      // Вызываем оригинальный метод end
      if (typeof encoding === 'function') {
        return originalEnd(chunk, encoding);
      }
      return originalEnd(chunk, encoding as BufferEncoding, callback);
    };

    next();
  }
}
