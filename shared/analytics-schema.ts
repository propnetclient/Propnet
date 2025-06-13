import { pgTable, integer, text, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// User analytics and tracking tables
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  duration: integer("duration"), // in seconds
  deviceType: text("device_type"), // mobile, desktop, tablet
  browserName: text("browser_name"),
  osName: text("os_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  pageViews: integer("page_views").default(0),
  actionsPerformed: integer("actions_performed").default(0)
});

export const userEvents = pgTable("user_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id),
  sessionId: uuid("session_id").references(() => userSessions.id),
  eventType: text("event_type").notNull(), // page_view, click, form_submit, property_create, etc.
  eventCategory: text("event_category"), // onboarding, property_management, messaging, etc.
  eventAction: text("event_action"), // button_click, form_submit, search, etc.
  eventLabel: text("event_label"),
  eventValue: integer("event_value"),
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  metadata: jsonb("metadata"), // Additional event data
  timestamp: timestamp("timestamp").defaultNow()
});

export const onboardingProgress = pgTable("onboarding_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id).unique(),
  currentStep: integer("current_step").default(0),
  completedSteps: jsonb("completed_steps").default('[]'), // Array of completed step numbers
  profileCompleted: boolean("profile_completed").default(false),
  firstPropertyAdded: boolean("first_property_added").default(false),
  firstRequirementAdded: boolean("first_requirement_added").default(false),
  firstMessageSent: boolean("first_message_sent").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStarted: timestamp("onboarding_started").defaultNow(),
  onboardingCompleted_at: timestamp("onboarding_completed_at"),
  lastActiveStep: text("last_active_step"),
  dropOffPoint: text("drop_off_point"), // Where user stopped in onboarding
  timeToComplete: integer("time_to_complete") // in seconds
});

export const userEngagement = pgTable("user_engagement", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id).unique(),
  totalSessions: integer("total_sessions").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  lastActiveDate: timestamp("last_active_date"),
  propertiesCreated: integer("properties_created").default(0),
  propertiesViewed: integer("properties_viewed").default(0),
  searchesPerformed: integer("searches_performed").default(0),
  messagesSent: integer("messages_sent").default(0),
  messagesReceived: integer("messages_received").default(0),
  colistingRequestsSent: integer("colisting_requests_sent").default(0),
  colistingRequestsReceived: integer("colisting_requests_received").default(0),
  requirementsPosted: integer("requirements_posted").default(0),
  profileUpdates: integer("profile_updates").default(0),
  avgSessionDuration: integer("avg_session_duration").default(0),
  bounceRate: integer("bounce_rate").default(0), // Percentage
  retentionDay1: boolean("retention_day_1").default(false),
  retentionDay7: boolean("retention_day_7").default(false),
  retentionDay30: boolean("retention_day_30").default(false),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const platformMetrics = pgTable("platform_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date").defaultNow(),
  totalUsers: integer("total_users").default(0),
  activeUsers: integer("active_users").default(0),
  newSignups: integer("new_signups").default(0),
  propertiesListed: integer("properties_listed").default(0),
  requirementsPosted: integer("requirements_posted").default(0),
  messagesExchanged: integer("messages_exchanged").default(0),
  colistingRequests: integer("colisting_requests").default(0),
  avgSessionDuration: integer("avg_session_duration").default(0),
  onboardingCompletionRate: integer("onboarding_completion_rate").default(0), // Percentage
  userRetentionRate: integer("user_retention_rate").default(0), // Percentage
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id]
  }),
  events: many(userEvents)
}));

export const userEventsRelations = relations(userEvents, ({ one }) => ({
  user: one(users, {
    fields: [userEvents.userId],
    references: [users.id]
  }),
  session: one(userSessions, {
    fields: [userEvents.sessionId],
    references: [userSessions.id]
  })
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  user: one(users, {
    fields: [onboardingProgress.userId],
    references: [users.id]
  })
}));

export const userEngagementRelations = relations(userEngagement, ({ one }) => ({
  user: one(users, {
    fields: [userEngagement.userId],
    references: [users.id]
  })
}));

// Types
export type UserSession = typeof userSessions.$inferSelect;
export type UserEvent = typeof userEvents.$inferSelect;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type UserEngagement = typeof userEngagement.$inferSelect;
export type PlatformMetrics = typeof platformMetrics.$inferSelect;