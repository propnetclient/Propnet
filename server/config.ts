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
  'TWILIO_PHONE_NUMBER',
  'BASE_URL'
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (process.env.NODE_ENV === 'production') {
    missing.push(...productionRequiredVars.filter(envVar => !process.env[envVar]));
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 5000,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
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
  }
};