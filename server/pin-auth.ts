import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users, otpSessions } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sendSMS } from './sms';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_DAYS = 30;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;

// In-memory rate limiting for OTP requests
const otpRateLimit = new Map<string, { count: number; resetAt: number }>();

interface AuthResult {
  success: boolean;
  message?: string;
  user?: any;
  sessionToken?: string;
  requiresPinSetup?: boolean;
  requiresProfileComplete?: boolean;
}

export class PinAuthService {
  // Generate secure OTP
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Generate secure session token
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash data securely
  private async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, SALT_ROUNDS);
  }

  // Verify hashed data
  private async verifyHash(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  // Check rate limit for OTP requests
  private checkOtpRateLimit(phone: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const key = phone;
    const limit = otpRateLimit.get(key);

    if (!limit || now > limit.resetAt) {
      // Reset or create new window
      otpRateLimit.set(key, { count: 1, resetAt: now + (RATE_LIMIT_WINDOW_MINUTES * 60 * 1000) });
      return { allowed: true };
    }

    if (limit.count >= MAX_OTP_REQUESTS_PER_WINDOW) {
      return { 
        allowed: false, 
        message: `Too many OTP requests. Please wait ${Math.ceil((limit.resetAt - now) / (60 * 1000))} minutes.` 
      };
    }

    limit.count++;
    return { allowed: true };
  }

  // Check if phone number needs OTP verification
  async needsPhoneVerification(phone: string): Promise<boolean> {
    const user = await db.select({ isPhoneVerified: users.isPhoneVerified })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    return !user[0]?.isPhoneVerified;
  }

  // Send OTP for phone verification or PIN reset
  async sendOTP(phone: string, purpose: 'verification' | 'pin_reset'): Promise<AuthResult> {
    // Check rate limit
    const rateCheck = this.checkOtpRateLimit(phone);
    if (!rateCheck.allowed) {
      return { success: false, message: rateCheck.message };
    }

    // For PIN reset, ensure user exists and phone is verified
    if (purpose === 'pin_reset') {
      const user = await db.select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (!user[0]) {
        return { success: false, message: "Invalid request." };
      }

      if (!user[0].isPhoneVerified) {
        return { success: false, message: "Phone number not verified." };
      }
    }

    // Generate and hash OTP
    const otp = this.generateOTP();
    const otpHash = await this.hashData(otp);
    const expiresAt = new Date(Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000));

    // Invalidate any existing OTP sessions for this phone and purpose
    await db.update(otpSessions)
      .set({ isUsed: true })
      .where(and(
        eq(otpSessions.phone, phone),
        eq(otpSessions.purpose, purpose),
        eq(otpSessions.isUsed, false)
      ));

    // Create new OTP session
    await db.insert(otpSessions).values({
      phone,
      otpHash,
      purpose,
      attempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
      isUsed: false,
      expiresAt
    });

    // Send SMS
    const smsMessage = purpose === 'verification' 
      ? `Your PropNet verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      : `Your PropNet PIN reset code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;

    const smsSent = await sendSMS(phone, smsMessage);
    if (!smsSent) {
      return { success: false, message: "Failed to send SMS. Please try again." };
    }

    return { 
      success: true, 
      message: `Verification code sent to ${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}` 
    };
  }

  // Verify OTP and handle phone verification
  async verifyOTP(phone: string, otp: string, purpose: 'verification' | 'pin_reset'): Promise<AuthResult> {
    const now = new Date();

    // Find active OTP session
    const session = await db.select()
      .from(otpSessions)
      .where(and(
        eq(otpSessions.phone, phone),
        eq(otpSessions.purpose, purpose),
        eq(otpSessions.isUsed, false),
        gt(otpSessions.expiresAt, now)
      ))
      .orderBy(otpSessions.createdAt)
      .limit(1);

    if (!session[0]) {
      return { success: false, message: "Invalid or expired verification code." };
    }

    const otpSession = session[0];

    // Check attempt limit
    const attempts = otpSession.attempts || 0;
    const maxAttempts = otpSession.maxAttempts || MAX_OTP_ATTEMPTS;
    
    if (attempts >= maxAttempts) {
      await db.update(otpSessions)
        .set({ isUsed: true })
        .where(eq(otpSessions.id, otpSession.id));
      
      return { success: false, message: "Too many failed attempts. Please request a new code." };
    }

    // Verify OTP
    const isValidOtp = await this.verifyHash(otp, otpSession.otpHash);
    
    if (!isValidOtp) {
      // Increment attempts
      await db.update(otpSessions)
        .set({ attempts: attempts + 1 })
        .where(eq(otpSessions.id, otpSession.id));

      const remainingAttempts = maxAttempts - (attempts + 1);
      return { 
        success: false, 
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.` 
      };
    }

    // Mark OTP as used
    await db.update(otpSessions)
      .set({ isUsed: true })
      .where(eq(otpSessions.id, otpSession.id));

    if (purpose === 'verification') {
      // Mark phone as verified and create/update user
      let user = await db.select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (!user[0]) {
        // Create new user
        const newUser = await db.insert(users)
          .values({
            phone,
            isPhoneVerified: true,
            lastLoginAt: now
          })
          .returning();
        
        return { 
          success: true, 
          message: "Phone verified successfully.",
          user: newUser[0],
          requiresPinSetup: true,
          requiresProfileComplete: true
        };
      } else {
        // Update existing user
        const updatedUser = await db.update(users)
          .set({ 
            isPhoneVerified: true,
            lastLoginAt: now
          })
          .where(eq(users.id, user[0].id))
          .returning();

        return {
          success: true,
          message: "Phone verified successfully.",
          user: updatedUser[0],
          requiresPinSetup: !updatedUser[0].pinHash,
          requiresProfileComplete: !updatedUser[0].isProfileComplete
        };
      }
    } else {
      // PIN reset - return success for PIN reset flow
      return { 
        success: true, 
        message: "Verification successful. You can now set a new PIN." 
      };
    }
  }

  // Set or update user PIN
  async setPIN(phone: string, pin: string, keepLoggedIn: boolean = false): Promise<AuthResult> {
    if (!/^\d{4,6}$/.test(pin)) {
      return { success: false, message: "PIN must be 4-6 digits." };
    }

    const user = await db.select()
      .from(users)
      .where(and(
        eq(users.phone, phone),
        eq(users.isPhoneVerified, true)
      ))
      .limit(1);

    if (!user[0]) {
      return { success: false, message: "User not found or phone not verified." };
    }

    const pinHash = await this.hashData(pin);
    const sessionToken = this.generateSessionToken();
    const sessionExpiresAt = keepLoggedIn 
      ? new Date(Date.now() + (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000))
      : null;

    const updatedUser = await db.update(users)
      .set({ 
        pinHash,
        sessionToken,
        sessionExpiresAt,
        keepLoggedIn,
        lastLoginAt: new Date()
      })
      .where(eq(users.id, user[0].id))
      .returning();

    return {
      success: true,
      message: "PIN set successfully.",
      user: updatedUser[0],
      sessionToken,
      requiresProfileComplete: !updatedUser[0].isProfileComplete
    };
  }

  // Login with PIN
  async loginWithPIN(phone: string, pin: string, keepLoggedIn: boolean = false): Promise<AuthResult> {
    const user = await db.select()
      .from(users)
      .where(and(
        eq(users.phone, phone),
        eq(users.isPhoneVerified, true)
      ))
      .limit(1);

    if (!user[0] || !user[0].pinHash) {
      return { success: false, message: "Invalid phone number or PIN." };
    }

    const isValidPin = await this.verifyHash(pin, user[0].pinHash);
    if (!isValidPin) {
      return { success: false, message: "Invalid phone number or PIN." };
    }

    // Generate new session token
    const sessionToken = this.generateSessionToken();
    const sessionExpiresAt = keepLoggedIn 
      ? new Date(Date.now() + (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000))
      : null;

    const updatedUser = await db.update(users)
      .set({ 
        sessionToken,
        sessionExpiresAt,
        keepLoggedIn,
        lastLoginAt: new Date()
      })
      .where(eq(users.id, user[0].id))
      .returning();

    return {
      success: true,
      message: "Login successful.",
      user: updatedUser[0],
      sessionToken,
      requiresProfileComplete: !updatedUser[0].isProfileComplete
    };
  }

  // Verify session token
  async verifySession(sessionToken: string): Promise<AuthResult> {
    if (!sessionToken) {
      return { success: false, message: "No session token provided." };
    }

    const now = new Date();
    const user = await db.select()
      .from(users)
      .where(eq(users.sessionToken, sessionToken))
      .limit(1);

    if (!user[0]) {
      return { success: false, message: "Invalid session." };
    }

    // Check session expiry for keep-logged-in users
    if (user[0].keepLoggedIn && user[0].sessionExpiresAt && user[0].sessionExpiresAt < now) {
      // Clear expired session
      await db.update(users)
        .set({ sessionToken: null, sessionExpiresAt: null, keepLoggedIn: false })
        .where(eq(users.id, user[0].id));
      
      return { success: false, message: "Session expired." };
    }

    return {
      success: true,
      user: user[0]
    };
  }

  // Logout and invalidate session
  async logout(sessionToken: string): Promise<AuthResult> {
    if (!sessionToken) {
      return { success: true, message: "Already logged out." };
    }

    await db.update(users)
      .set({ sessionToken: null, sessionExpiresAt: null, keepLoggedIn: false })
      .where(eq(users.sessionToken, sessionToken));

    return { success: true, message: "Logged out successfully." };
  }

  // Reset PIN (requires OTP verification first)
  async resetPIN(phone: string, newPin: string, keepLoggedIn: boolean = false): Promise<AuthResult> {
    if (!/^\d{4,6}$/.test(newPin)) {
      return { success: false, message: "PIN must be 4-6 digits." };
    }

    // This should only be called after successful OTP verification for pin_reset
    const user = await db.select()
      .from(users)
      .where(and(
        eq(users.phone, phone),
        eq(users.isPhoneVerified, true)
      ))
      .limit(1);

    if (!user[0]) {
      return { success: false, message: "User not found." };
    }

    const pinHash = await this.hashData(newPin);
    const sessionToken = this.generateSessionToken();
    const sessionExpiresAt = keepLoggedIn 
      ? new Date(Date.now() + (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000))
      : null;

    const updatedUser = await db.update(users)
      .set({ 
        pinHash,
        sessionToken,
        sessionExpiresAt,
        keepLoggedIn,
        lastLoginAt: new Date()
      })
      .where(eq(users.id, user[0].id))
      .returning();

    return {
      success: true,
      message: "PIN reset successfully.",
      user: updatedUser[0],
      sessionToken
    };
  }
}

export const pinAuth = new PinAuthService();