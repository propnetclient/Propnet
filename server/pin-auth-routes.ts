import { Router } from 'express';
import { z } from 'zod';
import { pinAuth } from './pin-auth';
import './session-types';

const router = Router();

// Validation schemas
const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
});

const otpVerificationSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  purpose: z.enum(['verification', 'pin_reset'])
});

const pinSetupSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
  keepLoggedIn: z.boolean().optional().default(false)
});

const pinLoginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
  keepLoggedIn: z.boolean().optional().default(false)
});

// Check if phone needs verification (used by frontend to show appropriate flow)
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = phoneSchema.parse(req.body);
    
    const needsVerification = await pinAuth.needsPhoneVerification(phone);
    
    res.json({ 
      needsVerification,
      message: needsVerification ? "Phone verification required" : "Phone already verified"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Send OTP for phone verification or PIN reset
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'verification' } = req.body;
    
    const validation = z.object({
      phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
      purpose: z.enum(['verification', 'pin_reset']).default('verification')
    }).parse({ phone, purpose });

    const result = await pinAuth.sendOTP(validation.phone, validation.purpose);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Verify OTP and complete phone verification
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, purpose } = otpVerificationSchema.parse(req.body);
    
    const result = await pinAuth.verifyOTP(phone, otp, purpose);
    
    if (result.success) {
      // Set session in request for immediate login after verification
      if (result.user && result.sessionToken) {
        req.session.userId = result.user.id;
        req.session.sessionToken = result.sessionToken;
      }
      
      res.json({
        message: result.message,
        user: result.user,
        requiresPinSetup: result.requiresPinSetup,
        requiresProfileComplete: result.requiresProfileComplete
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid verification data" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Set up PIN after phone verification
router.post('/setup-pin', async (req, res) => {
  try {
    const { phone, pin, keepLoggedIn } = pinSetupSchema.parse(req.body);
    
    const result = await pinAuth.setPIN(phone, pin, keepLoggedIn);
    
    if (result.success) {
      // Update session with session token
      if (result.sessionToken) {
        req.session.userId = result.user.id;
        req.session.sessionToken = result.sessionToken;
      }
      
      res.json({
        message: result.message,
        user: result.user,
        requiresProfileComplete: result.requiresProfileComplete
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid PIN data" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Login with PIN
router.post('/login-pin', async (req, res) => {
  try {
    const { phone, pin, keepLoggedIn } = pinLoginSchema.parse(req.body);
    
    const result = await pinAuth.loginWithPIN(phone, pin, keepLoggedIn);
    
    if (result.success) {
      // Set session
      if (result.sessionToken) {
        req.session.userId = result.user.id;
        req.session.sessionToken = result.sessionToken;
      }
      
      res.json({
        message: result.message,
        user: result.user,
        requiresProfileComplete: result.requiresProfileComplete
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid login data" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Reset PIN (after OTP verification)
router.post('/reset-pin', async (req, res) => {
  try {
    const { phone, newPin, keepLoggedIn } = z.object({
      phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
      newPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
      keepLoggedIn: z.boolean().optional().default(false)
    }).parse(req.body);
    
    const result = await pinAuth.resetPIN(phone, newPin, keepLoggedIn);
    
    if (result.success) {
      // Set session
      if (result.sessionToken) {
        req.session.userId = result.user.id;
        req.session.sessionToken = result.sessionToken;
      }
      
      res.json({
        message: result.message,
        user: result.user
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid reset data" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.session.sessionToken;
    
    if (sessionToken) {
      await pinAuth.logout(sessionToken);
    }
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Verify current session (used by middleware)
router.get('/verify-session', async (req, res) => {
  try {
    const sessionToken = req.session.sessionToken;
    
    if (!sessionToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const result = await pinAuth.verifySession(sessionToken);
    
    if (result.success) {
      res.json({ user: result.user });
    } else {
      // Clear invalid session
      req.session.destroy(() => {});
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export { router as pinAuthRoutes };