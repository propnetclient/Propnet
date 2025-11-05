// Production configuration validation
const requiredEnvVars = [
  'DATABASE_URL',
  'GEMINI_API_KEY', 
  'GOOGLE_MAPS_API_KEY'
];

const productionRequiredVars = [
  'SESSION_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_PHONE_NUMBER'
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (process.env.NODE_ENV === 'production') {
    missing.push(...productionRequiredVars.filter(envVar => !process.env[envVar]));
  }

}

export const config = {
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
  stage: process.env.STAGE || 'development',
  port: process.env.PORT || 5000,
  baseUrl: process.env.BASE_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://your-real-estate-platform.com' 
    : 'http://localhost:5000'),
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  database: {
    url: process.env.DATABASE_URL!
  },
  apis: {
    gemini: process.env.GEMINI_API_KEY!,
    googleMaps: process.env.GOOGLE_MAPS_API_KEY!
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://your-real-estate-platform.com',
          'https://www.your-real-estate-platform.com',
          /\.replit\.app$/,
          /\.repl\.co$/
        ]
      : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000']
  },
  security: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: process.env.STAGE === 'beta' ? 1000 : 100
    },
    ssl: {
      enabled: process.env.NODE_ENV === 'production',
      provider: 'letsencrypt'
    }
  }
};