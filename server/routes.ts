import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertCoListingRequestSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ phone: z.string() }).parse(req.body);
      
      // In production, integrate with SMS service like Twilio
      // For now, we'll simulate OTP sending
      console.log(`OTP for ${phone}: 123456`);
      
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid phone number" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = z.object({ 
        phone: z.string(), 
        otp: z.string() 
      }).parse(req.body);
      
      // In production, verify OTP with SMS service
      // For now, accept any 6-digit OTP
      if (otp.length !== 6) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        user = await storage.createUser({ phone });
      }

      // Set session
      (req as any).session.userId = user.id;
      
      res.json({ 
        success: true, 
        user,
        isKycComplete: user.isKycComplete 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid OTP" });
    }
  });

  app.post("/api/auth/complete-kyc", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const kycData = insertUserSchema.pick({
        name: true,
        reraId: true,
        agencyName: true,
        city: true,
      }).parse(req.body);

      const user = await storage.updateUser(userId, {
        ...kycData,
        isKycComplete: true,
        isVerified: true, // Auto-verify for MVP
      });

      res.json({ success: true, user });
    } catch (error) {
      res.status(400).json({ message: "Invalid KYC data" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy();
    res.json({ success: true });
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", upload.array('photos', 10), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const propertyData = insertPropertySchema.parse(JSON.parse(req.body.data));
      
      // Handle uploaded files
      const photos = (req.files as Express.Multer.File[])?.map(file => file.filename) || [];

      const property = await storage.createProperty({
        ...propertyData,
        ownerId: userId,
        photos,
      });

      res.json({ success: true, property });
    } catch (error) {
      console.error('Property creation error:', error);
      res.status(400).json({ message: "Failed to create property" });
    }
  });

  app.get("/api/my-properties", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const properties = await storage.getUserProperties(userId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Co-listing routes
  app.get("/api/colisting-requests", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const requests = await storage.getCoListingRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/colisting-requests", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const requestData = insertCoListingRequestSchema.parse({
        ...req.body,
        requesterId: userId,
      });

      const request = await storage.createCoListingRequest(requestData);
      res.json({ success: true, request });
    } catch (error) {
      res.status(400).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/colisting-requests/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const { status } = z.object({ status: z.enum(["approved", "declined"]) }).parse(req.body);

      const request = await storage.updateCoListingRequestStatus(id, status);

      // If approved, create co-listing
      if (status === "approved") {
        await storage.createCoListing(request.propertyId, request.requesterId);
      }

      res.json({ success: true, request });
    } catch (error) {
      res.status(400).json({ message: "Failed to update request" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
