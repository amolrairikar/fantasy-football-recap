export const logger = {
  error(message: string, ...args: unknown[]): void {
    console.error(`[error] ${message}`, ...args);
  },
};
