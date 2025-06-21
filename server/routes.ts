import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertCoListingRequestSchema, insertPropertyRequirementSchema, insertConversationSchema, insertMessageSchema, insertBetaSignupSchema, insertSuggestionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { extractPropertiesFromText, enhancePropertyDescription } from "./gemini";
import { generateOTP, storeOTP, validateOTP, checkRateLimit, requireAuth } from "./auth";
import { registerAnalyticsRoutes } from "./analytics-routes";
import { pinAuthRoutes } from "./pin-auth-routes";
import { adminRoutes } from "./admin-routes";
import { cache } from "./cache";
import { sendSMS } from "./sms";
import { config } from "./config";

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
  // Register PIN-based authentication routes
  app.use("/api/pin-auth", pinAuthRoutes);

  // Register secure admin routes with obscured path
  app.use("/api/secure-portal", adminRoutes);

  // Beta signup route for landing page
  app.post("/api/beta-signup", async (req, res) => {
    try {
      const validatedData = insertBetaSignupSchema.parse(req.body);
      
      // Check if already signed up
      const existingSignup = await storage.getBetaSignupByPhone(validatedData.phone);
      if (existingSignup) {
        return res.status(400).json({ 
          message: "Phone number already registered for beta access" 
        });
      }
      
      const signup = await storage.createBetaSignup(validatedData);
      res.json({ message: "Beta signup successful", id: signup.id });
    } catch (error: any) {
      console.error("Beta signup error:", error);
      res.status(400).json({ message: error.message || "Failed to submit beta signup" });
    }
  });

  // Suggestion route for landing page
  app.post("/api/suggestions", async (req, res) => {
    try {
      const validatedData = insertSuggestionSchema.parse(req.body);
      const suggestion = await storage.createSuggestion(validatedData);
      res.json({ message: "Suggestion submitted successfully", id: suggestion.id });
    } catch (error: any) {
      console.error("Suggestion error:", error);
      res.status(400).json({ message: error.message || "Failed to submit suggestion" });
    }
  });

  // Simple login route for approved beta users
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone } = z.object({
        phone: z.string().min(10, "Valid phone number required")
      }).parse(req.body);

      const user = await storage.authenticateUser(phone);
      if (!user) {
        return res.status(401).json({ 
          message: "Phone number not approved for beta access" 
        });
      }

      // Store user session with iOS compatibility
      (req.session as any).userId = user.id;
      (req.session as any).user = user;
      
      // Set iOS-compatible headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json({ user, message: "Login successful" });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Get current user for authentication check
  app.get("/api/auth/me", async (req, res) => {
    try {
      // Set iOS-compatible headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error: any) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Admin routes for beta signup management
  app.get("/api/admin/beta-signups", async (req, res) => {
    try {
      const signups = await storage.getAllBetaSignups();
      res.json(signups);
    } catch (error: any) {
      console.error("Admin signups fetch error:", error);
      res.status(500).json({ message: "Failed to fetch beta signups" });
    }
  });

  app.patch("/api/admin/beta-signups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
        notes: z.string().optional()
      }).parse(req.body);

      const updated = await storage.updateBetaSignupStatus(parseInt(id), status, notes);
      res.json(updated);
    } catch (error: any) {
      console.error("Admin status update error:", error);
      res.status(400).json({ message: error.message || "Failed to update status" });
    }
  });



  // Auth routes with rate limiting and security
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ 
        phone: z.string().min(10, "Phone number required") 
      }).parse(req.body);
      
      // Normalize phone number
      const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
      
      // Check rate limiting
      const rateCheck = checkRateLimit(phone);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }
      
      // Generate and store secure OTP
      const otp = generateOTP();
      storeOTP(normalizedPhone, otp);
      
      // Send SMS using Twilio credentials
      const smsMessage = `Your PropNet verification code is: ${otp}. Valid for 5 minutes.`;
      const smsSuccess = await sendSMS(normalizedPhone, smsMessage);
      
      // Always log OTP for trial account limitations
      console.log(`OTP for ${normalizedPhone}: ${otp} (Trial Account Fallback)`);
      
      // Development fallback only if SMS fails
      if (!smsSuccess && process.env.NODE_ENV !== 'production') {
        console.log(`SMS Delivery Failed - Development OTP for ${phone}: ${otp}`);
      }
      
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid phone number format" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = z.object({
        phone: z.string(),
        otp: z.string().length(6)
      }).parse(req.body);
      
      // Validate OTP using secure validation
      const validation = validateOTP(phone, otp);
      if (!validation.success) {
        return res.status(400).json({ message: validation.message });
      }

      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        user = await storage.createUser({ phone });
      }

      (req.session as any).userId = user.id;
      
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

  app.post("/api/auth/complete-profile", upload.single('profilePhoto'), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const profileData: any = { ...req.body };
      
      // Parse array fields that come as JSON strings
      if (profileData.areaOfExpertise) {
        profileData.areaOfExpertise = JSON.parse(profileData.areaOfExpertise);
      }
      if (profileData.workingRegions) {
        profileData.workingRegions = JSON.parse(profileData.workingRegions);
      }

      // Handle profile photo upload
      if (req.file) {
        profileData.profilePhoto = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await storage.completeUserProfile(userId, profileData);
      
      // Update session with latest user data for iOS compatibility
      (req.session as any).user = updatedUser;
      
      // Set iOS-compatible headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json({ user: updatedUser, message: "Profile completed successfully" });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ message: "Profile completion failed" });
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
      
      if (propertyData.isPubliclyVisible !== undefined) {
        propertyData.isPubliclyVisible = propertyData.isPubliclyVisible === 'true';
      }

      console.log("Processed property data:", propertyData);

      // Validate the parsed data with detailed error logging
      try {
        propertyData = insertPropertySchema.parse(propertyData);
      } catch (parseError: any) {
        console.error("Validation error details:", parseError.errors);
        
        // Create user-friendly error messages
        const fieldErrors = parseError.errors.map((err: any) => {
          const field = err.path.join('.');
          const fieldName = field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str: string) => str.toUpperCase());
          
          if (err.code === 'invalid_type') {
            return `${fieldName}: Expected ${err.expected}, received ${err.received}`;
          }
          return `${fieldName}: ${err.message}`;
        });
        
        return res.status(400).json({ 
          message: "Please check the following fields:", 
          details: fieldErrors.join('; '),
          fieldErrors: fieldErrors,
          validationErrors: parseError.errors
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

      // Send SMS notification to property owner for consent
      if (propertyData.ownerPhone && (propertyData.listingType === 'exclusive' || propertyData.listingType === 'colisting')) {
        const user = await storage.getUser(userId);
        const agentName = user?.name || 'Real Estate Agent';
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const consentUrl = `${baseUrl}/owner-consent/${consentId}`;
        
        // Customized message based on listing type
        let consentMessage = '';
        if (propertyData.listingType === 'exclusive') {
          consentMessage = `${agentName} requests EXCLUSIVE marketing rights for "${propertyData.title}". This grants sole representation with professional marketing & promotion. Review terms: ${consentUrl}`;
        } else {
          consentMessage = `${agentName} requests CO-LISTING rights for "${propertyData.title}". This allows collaborative marketing with other verified agents. Review partnership: ${consentUrl}`;
        }
        
        try {
          await sendSMS(propertyData.ownerPhone, consentMessage);
          console.log(`Owner consent SMS sent to ${propertyData.ownerPhone} for ${propertyData.listingType} property: ${propertyData.title}`);
        } catch (smsError) {
          console.warn('Failed to send owner consent SMS:', smsError);
          // Property is still created even if SMS fails
        }
      }

      // Invalidate cache after property creation
      cache.invalidatePattern('properties');
      cache.invalidatePattern(`user-${userId}-properties`);

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
      // Property created with consent ID: ${consentId}
      
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

  // Update property route
  app.put("/api/properties/:id", upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'agreementDocument', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const propertyId = parseInt(req.params.id);
      
      // Check if property exists and belongs to user
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty || existingProperty.ownerId !== userId) {
        return res.status(404).json({ message: "Property not found or access denied" });
      }

      let propertyData = { ...req.body };

      // Parse scopeOfWork if it exists
      if (propertyData.scopeOfWork && typeof propertyData.scopeOfWork === 'string') {
        try {
          propertyData.scopeOfWork = JSON.parse(propertyData.scopeOfWork);
        } catch (e) {
          propertyData.scopeOfWork = [];
        }
      }

      // Remove empty fields
      Object.keys(propertyData).forEach(key => {
        if (propertyData[key] === '' || propertyData[key] === null || propertyData[key] === undefined) {
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

      // Handle new file uploads if any
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files && files.photos) {
        const newPhotos: string[] = [];
        for (const file of files.photos) {
          newPhotos.push(file.filename);
        }
        propertyData.photos = [...(existingProperty.photos || []), ...newPhotos];
      }

      if (files && files.agreementDocument && files.agreementDocument[0]) {
        propertyData.agreementDocument = files.agreementDocument[0].filename;
      }

      const updatedProperty = await storage.updateProperty(propertyId, propertyData);
      
      res.json({ 
        success: true, 
        property: updatedProperty,
        message: "Property updated successfully"
      });
    } catch (error) {
      console.error("Property update error:", error);
      res.status(400).json({ message: "Failed to update property" });
    }
  });

  // Delete property route
  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const propertyId = parseInt(req.params.id);
      
      // Check if property exists and belongs to user
      const existingProperty = await storage.getProperty(propertyId);
      if (!existingProperty || existingProperty.ownerId !== userId) {
        return res.status(404).json({ message: "Property not found or access denied" });
      }

      // Delete property files if they exist
      if (existingProperty.photos) {
        existingProperty.photos.forEach((photo: string) => {
          const photoPath = path.join('uploads', photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        });
      }

      if (existingProperty.agreementDocument) {
        const docPath = path.join('uploads', existingProperty.agreementDocument);
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath);
        }
      }

      await storage.deleteProperty(propertyId);
      
      res.json({ 
        success: true,
        message: "Property deleted successfully"
      });
    } catch (error) {
      console.error("Property deletion error:", error);
      res.status(400).json({ message: "Failed to delete property" });
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

  // PDF generation endpoint
  app.get("/api/properties/:id/pdf", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Format price for display
      const formatPrice = (price: string) => {
        const numPrice = parseFloat(price);
        if (numPrice >= 10000000) {
          return `₹${(numPrice / 10000000).toFixed(1)} Cr`;
        } else if (numPrice >= 100000) {
          return `₹${(numPrice / 100000).toFixed(1)} L`;
        } else if (numPrice >= 1000) {
          return `₹${(numPrice / 1000).toFixed(1)} K`;
        } else {
          return `₹${numPrice.toLocaleString('en-IN')}`;
        }
      };

      // Create PDF document
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${property.title.replace(/[^a-zA-Z0-9\s]/g, '')}_listing.pdf"`);
      
      // Pipe PDF to response
      doc.pipe(res);

      // Header background with gradient effect
      doc.rect(0, 0, 595, 120)
         .fillColor('#1E40AF')
         .fill();
      
      doc.rect(0, 90, 595, 30)
         .fillColor('#3B82F6')
         .fill();

      // Agent/Broker branding section
      doc.fontSize(28)
         .fillColor('white')
         .text(property.owner.agencyName || property.owner.name || 'Real Estate Professional', 50, 30, { align: 'left' });
      
      doc.fontSize(14)
         .fillColor('#E0E7FF')
         .text(`${property.owner.agencyName ? 'Real Estate Agency' : 'Licensed Real Estate Professional'}`, 50, 65);

      // PropertyConnect attribution (smaller, right side)
      doc.fontSize(12)
         .fillColor('#93C5FD')
         .text('Powered by PropertyConnect', 400, 40);
      
      // Contact info in header
      doc.fontSize(11)
         .fillColor('white')
         .text(`📞 ${property.owner.phone}`, 400, 60);
      
      if (property.owner.email) {
        doc.text(`✉️ ${property.owner.email}`, 400, 75);
      }

      // Decorative line
      doc.moveTo(50, 120)
         .lineTo(545, 120)
         .strokeColor('#60A5FA')
         .lineWidth(3)
         .stroke();

      // Property title with elegant styling
      doc.rect(50, 140, 495, 50)
         .fillColor('#F8FAFC')
         .fill();
      
      doc.rect(50, 140, 495, 4)
         .fillColor('#3B82F6')
         .fill();

      doc.fontSize(24)
         .fillColor('#1E293B')
         .text(property.title, 60, 155, { align: 'left' });

      let yPosition = 210;

      // Featured price section
      doc.rect(50, yPosition, 495, 80)
         .fillColor('#EFF6FF')
         .fill();
      
      doc.rect(45, yPosition, 5, 80)
         .fillColor('#3B82F6')
         .fill();

      doc.fontSize(32)
         .fillColor('#1E40AF')
         .text(formatPrice(property.price), 70, yPosition + 15);
      
      if (property.transactionType === 'rent') {
        doc.fontSize(16)
           .fillColor('#64748B')
           .text(`per ${property.rentFrequency || 'month'}`, 70, yPosition + 50);
      }

      // Transaction type badge
      const badgeText = property.transactionType === 'sale' ? 'FOR SALE' : 'FOR RENT';
      const badgeColor = property.transactionType === 'sale' ? '#059669' : '#DC2626';
      
      doc.rect(400, yPosition + 20, 100, 30)
         .fillColor(badgeColor)
         .fill();
      
      doc.fontSize(12)
         .fillColor('white')
         .text(badgeText, 400, yPosition + 30, { width: 100, align: 'center' });

      yPosition += 100;

      // Property details with modern cards
      const details = [
        { label: 'Area', value: `${property.size} ${property.sizeUnit || 'sq.ft'}`, icon: '📐' },
        { label: 'Type', value: property.propertyType, icon: '🏠' },
        { label: 'Location', value: property.location, icon: '📍' }
      ];

      if (property.bhk) {
        details.splice(1, 0, { label: 'Configuration', value: `${property.bhk} BHK`, icon: '🏨' });
      }

      const cardWidth = 120;
      const cardHeight = 90;
      const cardSpacing = 15;
      const totalCardsWidth = (details.length * cardWidth) + ((details.length - 1) * cardSpacing);
      const startX = (595 - totalCardsWidth) / 2;
      
      details.forEach((detail, index) => {
        const x = startX + (index * (cardWidth + cardSpacing));
        const y = yPosition;

        // Card shadow effect
        doc.rect(x + 3, y + 3, cardWidth, cardHeight)
           .fillColor('#E2E8F0')
           .fill();

        // Main card
        doc.rect(x, y, cardWidth, cardHeight)
           .fillColor('white')
           .strokeColor('#CBD5E1')
           .lineWidth(1)
           .fillAndStroke();

        // Icon background
        doc.circle(x + cardWidth/2, y + 25, 18)
           .fillColor('#EFF6FF')
           .fill();

        // Icon
        doc.fontSize(20)
           .fillColor('#3B82F6')
           .text(detail.icon, x + cardWidth/2 - 10, y + 15);

        // Value
        doc.fontSize(12)
           .fillColor('#1E293B')
           .text(detail.value, x + 5, y + 50, { 
             width: cardWidth - 10, 
             align: 'center',
             height: 20
           });

        // Label
        doc.fontSize(9)
           .fillColor('#64748B')
           .text(detail.label.toUpperCase(), x + 5, y + 75, { 
             width: cardWidth - 10, 
             align: 'center' 
           });
      });

      yPosition += cardHeight + 40;

      // Description section if available
      if (property.description) {
        // Description header
        doc.rect(50, yPosition, 495, 40)
           .fillColor('#F1F5F9')
           .fill();
        
        doc.rect(50, yPosition, 495, 4)
           .fillColor('#3B82F6')
           .fill();

        doc.fontSize(16)
           .fillColor('#1E293B')
           .text('Property Description', 60, yPosition + 15);

        yPosition += 55;

        // Description content with elegant styling
        doc.rect(50, yPosition, 495, 5)
           .fillColor('#E2E8F0')
           .fill();
        
        yPosition += 20;

        doc.fontSize(12)
           .fillColor('#475569')
           .text(property.description, 60, yPosition, { 
             width: 475, 
             align: 'justify',
             lineGap: 5
           });

        yPosition += doc.heightOfString(property.description, { width: 475, lineGap: 5 }) + 40;
      }

      // Contact & Agency Information (Enhanced)
      const contactBoxY = yPosition;
      const contactBoxHeight = 140;

      // Professional contact section with gradient
      doc.rect(50, contactBoxY, 495, contactBoxHeight)
         .fillColor('#1E293B')
         .fill();
      
      doc.rect(50, contactBoxY, 495, 50)
         .fillColor('#334155')
         .fill();

      // Agency/Agent name prominently displayed
      doc.fontSize(20)
         .fillColor('white')
         .text(property.owner.agencyName || property.owner.name || 'Real Estate Professional', 70, contactBoxY + 15);

      doc.fontSize(12)
         .fillColor('#94A3B8')
         .text('Your Real Estate Partner', 70, contactBoxY + 40);

      // Contact details in organized layout
      const contactY = contactBoxY + 70;
      
      // Phone
      doc.circle(70, contactY + 10, 8)
         .fillColor('#3B82F6')
         .fill();
      
      doc.fontSize(10)
         .fillColor('white')
         .text('📞', 66, contactY + 6);
      
      doc.fontSize(14)
         .fillColor('white')
         .text(property.owner.phone, 90, contactY + 5);

      // Email (if available)
      if (property.owner.email) {
        doc.circle(70, contactY + 35, 8)
           .fillColor('#3B82F6')
           .fill();
        
        doc.fontSize(10)
           .fillColor('white')
           .text('✉️', 66, contactY + 31);
        
        doc.fontSize(12)
           .fillColor('#CBD5E1')
           .text(property.owner.email, 90, contactY + 30);
      }

      // Professional certification badge
      doc.rect(400, contactBoxY + 70, 120, 50)
         .fillColor('#059669')
         .fill();
      
      doc.fontSize(10)
         .fillColor('white')
         .text('VERIFIED', 400, contactBoxY + 80, { width: 120, align: 'center' });
      
      doc.fontSize(8)
         .text('REAL ESTATE', 400, contactBoxY + 95, { width: 120, align: 'center' });
      
      doc.fontSize(8)
         .text('PROFESSIONAL', 400, contactBoxY + 105, { width: 120, align: 'center' });

      yPosition += contactBoxHeight + 30;

      // Elegant footer with branding
      doc.rect(50, yPosition, 495, 2)
         .fillColor('#E2E8F0')
         .fill();

      yPosition += 20;

      // Date and platform info
      doc.fontSize(11)
         .fillColor('#64748B')
         .text(`Generated on ${new Date().toLocaleDateString('en-IN', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })} • PropertyConnect Platform`, 50, yPosition, { align: 'center' });

      doc.fontSize(9)
         .fillColor('#94A3B8')
         .text('This is an official property listing document', 50, yPosition + 20, { align: 'center' });

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // QuickPost AI extraction endpoint
  app.post("/api/quickpost/extract", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { text } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ message: "Text content is required" });
      }

      console.log("Extracting properties from text:", text.substring(0, 200) + "...");
      
      const extractedProperties = await extractPropertiesFromText(text);
      
      console.log(`Extracted ${extractedProperties.length} properties`);
      
      res.json({
        success: true,
        properties: extractedProperties,
        count: extractedProperties.length
      });
    } catch (error) {
      console.error("QuickPost extraction error:", error);
      res.status(500).json({ 
        message: "Failed to extract properties from text",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // QuickPost bulk create endpoint
  app.post("/api/quickpost/create", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { properties } = req.body;
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({ message: "Properties array is required" });
      }

      const createdProperties = [];
      const errors = [];

      for (let i = 0; i < properties.length; i++) {
        try {
          const propertyData = properties[i];
          
          // Validate required fields are present
          const missingFields = [];
          if (!propertyData.title) missingFields.push('title');
          if (!propertyData.propertyType) missingFields.push('propertyType');
          if (!propertyData.transactionType) missingFields.push('transactionType');
          if (!propertyData.price) missingFields.push('price');
          if (!propertyData.size) missingFields.push('size');
          if (!propertyData.location) missingFields.push('location');
          if (!propertyData.bhk) missingFields.push('bhk');
          if (!propertyData.flatNumber) missingFields.push('flatNumber');
          if (!propertyData.buildingSociety) missingFields.push('buildingSociety');

          // For exclusive and co-listing types, also require owner details
          const listingType = propertyData.listingType || "shared";
          if (listingType === "exclusive" || listingType === "co-listing") {
            if (!propertyData.ownerName) missingFields.push('ownerName');
            if (!propertyData.ownerPhone) missingFields.push('ownerPhone');
            if (!propertyData.commissionTerms) missingFields.push('commissionTerms');
          }

          if (missingFields.length > 0) {
            errors.push({
              index: i,
              error: `Missing required fields: ${missingFields.join(', ')}`,
              property: propertyData.title || `Property ${i + 1}`,
              missingFields
            });
            continue;
          }

          // Set only minimal default values for truly optional fields
          const processedData = {
            ...propertyData,
            sizeUnit: propertyData.sizeUnit || "sq.ft",
            fullAddress: propertyData.fullAddress || propertyData.location,
            listingType: propertyData.listingType || "shared",
            commissionTerms: propertyData.commissionTerms || "Contact for details",
            rentFrequency: propertyData.rentFrequency || (propertyData.transactionType === "rent" ? "monthly" : undefined),
            bhk: propertyData.bhk || null,
            flatNumber: propertyData.flatNumber || "",
            floorNumber: propertyData.floorNumber || "",
            buildingSociety: propertyData.buildingSociety || "",
            description: propertyData.description || "",
            ownerId: userId,
            isPubliclyVisible: propertyData.listingType !== "exclusive",
            scopeOfWork: [],
            photos: [],
            isActive: true,
            consentId: `quickpost_${Date.now()}_${i}`,
            ownerApprovalStatus: propertyData.listingType === "exclusive" ? "pending" : "approved"
          };

          const property = await storage.createProperty(processedData);
          createdProperties.push(property);
          
        } catch (propertyError) {
          console.error(`Error creating property ${i}:`, propertyError);
          errors.push({
            index: i,
            error: propertyError instanceof Error ? propertyError.message : "Creation failed",
            property: properties[i].title || `Property ${i + 1}`
          });
        }
      }

      res.json({
        success: true,
        created: createdProperties.length,
        total: properties.length,
        properties: createdProperties,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      console.error("QuickPost creation error:", error);
      res.status(500).json({ message: "Failed to create properties" });
    }
  });

  // Google Maps API key endpoint
  app.get("/api/config/google-maps-key", async (req, res) => {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ message: "Google Maps API key not configured" });
    }
    res.json({ key: GOOGLE_MAPS_API_KEY });
  });

  // Geocoding endpoint for property locations
  app.get("/api/places/geocode", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: "Address parameter is required" });
      }

      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=in&components=country:in`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        res.json({
          success: true,
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: data.results[0].formatted_address
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Location not found"
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      res.status(500).json({ message: "Failed to geocode address" });
    }
  });

  // Google Places API endpoints
  app.get("/api/places/autocomplete", async (req, res) => {
    try {
      const { input, types = "establishment,geocode" } = req.query;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ message: "Input parameter is required" });
      }

      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment&key=${GOOGLE_MAPS_API_KEY}&components=country:in&region=in&location=23.0225,72.5714&radius=50000`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        // Filter predictions to prioritize Gujarat and Indian locations
        const filteredPredictions = data.predictions.filter((prediction: any) => {
          const description = prediction.description.toLowerCase();
          const secondaryText = prediction.structured_formatting?.secondary_text?.toLowerCase() || '';
          
          // Prioritize Gujarat locations
          if (description.includes('gujarat') || secondaryText.includes('gujarat') ||
              description.includes('ahmedabad') || description.includes('surat') ||
              description.includes('vadodara') || description.includes('rajkot') ||
              description.includes('gandhinagar') || description.includes('bhavnagar')) {
            return true;
          }
          
          // Include other Indian locations but exclude international
          return description.includes('india') || secondaryText.includes('india');
        });

        res.json({
          success: true,
          predictions: filteredPredictions.slice(0, 8) // Limit to 8 results
        });
      } else {
        res.status(400).json({
          success: false,
          message: data.error_message || "Failed to fetch place suggestions"
        });
      }
    } catch (error) {
      console.error("Places autocomplete error:", error);
      res.status(500).json({ message: "Failed to fetch place suggestions" });
    }
  });

  app.get("/api/places/details", async (req, res) => {
    try {
      const { place_id } = req.query;
      
      if (!place_id || typeof place_id !== 'string') {
        return res.status(400).json({ message: "Place ID parameter is required" });
      }

      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,formatted_address,geometry,types&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        res.json({
          success: true,
          result: data.result
        });
      } else {
        res.status(400).json({
          success: false,
          message: data.error_message || "Failed to fetch place details"
        });
      }
    } catch (error) {
      console.error("Places details error:", error);
      res.status(500).json({ message: "Failed to fetch place details" });
    }
  });

  // Messaging API endpoints
  app.get("/api/network-users", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const networkUsers = await storage.getNetworkUsers(userId);
      res.json(networkUsers);
    } catch (error) {
      console.error("Get network users error:", error);
      res.status(500).json({ message: "Failed to fetch network users" });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { participantId, propertyId, type = "general" } = req.body;
      
      // Check if conversation already exists
      const existingConversation = await storage.getConversation(userId, participantId, propertyId);
      
      if (existingConversation) {
        return res.json(existingConversation);
      }

      const conversationData = insertConversationSchema.parse({
        participant1Id: userId,
        participant2Id: participantId,
        propertyId: propertyId || null,
        type
      });

      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(400).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const conversationId = parseInt(req.params.id);
      const { content, messageType = "text" } = req.body;

      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }

      const messageData = insertMessageSchema.parse({
        conversationId,
        senderId: userId,
        content: content.trim(),
        messageType,
        isRead: false
      });

      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Register analytics routes
  registerAnalyticsRoutes(app);

  // Client Management API endpoints
  app.get("/api/clients", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:clientId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const client = await storage.getClient(parseInt(clientId));
      
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      console.error("Get client error:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const client = await storage.createClient({ ...req.body, userId });
      res.json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:clientId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const client = await storage.getClient(parseInt(clientId));
      
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Client not found" });
      }

      const updatedClient = await storage.updateClient(parseInt(clientId), req.body);
      res.json(updatedClient);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.get("/api/clients/:clientId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const client = await storage.getClient(parseInt(clientId));
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Ensure user owns this client
      if (client.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(client);
    } catch (error) {
      console.error("Get client error:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.patch("/api/clients/:clientId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const client = await storage.getClient(parseInt(clientId));
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Ensure user owns this client
      if (client.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedClient = await storage.updateClient(parseInt(clientId), req.body);
      res.json(updatedClient);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Deal Management API endpoints
  app.get("/api/deals", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const deals = await storage.getDeals(userId);
      res.json(deals);
    } catch (error) {
      console.error("Get deals error:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const deal = await storage.createDeal({ ...req.body, userId });
      res.json(deal);
    } catch (error) {
      console.error("Create deal error:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  // Get deals for a specific client
  app.get("/api/deals/client/:clientId", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const deals = await storage.getClientDeals(parseInt(clientId));
      res.json(deals);
    } catch (error) {
      console.error("Get client deals error:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  // Task Management API endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const task = await storage.createTask({ ...req.body, userId });
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Agent notification system
  app.post("/api/clients/:clientId/send-notification", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const client = await storage.getClient(parseInt(clientId));
      if (!client || client.userId !== userId) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Send SMS notification
      const formattedPhone = client.phone.startsWith('+91') ? client.phone : `+91${client.phone}`;
      const smsSent = await sendSMS(formattedPhone, message);

      if (smsSent) {
        // Log the notification in client notes
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Agent notification sent: "${message.substring(0, 50)}..."`;
        const updatedNotes = client.notes ? `${client.notes}\n\n${logEntry}` : logEntry;
        
        await storage.updateClient(parseInt(clientId), { 
          notes: updatedNotes,
          lastContactDate: new Date().toISOString().split('T')[0]
        });

        res.json({ 
          success: true, 
          message: "Notification sent successfully",
          deliveryStatus: "sent"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send notification" 
        });
      }
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Owner consent management routes
  app.post("/api/clients/:clientId/consent", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clientId } = req.params;
      const { status, document } = req.body;

      if (!["pending", "given", "withdrawn"].includes(status)) {
        return res.status(400).json({ message: "Invalid consent status" });
      }

      const updatedClient = await storage.updateOwnerConsent(parseInt(clientId), status, document);
      res.json({ success: true, client: updatedClient });
    } catch (error) {
      console.error("Consent update error:", error);
      res.status(500).json({ message: "Failed to update consent" });
    }
  });

  app.get("/api/clients/owners", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const clients = await storage.getClients(userId);
      const owners = clients.filter(client => client.isPropertyOwner);
      res.json(owners);
    } catch (error) {
      console.error("Owner clients fetch error:", error);
      res.status(500).json({ message: "Failed to fetch owner clients" });
    }
  });

  app.get("/api/properties/:propertyId/consent-status", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { propertyId } = req.params;
      const property = await storage.getProperty(parseInt(propertyId));
      
      if (!property || property.ownerId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json({
        consentId: property.consentId,
        status: property.ownerApprovalStatus,
        approvedAt: property.approvalTimestamp,
        ownerClientId: property.ownerClientId
      });
    } catch (error) {
      console.error("Consent status error:", error);
      res.status(500).json({ message: "Failed to fetch consent status" });
    }
  });

  app.post("/api/properties/:propertyId/send-consent-link", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { propertyId } = req.params;
      const property = await storage.getProperty(parseInt(propertyId));
      
      if (!property || property.ownerId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!property.consentId) {
        return res.status(400).json({ message: "No consent ID available for this property" });
      }

      // Send SMS with consent link
      const consentUrl = `${config.baseUrl}/consent/${property.consentId}`;
      const message = `PropNet: ${property.ownerName}, please provide consent for listing your property at ${property.fullAddress}. Click: ${consentUrl}`;
      
      const smsSent = await sendSMS(property.ownerPhone, message);
      
      if (smsSent) {
        res.json({ 
          success: true, 
          message: "Consent link sent successfully",
          consentUrl 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send consent link" 
        });
      }
    } catch (error) {
      console.error("Send consent link error:", error);
      res.status(500).json({ message: "Failed to send consent link" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
