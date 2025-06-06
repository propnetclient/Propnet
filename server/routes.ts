import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertCoListingRequestSchema, insertPropertyRequirementSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isImage = file.mimetype.startsWith('image/');
    const isCsv = file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';
    
    if (isImage || (isCsv && extname)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and CSV files are allowed'));
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
      console.log("Raw request body:", req.body);
      
      const phone = req.body.phone;
      const otp = req.body.otp;
      
      if (!phone || !otp) {
        console.log("Missing phone or OTP");
        return res.status(400).json({ message: "Phone and OTP required" });
      }
      
      console.log(`Verifying OTP for ${phone}: received "${otp}", expected "123456"`);
      console.log(`OTP type: ${typeof otp}, length: ${otp.length}`);
      
      // In production, verify OTP with SMS service
      // For MVP, accept the fixed OTP 123456
      if (String(otp).trim() !== "123456") {
        console.log(`OTP verification failed: "${String(otp).trim()}" !== "123456"`);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      console.log("OTP verification successful, proceeding...");

      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        user = await storage.createUser({ phone });
        console.log("Created new user:", user);
      }

      // Set session
      (req as any).session.userId = user.id;
      console.log("Session set for user ID:", user.id);
      
      res.json({ 
        success: true, 
        user,
        isKycComplete: user.isKycComplete 
      });
    } catch (error) {
      console.error("OTP verification error:", error);
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

  app.post("/api/properties", upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'agreementDocument', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Debug: Log the incoming request body
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      // Parse form data from multipart upload
      let propertyData = req.body;

      // Parse scope of work if it's a JSON string
      if (propertyData.scopeOfWork && typeof propertyData.scopeOfWork === 'string') {
        try {
          propertyData.scopeOfWork = JSON.parse(propertyData.scopeOfWork);
        } catch (e) {
          propertyData.scopeOfWork = [];
        }
      }

      // Clean up empty strings and convert data types
      Object.keys(propertyData).forEach(key => {
        if (propertyData[key] === '') {
          delete propertyData[key];
        }
      });

      // Convert string values to proper types
      if (propertyData.bhk) {
        propertyData.bhk = parseInt(propertyData.bhk);
      }
      
      if (propertyData.isActive) {
        propertyData.isActive = propertyData.isActive === 'true';
      }

      console.log("Processed property data:", propertyData);

      // Validate the parsed data with detailed error logging
      try {
        propertyData = insertPropertySchema.parse(propertyData);
      } catch (parseError: any) {
        console.error("Validation error details:", parseError.errors);
        const missingFields = parseError.errors.map((err: any) => err.path.join('.')).join(', ');
        return res.status(400).json({ 
          message: "Invalid property data", 
          details: `Missing required fields: ${missingFields}`,
          errors: parseError.errors
        });
      }
      
      const photos: string[] = [];
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files && files.photos) {
        for (const file of files.photos) {
          photos.push(file.filename);
        }
      }

      let agreementDocument: string | undefined = undefined;
      if (files && files.agreementDocument && files.agreementDocument[0]) {
        agreementDocument = files.agreementDocument[0].filename;
      }

      // Generate consent ID for owner approval
      const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const property = await storage.createProperty({
        ...propertyData,
        ownerId: userId,
        photos,
        agreementDocument,
        consentId,
        ownerApprovalStatus: 'pending'
      });

      // Check for duplicate properties before creating
      const duplicates = await storage.checkDuplicateProperty(propertyData);
      
      if (duplicates.length > 0) {
        return res.json({
          success: false,
          duplicatesFound: true,
          duplicates: duplicates.map(dup => ({
            id: dup.id,
            title: dup.title,
            location: dup.location,
            price: dup.price,
            ownerName: dup.ownerName // This would be masked in real implementation
          })),
          message: "Similar properties found. Please review before proceeding."
        });
      }

      // In a real implementation, you would send SMS/WhatsApp to owner here
      console.log(`Owner approval request sent for property ${property.id} to ${propertyData.ownerPhone}`);
      console.log(`Consent ID: ${consentId}`);
      console.log(`Consent URL: ${process.env.BASE_URL || 'http://localhost:5000'}/consent/${consentId}`);
      
      res.json({ 
        success: true, 
        property,
        consentUrl: `/consent/${consentId}`,
        message: "Property listing created. Owner approval request sent."
      });
    } catch (error) {
      console.error("Property creation error:", error);
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

  // Profile update route
  app.post("/api/profile/update", upload.single('agencyLogo'), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updates: any = { ...req.body };
      
      if (req.file) {
        updates.agencyLogo = req.file.filename;
      }

      const user = await storage.updateUserProfile(userId, updates);
      res.json({ user, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Bulk property upload route
  app.post("/api/properties/bulk-upload", upload.single('file'), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = fs.readFileSync(req.file.path, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < headers.length) continue;
        
        try {
          const propertyData: any = {};
          headers.forEach((header, index) => {
            propertyData[header] = values[index];
          });

          // Convert bhk to number if present
          if (propertyData.bhk) {
            propertyData.bhk = parseInt(propertyData.bhk) || 0;
          }

          const validatedData = insertPropertySchema.parse(propertyData);

          await storage.createProperty({
            ...validatedData,
            ownerId: userId
          });
          successful++;
        } catch (error: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        total: lines.length - 1,
        successful,
        failed,
        errors: errors.slice(0, 10) // Limit to first 10 errors
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  // Property requirements routes
  app.get("/api/property-requirements", async (req, res) => {
    try {
      const requirements = await storage.getPropertyRequirements();
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  app.get("/api/my-requirements", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const requirements = await storage.getUserRequirements(userId);
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  app.post("/api/property-requirements", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const requirementData = insertPropertyRequirementSchema.parse(req.body);
      const requirement = await storage.createPropertyRequirement({
        ...requirementData,
        userId,
      });

      res.json({ success: true, requirement });
    } catch (error) {
      console.error("Create requirement error:", error);
      res.status(400).json({ message: "Failed to create requirement" });
    }
  });

  app.patch("/api/property-requirements/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const updates = insertPropertyRequirementSchema.partial().parse(req.body);
      
      const requirement = await storage.updatePropertyRequirement(id, updates);
      res.json({ success: true, requirement });
    } catch (error) {
      res.status(400).json({ message: "Failed to update requirement" });
    }
  });

  app.delete("/api/property-requirements/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePropertyRequirement(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete requirement" });
    }
  });

  // Owner consent routes
  app.get("/api/consent/:consentId", async (req, res) => {
    try {
      const consentId = req.params.consentId;
      const consentData = await storage.getConsentData(consentId);
      
      if (!consentData) {
        return res.status(404).json({ message: "Consent not found" });
      }

      res.json(consentData);
    } catch (error) {
      console.error("Consent fetch error:", error);
      res.status(500).json({ message: "Failed to fetch consent data" });
    }
  });

  app.post("/api/consent/:consentId/:action", async (req, res) => {
    try {
      const { consentId, action } = req.params;
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      const property = await storage.updatePropertyApproval(consentId, action === 'approve' ? 'approved' : 'rejected');
      
      res.json({ 
        success: true, 
        action,
        property,
        message: action === 'approve' ? "Property listing approved" : "Property listing rejected"
      });
    } catch (error) {
      console.error("Consent action error:", error);
      res.status(500).json({ message: "Failed to process consent action" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
