import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  name: text("name"),
  email: text("email"),
  profilePhoto: text("profile_photo"),
  reraId: text("rera_id"),
  agencyName: text("agency_name"),
  agencyLogo: text("agency_logo"),
  city: text("city"),
  areaOfExpertise: text("area_of_expertise").array(),
  workingRegions: text("working_regions").array(),
  experience: text("experience"),
  bio: text("bio"),
  website: text("website"),
  socialMedia: json("social_media"),
  isVerified: boolean("is_verified").default(false),
  isKycComplete: boolean("is_kyc_complete").default(false),
  isProfileComplete: boolean("is_profile_complete").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  pinHash: text("pin_hash"), // Hashed 4-6 digit PIN
  sessionToken: text("session_token"), // For persistent sessions
  sessionExpiresAt: timestamp("session_expires_at"),
  keepLoggedIn: boolean("keep_logged_in").default(false),
  lastLoginAt: timestamp("last_login_at"),
  deviceFingerprint: text("device_fingerprint"), // For security tracking
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  propertyType: text("property_type").notNull(), // apartment, villa, commercial, plot
  transactionType: text("transaction_type").notNull(), // sale, rent
  price: text("price").notNull(),
  rentFrequency: text("rent_frequency"), // monthly, yearly (for rent properties)
  size: text("size").notNull(),
  sizeUnit: text("size_unit").notNull().default("sq.ft"), // sq.ft, sq.m, sq.yd, acre
  location: text("location").notNull(),
  fullAddress: text("full_address").notNull(),
  flatNumber: text("flat_number"),
  floorNumber: text("floor_number"),
  buildingSociety: text("building_society"),
  description: text("description"),
  bhk: integer("bhk"),
  listingType: text("listing_type").notNull(), // exclusive, colisting, shared
  isPubliclyVisible: boolean("is_publicly_visible").default(false),
  photos: text("photos").array().default([]),
  ownerName: text("owner_name").notNull(), // encrypted
  ownerPhone: text("owner_phone").notNull(), // encrypted
  commissionTerms: text("commission_terms"),
  scopeOfWork: text("scope_of_work").array(),
  agreementDocument: text("agreement_document"),
  ownerApprovalStatus: text("owner_approval_status").default("pending"), // pending, approved, rejected
  consentId: text("consent_id"),
  approvalTimestamp: timestamp("approval_timestamp"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coListings = pgTable("co_listings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  agentId: integer("agent_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("approved"), // approved
  createdAt: timestamp("created_at").defaultNow(),
});

export const coListingRequests = pgTable("co_listing_requests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, declined
  createdAt: timestamp("created_at").defaultNow(),
});

