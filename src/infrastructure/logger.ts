export interface AppLogger {
  info(context: object, message: string): void;
  warn(context: object, message: string): void;
  error(context: object, message: string): void;
}

export const logger: AppLogger = {
  info: (context, message) => console.info(JSON.stringify({ level: "info", time: new Date().toISOString(), message, ...context })),
  warn: (context, message) => console.warn(JSON.stringify({ level: "warn", time: new Date().toISOString(), message, ...context })),
  error: (context, message) => console.error(JSON.stringify({ level: "error", time: new Date().toISOString(), message, ...context })),
};
