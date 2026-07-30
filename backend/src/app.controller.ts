import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Публичный health-check для оркестраторов запуска (scripts/dev.mjs) и
   * мониторинга. Намеренно не трогает БД: проверяет только, что HTTP-слой
   * поднялся и готов принимать запросы.
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