export const propertyRequirements = pgTable("property_requirements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  propertyType: text("property_type").notNull(),
  location: text("location").notNull(),
  minPrice: text("min_price"),
  maxPrice: text("max_price"),
  minSize: text("min_size"),
  maxSize: text("max_size"),
  bhk: integer("bhk"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").notNull().references(() => users.id),
  participant2Id: integer("participant2_id").notNull().references(() => users.id),
  propertyId: integer("property_id").references(() => properties.id),
  type: text("type").notNull().default("general"), // 'general', 'property_inquiry', 'colisting'
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // 'text', 'property_share', 'contact_request'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const betaSignups = pgTable("beta_signups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  suggestion: text("suggestion").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const otpSessions = pgTable("otp_sessions", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 15 }).notNull(),
  otpHash: text("otp_hash").notNull(), // Hashed OTP for security
  purpose: text("purpose").notNull(), // 'verification', 'pin_reset'
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  coListings: many(coListings),
  coListingRequests: many(coListingRequests),
  propertyRequirements: many(propertyRequirements),
  sentMessages: many(messages),
  conversations1: many(conversations, { relationName: "participant1" }),
  conversations2: many(conversations, { relationName: "participant2" }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  coListings: many(coListings),
  coListingRequests: many(coListingRequests),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
    relationName: "participant1",
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
    relationName: "participant2",
  }),
  property: one(properties, {
    fields: [conversations.propertyId],
    references: [properties.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const coListingsRelations = relations(coListings, ({ one }) => ({
  property: one(properties, {
    fields: [coListings.propertyId],
    references: [properties.id],
  }),
  agent: one(users, {
    fields: [coListings.agentId],
    references: [users.id],
  }),
}));

export const coListingRequestsRelations = relations(coListingRequests, ({ one }) => ({
  property: one(properties, {
    fields: [coListingRequests.propertyId],
    references: [properties.id],
  }),
  requester: one(users, {
    fields: [coListingRequests.requesterId],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [coListingRequests.ownerId],
    references: [users.id],
  }),
}));

export const propertyRequirementsRelations = relations(propertyRequirements, ({ one }) => ({
  user: one(users, {
    fields: [propertyRequirements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = z.object({
  // Always required fields
  title: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  transactionType: z.string().min(1, "Transaction type is required"),
  price: z.string().min(1, "Price is required"),
  size: z.string().min(1, "Size is required"),
  sizeUnit: z.string().min(1, "Size unit is required"),
  location: z.string().min(1, "Location is required"),
  fullAddress: z.string().min(1, "Full address is required"),
  listingType: z.string().min(1, "Listing type is required"),
  bhk: z.number().min(1, "BHK is required"),
  flatNumber: z.string().min(1, "Flat/Unit number is required"),
  buildingSociety: z.string().min(1, "Building/Society name is required"),
  
  // Optional fields (only required for exclusive/co-listing)
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  commissionTerms: z.string().optional(),
  
  // Other optional fields
  rentFrequency: z.string().optional(),
  floorNumber: z.string().optional(),
  description: z.string().optional(),
  isPubliclyVisible: z.boolean().optional().default(false),
  scopeOfWork: z.array(z.string()).optional().default([]),
  photos: z.array(z.string()).optional().default([]),
  agreementDocument: z.string().optional(),
  ownerApprovalStatus: z.string().optional().default("pending"),
  consentId: z.string().optional(),
  approvalTimestamp: z.date().optional(),
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  // For exclusive and co-listing types, require owner details and commission terms
  if (data.listingType === "exclusive" || data.listingType === "co-listing") {
    return data.ownerName && data.ownerPhone && data.commissionTerms;
  }
  return true;
}, {
  message: "Owner name, phone, and commission terms are required for exclusive/co-listing properties",
  path: ["ownerName"]
});

export const insertCoListingRequestSchema = createInsertSchema(coListingRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPropertyRequirementSchema = createInsertSchema(propertyRequirements).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertBetaSignupSchema = createInsertSchema(betaSignups).omit({
  id: true,
  createdAt: true,
  status: true,
  approvedAt: true,
});

export const insertSuggestionSchema = createInsertSchema(suggestions).omit({
  id: true,
  createdAt: true,
});

export const insertOtpSessionSchema = createInsertSchema(otpSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OtpSession = typeof otpSessions.$inferSelect;
export type InsertOtpSession = z.infer<typeof insertOtpSessionSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type CoListing = typeof coListings.$inferSelect;
export type CoListingRequest = typeof coListingRequests.$inferSelect;
export type InsertCoListingRequest = z.infer<typeof insertCoListingRequestSchema>;
export type PropertyRequirement = typeof propertyRequirements.$inferSelect;
export type InsertPropertyRequirement = z.infer<typeof insertPropertyRequirementSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type BetaSignup = typeof betaSignups.$inferSelect;
export type InsertBetaSignup = z.infer<typeof insertBetaSignupSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;

// Admin Users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  approvedDevices: text("approved_devices").array(),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Sessions table
export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar("session_token", { length: 128 }).unique().notNull(),
  deviceFingerprint: varchar("device_fingerprint", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  email: text("email"),
  type: text("type").notNull(), // owner, buyer, tenant, lead
  budget: text("budget"),
  preferredLocation: text("preferred_location"),
  requirements: text("requirements"),
  notes: text("notes"),
  status: text("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  title: text("title").notNull(),
  dealType: text("deal_type").notNull(), // sale, rent, lease
  value: text("value"),
  commissionType: text("commission_type"), // percentage, fixed
  commissionValue: text("commission_value"),
  expectedClosure: timestamp("expected_closure"),
  actualClosure: timestamp("actual_closure"),
  status: text("status").default("active"), // active, closed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dealId: integer("deal_id").references(() => deals.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull(), // low, medium, high
  status: text("status").default("pending"), // pending, completed, cancelled
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for new tables
export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  user: one(users, {
    fields: [deals.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [deals.clientId],
    references: [clients.id],
  }),
  property: one(properties, {
    fields: [deals.propertyId],
    references: [properties.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [tasks.dealId],
    references: [deals.id],
  }),
}));

// Insert schemas for new tables
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  userId: true,
  actualClosure: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  userId: true,
  completedAt: true,
});

// Types for new tables
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

// Import analytics tables
export * from "./analytics-schema";
