import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class LoggerService {
  private readonly logsDir = 'logs';

  /**
   * Форматирует текущее время в формат HH:MM:SS
   */
  private getTimeString(): string {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:MM:SS
  }

  /**
   * Получает имя файла лога на текущую дату
   */
  private getLogFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.txt`;
  }

  /**
   * Создает папку logs, если она не существует
   */
  private async ensureLogsDirectory(): Promise<void> {
    try {
      await fs.access(this.logsDir);
    } catch {
      await fs.mkdir(this.logsDir, { recursive: true });
    }
  }

  /**
   * Записывает сообщение в лог-файл
   */
  private async writeToFile(level: string, message: string): Promise<void> {
    try {
      await this.ensureLogsDirectory();
      
      const timeString = this.getTimeString();
      const logEntry = `[${timeString}] [${level}] ${message}\n`;
      const filePath = join(this.logsDir, this.getLogFileName());

      await fs.appendFile(filePath, logEntry, 'utf8');
    } catch (error) {
      // Если не удалось записать в файл, выводим в консоль
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Логирование уровня INFO
   */
  async log(message: string): Promise<void> {
    console.log(`[INFO] ${message}`);
    await this.writeToFile('INFO', message);
  }

  /**
   * Логирование уровня WARN
   */
  async warn(message: string): Promise<void> {
    console.warn(`[WARN] ${message}`);
    await this.writeToFile('WARN', message);
  }

  /**
   * Логирование уровня ERROR
   */
  async error(message: string, trace?: string): Promise<void> {
    const fullMessage = trace ? `${message}\nStack trace:\n${trace}` : message;
    console.error(`[ERROR] ${fullMessage}`);
    await this.writeToFile('ERROR', fullMessage);
  }

  /**
   * Удаляет логи старше указанного количества дней
   */
  async cleanOldLogs(retentionDays: number = 30): Promise<void> {
    try {
      await this.ensureLogsDirectory();
      const files = await fs.readdir(this.logsDir);
      const now = Date.now();
      const maxAge = retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.txt')) continue;

        const filePath = join(this.logsDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > maxAge) {
          await fs.unlink(filePath);
          await this.log(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
}
