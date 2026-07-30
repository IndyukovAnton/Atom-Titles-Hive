import { Logger, QueryRunner } from 'typeorm';
import { LoggerService } from './logger.service';

export class CleanTypeOrmLogger implements Logger {
  constructor(private readonly logger: LoggerService) {}

  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    const cleanedQuery = this.cleanQuery(query);
    void this.logger.log(`query: ${cleanedQuery}`);
    if (parameters && parameters.length) {
      // Опционально: можно раскомментировать, если нужны параметры
      // this.logger.debug(`parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    _parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    const cleanedQuery = this.cleanQuery(query);
    void this.logger.error(`query failed: ${cleanedQuery}`);
    void this.logger.error(`error: ${String(error)}`);
  }

  logQuerySlow(
    time: number,
    query: string,
    _parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    const cleanedQuery = this.cleanQuery(query);
    void this.logger.warn(`query is slow: ${time}ms`);
    void this.logger.warn(`execution: ${cleanedQuery}`);
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    void this.logger.log(`schema build: ${message}`);
  }

  logMigration(message: string, _queryRunner?: QueryRunner) {
    void this.logger.log(`migration: ${message}`);
  }

  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    _queryRunner?: QueryRunner,
  ) {
    switch (level) {
      case 'log':
      case 'info':
        void this.logger.log(String(message));
        break;
      case 'warn':
        void this.logger.warn(String(message));
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
