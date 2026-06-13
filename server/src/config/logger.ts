export const logger = {
  info: (message: string, data?: unknown): void => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: unknown): void => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}: ${error.message}`, error.stack || '');
    } else {
      console.error(`[ERROR] ${message}`, error ? JSON.stringify(error) : '');
    }
  },
  warn: (message: string, data?: unknown): void => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  },
};
