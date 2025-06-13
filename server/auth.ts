import { Request } from "express";

// Rate limiting store (in production, use Redis)
const otpAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(phone: string, otp: string): void {
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
  otpStore.set(phone, { otp, expiresAt, attempts: 0 });
}

export function validateOTP(phone: string, providedOtp: string): { success: boolean; message?: string } {
  const stored = otpStore.get(phone);
  
  if (!stored) {
    return { success: false, message: "OTP not found or expired" };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return { success: false, message: "OTP expired" };
  }
  
  stored.attempts++;
  
  if (stored.attempts > 3) {
    otpStore.delete(phone);
    return { success: false, message: "Too many invalid attempts" };
  }
  
  if (stored.otp !== providedOtp.trim()) {
    return { success: false, message: "Invalid OTP" };
  }
  
  // Success - cleanup
  otpStore.delete(phone);
  return { success: true };
}

export function checkRateLimit(phone: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempts = otpAttempts.get(phone);
  
  if (!attempts) {
    otpAttempts.set(phone, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  // Check if still blocked
  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    const remainingTime = Math.ceil((attempts.blockedUntil - now) / 1000 / 60);
    return { allowed: false, message: `Too many requests. Try again in ${remainingTime} minutes.` };
  }
  
  // Reset if last attempt was more than 1 hour ago
  if (now - attempts.lastAttempt > 60 * 60 * 1000) {
    otpAttempts.set(phone, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  
  // Block after 5 attempts in 1 hour
  if (attempts.count > 5) {
    attempts.blockedUntil = now + (15 * 60 * 1000); // Block for 15 minutes
    return { allowed: false, message: "Too many requests. Try again in 15 minutes." };
  }
  
  return { allowed: true };
}

export function isAuthenticated(req: Request): boolean {
  return !!(req.session as any)?.userId;
}

export function requireAuth(req: Request): { success: boolean; userId?: number; message?: string } {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return { success: false, message: "Authentication required" };
  }
  
  return { success: true, userId };
}