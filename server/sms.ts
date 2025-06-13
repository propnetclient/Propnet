import { config } from './config';

// SMS service implementation using Twilio
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  // Force real SMS delivery when Twilio credentials are available
  const hasCredentials = config.sms.accountSid && config.sms.authToken && config.sms.phoneNumber;
  
  if (!hasCredentials) {
    console.log(`Development SMS to ${phone}: ${message}`);
    return true;
  }
  
  try {
    // Import Twilio dynamically to avoid requiring it in development
    const twilio = await import('twilio');
    const client = twilio.default(config.sms.accountSid, config.sms.authToken);
    
    // Format phone number for international delivery
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const messageResponse = await client.messages.create({
      body: message,
      from: config.sms.phoneNumber,
      to: formattedPhone
    });
    
    console.log(`SMS sent successfully to ${formattedPhone}, SID: ${messageResponse.sid}`);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    // Fall back to console logging in case of Twilio errors
    console.log(`Fallback SMS to ${phone}: ${message}`);
    return false;
  }
}