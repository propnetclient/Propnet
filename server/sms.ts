import { config } from './config';

// SMS service implementation
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!config.isProduction) {
    console.log(`Development SMS to ${phone}: ${message}`);
    return true;
  }
  
  // Production SMS implementation
  if (!config.sms.accountSid || !config.sms.authToken || !config.sms.phoneNumber) {
    throw new Error('SMS service not configured. Missing Twilio credentials.');
  }
  
  try {
    // Twilio integration would go here
    // const twilio = require('twilio');
    // const client = twilio(config.sms.accountSid, config.sms.authToken);
    // await client.messages.create({
    //   body: message,
    //   from: config.sms.phoneNumber,
    //   to: phone
    // });
    
    console.warn('SMS service integration pending - Twilio setup required');
    return false;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}