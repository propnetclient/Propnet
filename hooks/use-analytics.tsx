"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './use-auth';

// Client-side analytics tracking
class ClientAnalytics {
  private sessionId: string | null = null;
  private startTime: number = Date.now();
  private pageViews: number = 0;
  private actions: number = 0;

  async initSession(userId: number) {
    if (this.sessionId) return this.sessionId;

    try {
      const deviceInfo = this.getDeviceInfo();
      const response = await fetch('/api/analytics/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deviceInfo })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.sessionId;
        return this.sessionId;
      }
    } catch (error) {
      console.warn('Analytics session start failed');
    }
    return null;
  }

  async endSession() {
    if (!this.sessionId) return;

    try {
      await fetch('/api/analytics/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId })
      });
    } catch (error) {
      console.warn('Analytics session end failed');
    }
    
    this.sessionId = null;
  }

  async trackPageView(path: string, userId?: number) {
    this.pageViews++;
    await this.trackEvent('page_view', 'navigation', 'page_visit', path, userId);
  }

  async trackEvent(
    eventType: string, 
    category: string, 
    action: string, 
    label?: string, 
    userId?: number,
    value?: number,
    metadata?: any
  ) {
    if (!this.sessionId && userId) {
      await this.initSession(userId);
    }

    if (!this.sessionId) return;

    this.actions++;

    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: this.sessionId,
          eventType,
          category,
          action,
          label,
          value,
          metadata: {
            ...metadata,
            pageUrl: window.location.pathname,
            referrer: document.referrer
          }
        })
      });
    } catch (error) {
      console.warn('Analytics event tracking failed');
    }
  }

  async trackOnboarding(userId: number, step: number, stepName: string) {
    await this.trackEvent('onboarding', 'user_journey', 'step_completed', stepName, userId, step);
    
    try {
      await fetch('/api/analytics/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, step, stepName })
      });
    } catch (error) {
      console.warn('Onboarding tracking failed');
    }
  }

  private getDeviceInfo() {
    const ua = navigator.userAgent;
    const deviceType = /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 
                      /Tablet|iPad/.test(ua) ? 'tablet' : 'desktop';
    
    let browserName = 'Unknown';
    if (ua.includes('Chrome')) browserName = 'Chrome';
    else if (ua.includes('Firefox')) browserName = 'Firefox';
    else if (ua.includes('Safari')) browserName = 'Safari';
    else if (ua.includes('Edge')) browserName = 'Edge';

    let osName = 'Unknown';
    if (ua.includes('Windows')) osName = 'Windows';
    else if (ua.includes('Mac')) osName = 'macOS';
    else if (ua.includes('Linux')) osName = 'Linux';
    else if (ua.includes('Android')) osName = 'Android';
    else if (ua.includes('iOS')) osName = 'iOS';

    return {
      deviceType,
      browserName,
      osName,
      userAgent: ua,
      ipAddress: '', // Will be filled server-side
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}

const analytics = new ClientAnalytics();

// Hook for page view tracking
export const useAnalytics = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const prevLocationRef = useRef<string>(pathname);
  
  useEffect(() => {
    if (pathname !== prevLocationRef.current) {
      analytics.trackPageView(pathname, user?.id);
      prevLocationRef.current = pathname;
    }
  }, [pathname, user?.id]);

  useEffect(() => {
    if (user?.id) {
      analytics.initSession(user.id);
    }

    // End session on page unload
    const handleUnload = () => {
      analytics.endSession();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      analytics.endSession();
    };
  }, [user?.id]);
};

// Hook for event tracking
export const useEventTracking = () => {
  const { user } = useAuth();

  const trackEvent = (
    eventType: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: any
  ) => {
    analytics.trackEvent(eventType, category, action, label, user?.id, value, metadata);
  };

  const trackOnboarding = (step: number, stepName: string) => {
    if (user?.id) {
      analytics.trackOnboarding(user.id, step, stepName);
    }
  };

  const trackPropertyAction = (action: string, propertyId?: number) => {
    trackEvent('property_interaction', 'property_management', action, propertyId?.toString(), propertyId);
  };

  const trackSearch = (query: string, filters?: any) => {
    trackEvent('search', 'property_discovery', 'search_performed', query, undefined, filters);
  };

  const trackMessage = (action: 'sent' | 'received', recipientId?: number) => {
    trackEvent('messaging', 'communication', `message_${action}`, recipientId?.toString(), recipientId);
  };

  return {
    trackEvent,
    trackOnboarding,
    trackPropertyAction,
    trackSearch,
    trackMessage
  };
};