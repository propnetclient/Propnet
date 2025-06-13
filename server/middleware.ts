import { Request, Response, NextFunction } from "express";
import { requireAuth } from "./auth";
import { logger } from "./logger";

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Authentication middleware
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const auth = requireAuth(req);
  
  if (!auth.success) {
    return res.status(401).json({ message: auth.message });
  }
  
  (req as any).userId = auth.userId;
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Remove potential XSS patterns
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+\s*=/gi, '');
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    
    req.body = sanitize(req.body);
  }
  
  next();
};

// File upload security middleware
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  if (files) {
    for (const fieldname in files) {
      for (const file of files[fieldname]) {
        // Check file size
        if (file.size > 10 * 1024 * 1024) {
          return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'text/csv', 'application/vnd.ms-excel'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ message: "Invalid file type. Only images and CSV files are allowed." });
        }
        
        // Log file upload for security monitoring
        logger.security(`File uploaded: ${file.originalname} (${file.mimetype}) by user ${(req as any).userId || 'anonymous'}`);
      }
    }
  }
  
  next();
};

// Rate limiting for API endpoints
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let bucket = rateLimitStore.get(key);
    
    if (!bucket || bucket.resetTime < windowStart) {
      bucket = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, bucket);
    }
    
    bucket.count++;
    
    if (bucket.count > maxRequests) {
      logger.security(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      return res.status(429).json({ 
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((bucket.resetTime - now) / 1000)
      });
    }
    
    next();
  };
};