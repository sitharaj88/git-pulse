/**
 * Log levels for the logger
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

/**
 * Logger class for application logging
 */
export class Logger {
  private level: LogLevel = LogLevel.Info;

  /**
   * Set the logging level
   * @param level - New log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log a debug message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.Debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.Info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.Warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   * @param message - Message to log
   * @param args - Additional arguments
   */
  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.Error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
