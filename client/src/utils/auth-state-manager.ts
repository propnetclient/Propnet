// Comprehensive authentication state synchronization
import { SessionManager } from './session-manager';

export class AuthStateManager {
  private static eventHandlers: (() => void)[] = [];
  
  // Initialize authentication state listeners
  static initialize() {
    // Listen for storage changes across tabs/windows
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for app focus/visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for page show (back/forward navigation)
    window.addEventListener('pageshow', this.handlePageShow.bind(this));
    
    // iOS-specific PWA state handling
    if (this.isIOSPWA()) {
      this.setupIOSPWAHandlers();
    }
  }
  
  // Register callback for auth state changes
  static onAuthStateChange(callback: () => void) {
    this.eventHandlers.push(callback);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(handler => handler !== callback);
    };
  }
  
  // Trigger auth state refresh
  private static triggerAuthRefresh() {
    this.eventHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.warn('Auth state handler error:', error);
      }
    });
  }
  
  // Handle storage changes from other tabs
  private static handleStorageChange(event: StorageEvent) {
    if (event.key === 'propnet_session' || event.key === 'propnet_session_backup') {
      // Session changed in another tab - refresh current state
      setTimeout(() => this.triggerAuthRefresh(), 100);
    }
  }
  
  // Handle app visibility changes
  private static handleVisibilityChange() {
    if (!document.hidden) {
      // App became visible - check session validity
      const session = SessionManager.getSession();
      if (session) {
        setTimeout(() => this.triggerAuthRefresh(), 100);
      }
    }
  }
  
  // Handle page show events
  private static handlePageShow(event: PageTransitionEvent) {
    if (event.persisted || performance.navigation.type === 2) {
      // Page loaded from cache - refresh auth state
      setTimeout(() => this.triggerAuthRefresh(), 100);
    }
  }
  
  // Check if running in iOS PWA mode
  private static isIOSPWA(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    return isIOS && isStandalone;
  }
  
  // Setup iOS PWA specific handlers
  private static setupIOSPWAHandlers() {
    // Handle app state changes in iOS PWA
    let isAppActive = !document.hidden;
    
    const handleAppStateChange = () => {
      const wasActive = isAppActive;
      isAppActive = !document.hidden;
      
      if (!wasActive && isAppActive) {
        // App became active - refresh session
        setTimeout(() => this.triggerAuthRefresh(), 200);
      }
    };
    
    document.addEventListener('visibilitychange', handleAppStateChange);
    
    // Handle iOS PWA resume from background
    window.addEventListener('focus', () => {
      setTimeout(() => this.triggerAuthRefresh(), 200);
    });
  }
  
  // Force session validation
  static async validateSession(): Promise<boolean> {
    const session = SessionManager.getSession();
    if (!session) return false;
    
    try {
      const response = await fetch('/api/pin-auth/verify-session', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        SessionManager.clearSession();
        return false;
      }
      
      SessionManager.refreshSession();
      return true;
    } catch (error) {
      console.warn('Session validation failed:', error);
      return false;
    }
  }
  
  // Cleanup listeners
  static cleanup() {
    window.removeEventListener('storage', this.handleStorageChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('pageshow', this.handlePageShow);
    this.eventHandlers = [];
  }
}