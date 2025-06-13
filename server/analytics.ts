import { db } from "./db";
import { userSessions, userEvents, onboardingProgress, userEngagement, platformMetrics } from "@shared/analytics-schema";
import { eq, and, gte, lte, desc, count, avg, sql } from "drizzle-orm";
import { logger } from "./logger";

export class AnalyticsService {
  // Session Management
  async startSession(userId: number, deviceInfo: any): Promise<string> {
    try {
      const [session] = await db.insert(userSessions).values({
        userId,
        deviceType: deviceInfo.deviceType,
        browserName: deviceInfo.browserName,
        osName: deviceInfo.osName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent
      }).returning();
      
      return session.id;
    } catch (error) {
      logger.error("Failed to start session", error);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const sessionStart = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
      
      if (sessionStart.length > 0 && sessionStart[0].sessionStart) {
        const duration = Math.floor((Date.now() - new Date(sessionStart[0].sessionStart).getTime()) / 1000);
        
        await db.update(userSessions)
          .set({ 
            sessionEnd: new Date(),
            duration 
          })
          .where(eq(userSessions.id, sessionId));
          
        // Update user engagement metrics
        await this.updateUserEngagement(sessionStart[0].userId!, duration);
      }
    } catch (error) {
      logger.error("Failed to end session", error);
    }
  }

  // Event Tracking
  async trackEvent(
    userId: number, 
    sessionId: string, 
    eventType: string, 
    category: string, 
    action: string, 
    label?: string, 
    value?: number,
    metadata?: any
  ): Promise<void> {
    try {
      await db.insert(userEvents).values({
        userId,
        sessionId,
        eventType,
        eventCategory: category,
        eventAction: action,
        eventLabel: label,
        eventValue: value,
        metadata
      });

      // Update session activity
      await db.update(userSessions)
        .set({ 
          actionsPerformed: sql`${userSessions.actionsPerformed} + 1`
        })
        .where(eq(userSessions.id, sessionId));
        
    } catch (error) {
      logger.error("Failed to track event", error);
    }
  }

  // Onboarding Tracking
  async initializeOnboarding(userId: number): Promise<void> {
    try {
      await db.insert(onboardingProgress).values({
        userId,
        currentStep: 0,
        completedSteps: [],
        onboardingStarted: new Date()
      }).onConflictDoNothing();
    } catch (error) {
      logger.error("Failed to initialize onboarding", error);
    }
  }

  async updateOnboardingStep(userId: number, step: number, stepName: string): Promise<void> {
    try {
      const existing = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId)).limit(1);
      
      if (existing.length > 0) {
        const completedSteps = existing[0].completedSteps as number[] || [];
        if (!completedSteps.includes(step)) {
          completedSteps.push(step);
        }
        
        await db.update(onboardingProgress)
          .set({
            currentStep: step,
            completedSteps,
            lastActiveStep: stepName
          })
          .where(eq(onboardingProgress.userId, userId));
      }
    } catch (error) {
      logger.error("Failed to update onboarding step", error);
    }
  }

  async completeOnboarding(userId: number): Promise<void> {
    try {
      const startTime = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId)).limit(1);
      
      if (startTime.length > 0) {
        const timeToComplete = startTime[0].onboardingStarted ? 
          Math.floor((Date.now() - new Date(startTime[0].onboardingStarted).getTime()) / 1000) : 0;
        
        await db.update(onboardingProgress)
          .set({
            onboardingCompleted: true,
            onboardingCompleted_at: new Date(),
            timeToComplete
          })
          .where(eq(onboardingProgress.userId, userId));
      }
    } catch (error) {
      logger.error("Failed to complete onboarding", error);
    }
  }

  // User Engagement Metrics
  async updateUserEngagement(userId: number, sessionDuration: number): Promise<void> {
    try {
      const existing = await db.select().from(userEngagement).where(eq(userEngagement.userId, userId)).limit(1);
      
      if (existing.length > 0) {
        const totalSessions = (existing[0].totalSessions || 0) + 1;
        const totalTime = (existing[0].totalTimeSpent || 0) + sessionDuration;
        const avgDuration = Math.floor(totalTime / totalSessions);
        
        await db.update(userEngagement)
          .set({
            totalSessions,
            totalTimeSpent: totalTime,
            avgSessionDuration: avgDuration,
            lastActiveDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(userEngagement.userId, userId));
      } else {
        await db.insert(userEngagement).values({
          userId,
          totalSessions: 1,
          totalTimeSpent: sessionDuration,
          avgSessionDuration: sessionDuration,
          lastActiveDate: new Date()
        });
      }
    } catch (error) {
      logger.error("Failed to update user engagement", error);
    }
  }

  // Analytics Dashboard Data
  async getUserOnboardingStatus(userId: number): Promise<any> {
    try {
      const progress = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId)).limit(1);
      return progress.length > 0 ? progress[0] : null;
    } catch (error) {
      logger.error("Failed to get onboarding status", error);
      return null;
    }
  }

  async getUserEngagementMetrics(userId: number): Promise<any> {
    try {
      const engagement = await db.select().from(userEngagement).where(eq(userEngagement.userId, userId)).limit(1);
      return engagement.length > 0 ? engagement[0] : null;
    } catch (error) {
      logger.error("Failed to get engagement metrics", error);
      return null;
    }
  }

  async getPlatformMetrics(days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await db.select().from(platformMetrics)
        .where(and(
          gte(platformMetrics.date, startDate),
          lte(platformMetrics.date, endDate)
        ))
        .orderBy(desc(platformMetrics.date));

      return metrics;
    } catch (error) {
      logger.error("Failed to get platform metrics", error);
      return [];
    }
  }

  // Daily Metrics Calculation
  async calculateDailyMetrics(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Calculate today's metrics
      const todaySessions = await db.select({ count: count() })
        .from(userSessions)
        .where(and(
          gte(userSessions.sessionStart, today),
          lte(userSessions.sessionStart, tomorrow)
        ));

      const avgSessionDuration = await db.select({ avg: avg(userSessions.duration) })
        .from(userSessions)
        .where(and(
          gte(userSessions.sessionStart, today),
          lte(userSessions.sessionStart, tomorrow)
        ));

      // Store daily metrics
      await db.insert(platformMetrics).values({
        date: today,
        activeUsers: todaySessions[0].count || 0,
        avgSessionDuration: Math.floor(avgSessionDuration[0].avg || 0)
      }).onConflictDoNothing();

    } catch (error) {
      logger.error("Failed to calculate daily metrics", error);
    }
  }
}

export const analytics = new AnalyticsService();