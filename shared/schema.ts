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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  coListings: many(coListings),
  coListingRequests: many(coListingRequests),
  propertyRequirements: many(propertyRequirements),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  coListings: many(coListings),
  coListingRequests: many(coListingRequests),
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

// Chat system tables
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastRead: timestamp("last_read").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, image, pdf, location
  attachmentUrl: text("attachment_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Connections system
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion forums/channels
export const forumChannels = pgTable("forum_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // market, leads, networking, events
  city: text("city"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => forumChannels.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array().default([]),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => forumPosts.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentReplyId: integer("parent_reply_id").references(() => forumReplies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral requests
export const referralRequests = pgTable("referral_requests", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // buyer, seller, tenant, landlord
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: text("budget"),
  location: text("location").notNull(),
  requirements: json("requirements"),
  status: text("status").notNull().default("active"), // active, closed, fulfilled
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralResponses = pgTable("referral_responses", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => referralRequests.id).notNull(),
  responderId: integer("responder_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  organizerId: integer("organizer_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // open_house, site_visit, webinar, meetup
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  maxAttendees: integer("max_attendees"),
  propertyId: integer("property_id").references(() => properties.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("attending"), // attending, maybe, not_attending
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = z.object({
  // Required fields
  title: z.string().min(1, "Property title is required"),
  propertyType: z.string().min(1, "Property type is required"),
  transactionType: z.string().min(1, "Transaction type is required"),
  price: z.string().min(1, "Price is required"),
  size: z.string().min(1, "Size is required"),
  sizeUnit: z.string().min(1, "Size unit is required"),
  location: z.string().min(1, "Location is required"),
  fullAddress: z.string().min(1, "Full address is required"),
  listingType: z.string().min(1, "Listing type is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().min(10, "Valid owner phone is required"),
  
  // Optional fields
  rentFrequency: z.string().optional(),
  flatNumber: z.string().optional(),
  floorNumber: z.string().optional(),
  buildingSociety: z.string().optional(),
  description: z.string().optional(),
  bhk: z.number().optional(),
  isPubliclyVisible: z.boolean().optional().default(false),
  commissionTerms: z.string().optional(),
  scopeOfWork: z.array(z.string()).optional().default([]),
  photos: z.array(z.string()).optional().default([]),
  agreementDocument: z.string().optional(),
  ownerApprovalStatus: z.string().optional().default("pending"),
  consentId: z.string().optional(),
  approvalTimestamp: z.date().optional(),
  isActive: z.boolean().optional().default(true),
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

// Chat and community insert schemas
export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
  isPinned: true,
});

export const insertReferralRequestSchema = createInsertSchema(referralRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

// Chat relations
export const chatsRelations = relations(chats, ({ one, many }) => ({
  property: one(properties, { fields: [chats.propertyId], references: [properties.id] }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, { fields: [chatParticipants.chatId], references: [chats.id] }),
  user: one(users, { fields: [chatParticipants.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, { fields: [chatMessages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id] }),
}));

// Connection relations
export const connectionsRelations = relations(connections, ({ one }) => ({
  requester: one(users, { fields: [connections.requesterId], references: [users.id] }),
  receiver: one(users, { fields: [connections.receiverId], references: [users.id] }),
}));

// Forum relations
export const forumChannelsRelations = relations(forumChannels, ({ one, many }) => ({
  creator: one(users, { fields: [forumChannels.createdBy], references: [users.id] }),
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  channel: one(forumChannels, { fields: [forumPosts.channelId], references: [forumChannels.id] }),
  author: one(users, { fields: [forumPosts.authorId], references: [users.id] }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  post: one(forumPosts, { fields: [forumReplies.postId], references: [forumPosts.id] }),
  author: one(users, { fields: [forumReplies.authorId], references: [users.id] }),
  parentReply: one(forumReplies, { fields: [forumReplies.parentReplyId], references: [forumReplies.id] }),
}));

// Referral relations
export const referralRequestsRelations = relations(referralRequests, ({ one, many }) => ({
  author: one(users, { fields: [referralRequests.authorId], references: [users.id] }),
  responses: many(referralResponses),
}));

export const referralResponsesRelations = relations(referralResponses, ({ one }) => ({
  request: one(referralRequests, { fields: [referralResponses.requestId], references: [referralRequests.id] }),
  responder: one(users, { fields: [referralResponses.responderId], references: [users.id] }),
  property: one(properties, { fields: [referralResponses.propertyId], references: [properties.id] }),
}));

// Event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  property: one(properties, { fields: [events.propertyId], references: [properties.id] }),
  attendees: many(eventAttendees),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(events, { fields: [eventAttendees.eventId], references: [events.id] }),
  user: one(users, { fields: [eventAttendees.userId], references: [users.id] }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type CoListing = typeof coListings.$inferSelect;
export type CoListingRequest = typeof coListingRequests.$inferSelect;
export type InsertCoListingRequest = z.infer<typeof insertCoListingRequestSchema>;
export type PropertyRequirement = typeof propertyRequirements.$inferSelect;
export type InsertPropertyRequirement = z.infer<typeof insertPropertyRequirementSchema>;

// Chat and community types
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type ForumChannel = typeof forumChannels.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ReferralRequest = typeof referralRequests.$inferSelect;
export type InsertReferralRequest = z.infer<typeof insertReferralRequestSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
