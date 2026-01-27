import { Logger, QueryRunner } from 'typeorm';
import { LoggerService } from './logger.service';

export class CleanTypeOrmLogger implements Logger {
  constructor(private readonly logger: LoggerService) {}

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const cleanedQuery = this.cleanQuery(query);
    this.logger.log(`query: ${cleanedQuery}`);
    if (parameters && parameters.length) {
      // Опционально: можно раскомментировать, если нужны параметры
      // this.logger.debug(`parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const cleanedQuery = this.cleanQuery(query);
    this.logger.error(`query failed: ${cleanedQuery}`);
    this.logger.error(`error: ${error}`);
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    const cleanedQuery = this.cleanQuery(query);
    this.logger.warn(`query is slow: ${time}ms`);
    this.logger.warn(`execution: ${cleanedQuery}`);
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`schema build: ${message}`);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    switch (level) {
      case 'log':
      case 'info':
        this.logger.log(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
    }
  }

  private cleanQuery(query: string): string {
    // Удаляем конструкции вида AS "TableName_ColumnName"
    // Регулярное выражение ищет 'AS "' затем любые символы, кроме кавычек, затем '"'
    // Флаг g нужен для замены всех вхождений
    return query.replace(/ AS "[^"]+"/g, '');
  }
}
