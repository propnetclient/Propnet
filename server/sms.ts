import { config } from './config';

// SMS service implementation using Twilio
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  // Debug credential availability
  console.log('SMS Service Debug:');
  console.log('Account SID:', config.sms.accountSid ? 'Present' : 'Missing');
  console.log('Auth Token:', config.sms.authToken ? 'Present' : 'Missing');
  console.log('Phone Number:', config.sms.phoneNumber || 'Missing');
  
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
    
    // Check delivery status after a short delay
    setTimeout(async () => {
      try {
        const messageStatus = await client.messages(messageResponse.sid).fetch();
        console.log(`SMS Status for ${formattedPhone}: ${messageStatus.status}`);
        if (messageStatus.errorCode) {
          console.error(`SMS Error ${messageStatus.errorCode}: ${messageStatus.errorMessage}`);
        }
      } catch (statusError) {
        console.warn('Could not check SMS status:', statusError);
      }
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    // For trial accounts that can't deliver to unverified numbers, log the OTP
    console.log(`Trial Account - OTP for ${phone}: ${message.match(/\d{6}/)?.[0] || 'N/A'}`);
    return false;
  }
}