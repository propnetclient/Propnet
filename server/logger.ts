// Production-ready logging system
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, data?: any) => {
    if (!isProduction) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  
  debug: (message: string, data?: any) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },
  
  security: (message: string, data?: any) => {
    console.warn(`[SECURITY] ${message}`, data || '');
  }
};