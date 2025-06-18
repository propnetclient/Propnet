import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminAuth } from './admin-auth';
import { storage } from './storage';

const router = Router();

// Validation schemas
const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const adminCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  email: z.string().email("Valid email is required")
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(12, "New password must be at least 12 characters")
});

// Admin authentication middleware
export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.adminSessionToken;

    if (!sessionToken) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const authResult = await adminAuth.verifyAdminSession(sessionToken, req);
    if (!authResult.success) {
      return res.status(401).json({ message: authResult.message || "Invalid admin session" });
    }

    // Add admin info to request
    (req as any).admin = authResult.admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Admin login route
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login request received:', req.body);
    const { username, password } = adminLoginSchema.parse(req.body);
    console.log('Parsed credentials - username:', username, 'password length:', password.length);
    
    const result = await adminAuth.loginAdmin(username, password, req);
    
    if (result.success && result.sessionToken) {
      // Set secure HTTP-only cookie
      res.cookie('adminSessionToken', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });
      
      res.json({
        success: true,
        message: result.message,
        admin: result.admin
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        requiresDeviceApproval: result.requiresDeviceApproval
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    console.error('Admin login error:', error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Admin logout route
router.post('/logout', requireAdminAuth, async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.adminSessionToken;

    if (sessionToken) {
      await adminAuth.logoutAdmin(sessionToken);
    }

    res.clearCookie('adminSessionToken');
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ message: "Logout failed" });
  }
});

// Get current admin info
router.get('/me', requireAdminAuth, (req, res) => {
  res.json({ admin: (req as any).admin });
});

// Change admin password
router.post('/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
    const admin = (req as any).admin;

    const result = await adminAuth.changeAdminPassword(admin.id, currentPassword, newPassword);
    
    if (result.success) {
      // Clear session cookie to force re-login
      res.clearCookie('adminSessionToken');
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    console.error('Password change error:', error);
    res.status(500).json({ message: "Password change failed" });
  }
});

// Get beta signups (admin only)
router.get('/beta-signups', requireAdminAuth, async (req, res) => {
  try {
    const signups = await storage.getAllBetaSignups();
    res.json(signups);
  } catch (error) {
    console.error('Error fetching beta signups:', error);
    res.status(500).json({ message: "Failed to fetch beta signups" });
  }
});

// Update beta signup status (admin only)
router.put('/beta-signups/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedSignup = await storage.updateBetaSignupStatus(id, status, notes);
    res.json(updatedSignup);
  } catch (error) {
    console.error('Error updating beta signup:', error);
    res.status(500).json({ message: "Failed to update beta signup" });
  }
});

// Admin setup route (only works if no admin exists)
router.post('/setup', async (req, res) => {
  try {
    const { username, password, email } = adminCreateSchema.parse(req.body);
    
    const result = await adminAuth.createAdmin(username, password, email);
    
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    console.error('Admin setup error:', error);
    res.status(500).json({ message: "Setup failed" });
  }
});

export { router as adminRoutes };