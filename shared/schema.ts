import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  name: text("name"),
  reraId: text("rera_id"),
  agencyName: text("agency_name"),
  city: text("city"),
  isVerified: boolean("is_verified").default(false),
  isKycComplete: boolean("is_kyc_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  propertyType: text("property_type").notNull(), // apartment, villa, commercial, plot
  price: text("price").notNull(),
  size: text("size").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  bhk: integer("bhk"),
  listingType: text("listing_type").notNull(), // exclusive, colisting
  photos: text("photos").array().default([]),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  coListings: many(coListings),
  coListingRequests: many(coListingRequests),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  ownerId: true,
});

export const insertCoListingRequestSchema = createInsertSchema(coListingRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type CoListing = typeof coListings.$inferSelect;
export type CoListingRequest = typeof coListingRequests.$inferSelect;
export type InsertCoListingRequest = z.infer<typeof insertCoListingRequestSchema>;
