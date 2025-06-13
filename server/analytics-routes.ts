import type { Express } from "express";
import { analytics } from "./analytics";
import { requireAuth } from "./auth";
import { z } from "zod";
import { rateLimit } from "./middleware";

export function registerAnalyticsRoutes(app: Express) {
  // Session management
  app.post("/api/analytics/session/start", rateLimit(10, 60000), async (req, res) => {
    try {
      const { userId, deviceInfo } = z.object({
        userId: z.number(),
        deviceInfo: z.object({
          deviceType: z.string(),
          browserName: z.string(),
          osName: z.string(),
          userAgent: z.string(),
          screenResolution: z.string().optional(),
          timezone: z.string().optional()
        })
      }).parse(req.body);

      const sessionId = await analytics.startSession(userId, {
        ...deviceInfo,
        ipAddress: req.ip || req.connection.remoteAddress
      });

      res.json({ sessionId });
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.post("/api/analytics/session/end", async (req, res) => {
    try {
      const { sessionId } = z.object({
        sessionId: z.string()
      }).parse(req.body);

      await analytics.endSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Invalid session ID" });
    }
  });

  // Event tracking
  app.post("/api/analytics/event", rateLimit(50, 60000), async (req, res) => {
    try {
      const { userId, sessionId, eventType, category, action, label, value, metadata } = z.object({
        userId: z.number().optional(),
        sessionId: z.string(),
        eventType: z.string(),
        category: z.string(),
        action: z.string(),
        label: z.string().optional(),
        value: z.number().optional(),
        metadata: z.any().optional()
      }).parse(req.body);

      if (userId) {
        await analytics.trackEvent(userId, sessionId, eventType, category, action, label, value, metadata);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Onboarding tracking
  app.post("/api/analytics/onboarding/step", async (req, res) => {
    try {
      const auth = requireAuth(req);
      if (!auth.success) {
        return res.status(401).json({ message: auth.message });
      }

      const { step, stepName } = z.object({
        step: z.number(),
        stepName: z.string()
      }).parse(req.body);

      await analytics.updateOnboardingStep(auth.userId!, step, stepName);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Invalid onboarding data" });
    }
  });

  app.post("/api/analytics/onboarding/complete", async (req, res) => {
    try {
      const auth = requireAuth(req);
      if (!auth.success) {
        return res.status(401).json({ message: auth.message });
      }

      await analytics.completeOnboarding(auth.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Analytics dashboard data
  app.get("/api/analytics/user/:userId/onboarding", async (req, res) => {
    try {
      const auth = requireAuth(req);
      if (!auth.success) {
        return res.status(401).json({ message: auth.message });
      }

      const userId = parseInt(req.params.userId);
      if (auth.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = await analytics.getUserOnboardingStatus(userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to get onboarding data" });
    }
  });

  app.get("/api/analytics/user/:userId/engagement", async (req, res) => {
    try {
      const auth = requireAuth(req);
      if (!auth.success) {
        return res.status(401).json({ message: auth.message });
      }

      const userId = parseInt(req.params.userId);
      if (auth.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = await analytics.getUserEngagementMetrics(userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to get engagement data" });
    }
  });

  // Platform metrics (admin only - simplified for now)
  app.get("/api/analytics/platform/metrics", async (req, res) => {
    try {
      const auth = requireAuth(req);
      if (!auth.success) {
        return res.status(401).json({ message: auth.message });
      }

      const days = parseInt(req.query.days as string) || 30;
      const data = await analytics.getPlatformMetrics(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to get platform metrics" });
    }
  });
}