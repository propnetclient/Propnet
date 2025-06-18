import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from './db';
import { adminUsers, adminSessions } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';

const ADMIN_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const SALT_ROUNDS = 12;

interface AdminAuthResult {
  success: boolean;
  message?: string;
  admin?: any;
  sessionToken?: string;
  requiresDeviceApproval?: boolean;
}

export class AdminAuthService {
  // Generate device fingerprint from headers and IP
  private generateDeviceFingerprint(req: any): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}:${acceptLanguage}:${ip}`)
      .digest('hex');
    
    return fingerprint;
  }

  // Generate secure session token
  private generateSessionToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Hash password securely
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Validate password strength
  private validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 12) {
      return { valid: false, message: "Password must be at least 12 characters long" };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    
    if (!/\d/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    
    return { valid: true };
  }

  // Create admin user (should only be done during setup)
  async createAdmin(username: string, password: string, email: string): Promise<AdminAuthResult> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.message };
      }

      // Check if admin already exists
      const existingAdmin = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);

      if (existingAdmin.length > 0) {
        return { success: false, message: "Admin user already exists" };
      }

      // Hash password and create admin
      const passwordHash = await this.hashPassword(password);
      const [admin] = await db.insert(adminUsers)
        .values({
          username,
          email,
          passwordHash,
          isActive: true
        })
        .returning();

      return { success: true, message: "Admin user created successfully", admin };
    } catch (error) {
      console.error('Admin creation error:', error);
      return { success: false, message: "Failed to create admin user" };
    }
  }

  // Admin login
  async loginAdmin(username: string, password: string, req: any): Promise<AdminAuthResult> {
    try {
      // Find admin user
      const [admin] = await db.select()
        .from(adminUsers)
        .where(and(
          eq(adminUsers.username, username),
          eq(adminUsers.isActive, true)
        ))
        .limit(1);

      if (!admin) {
        return { success: false, message: "Invalid credentials" };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, admin.passwordHash);
      if (!isValidPassword) {
        return { success: false, message: "Invalid credentials" };
      }

      // Generate device fingerprint
      const deviceFingerprint = this.generateDeviceFingerprint(req);

      // Check if device is approved
      const isDeviceApproved = admin.approvedDevices?.includes(deviceFingerprint) || false;

      if (!isDeviceApproved && admin.approvedDevices && admin.approvedDevices.length > 0) {
        return { 
          success: false, 
          message: "Device not approved. Please contact system administrator.",
          requiresDeviceApproval: true 
        };
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION);

      await db.insert(adminSessions)
        .values({
          adminId: admin.id,
          sessionToken,
          deviceFingerprint,
          expiresAt,
          isActive: true
        });

      // Update admin's approved devices if this is first login
      if (!admin.approvedDevices || admin.approvedDevices.length === 0) {
        await db.update(adminUsers)
          .set({
            approvedDevices: [deviceFingerprint],
            lastLoginAt: new Date()
          })
          .where(eq(adminUsers.id, admin.id));
      } else if (!admin.approvedDevices.includes(deviceFingerprint)) {
        await db.update(adminUsers)
          .set({
            approvedDevices: [...admin.approvedDevices, deviceFingerprint],
            lastLoginAt: new Date()
          })
          .where(eq(adminUsers.id, admin.id));
      } else {
        await db.update(adminUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsers.id, admin.id));
      }

      return {
        success: true,
        message: "Login successful",
        admin: { id: admin.id, username: admin.username, email: admin.email },
        sessionToken
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, message: "Login failed" };
    }
  }

  // Verify admin session
  async verifyAdminSession(sessionToken: string, req: any): Promise<AdminAuthResult> {
    try {
      if (!sessionToken) {
        return { success: false, message: "No session token provided" };
      }

      // Find active session
      const [session] = await db.select({
        session: adminSessions,
        admin: adminUsers
      })
        .from(adminSessions)
        .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
        .where(and(
          eq(adminSessions.sessionToken, sessionToken),
          eq(adminSessions.isActive, true),
          gt(adminSessions.expiresAt, new Date()),
          eq(adminUsers.isActive, true)
        ))
        .limit(1);

      if (!session) {
        return { success: false, message: "Invalid or expired session" };
      }

      // Verify device fingerprint
      const currentDeviceFingerprint = this.generateDeviceFingerprint(req);
      if (session.session.deviceFingerprint !== currentDeviceFingerprint) {
        // Invalidate session for security
        await db.update(adminSessions)
          .set({ isActive: false })
          .where(eq(adminSessions.sessionToken, sessionToken));

        return { success: false, message: "Device fingerprint mismatch" };
      }

      return {
        success: true,
        admin: {
          id: session.admin.id,
          username: session.admin.username,
          email: session.admin.email
        }
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return { success: false, message: "Session verification failed" };
    }
  }

  // Admin logout
  async logoutAdmin(sessionToken: string): Promise<AdminAuthResult> {
    try {
      await db.update(adminSessions)
        .set({ isActive: false })
        .where(eq(adminSessions.sessionToken, sessionToken));

      return { success: true, message: "Logout successful" };
    } catch (error) {
      console.error('Admin logout error:', error);
      return { success: false, message: "Logout failed" };
    }
  }

  // Change admin password
  async changeAdminPassword(adminId: number, currentPassword: string, newPassword: string): Promise<AdminAuthResult> {
    try {
      // Validate new password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.message };
      }

      // Get admin
      const [admin] = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .limit(1);

      if (!admin) {
        return { success: false, message: "Admin not found" };
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, admin.passwordHash);
      if (!isValidPassword) {
        return { success: false, message: "Current password is incorrect" };
      }

      // Hash new password and update
      const newPasswordHash = await this.hashPassword(newPassword);
      await db.update(adminUsers)
        .set({ passwordHash: newPasswordHash })
        .where(eq(adminUsers.id, adminId));

      // Invalidate all existing sessions for security
      await db.update(adminSessions)
        .set({ isActive: false })
        .where(eq(adminSessions.adminId, adminId));

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: "Failed to change password" };
    }
  }
}

export const adminAuth = new AdminAuthService();