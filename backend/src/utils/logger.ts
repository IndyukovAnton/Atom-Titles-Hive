import * as fs from 'fs';
import * as path from 'path';

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private static logsDir = path.join(process.cwd(), '..', 'logs');

  private static ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private static getLogFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.txt`;
  }

  private static formatMessage(level: LogLevel, message: string): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const time = `${hours}:${minutes}:${seconds}`;
    
    return `[${time}] [${level}] ${message}\n`;
  }

  private static writeLog(level: LogLevel, message: string) {
    this.ensureLogsDir();
    const fileName = this.getLogFileName();
    const filePath = path.join(this.logsDir, fileName);
    const formattedMessage = this.formatMessage(level, message);

    try {
      fs.appendFileSync(filePath, formattedMessage, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }

    // Также выводим в консоль
    console.log(formattedMessage.trim());
  }

  static info(message: string) {
    this.writeLog(LogLevel.INFO, message);
  }

  static warn(message: string) {
    this.writeLog(LogLevel.WARN, message);
  }

  static error(message: string) {
    this.writeLog(LogLevel.ERROR, message);
  }
}
