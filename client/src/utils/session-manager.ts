// Comprehensive session and authentication state management
export interface SessionData {
  sessionToken: string;
  userId: number;
  lastUpdated: number;
  keepLoggedIn: boolean;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'propnet_session';
  private static readonly BACKUP_KEY = 'propnet_session_backup';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  
  // Store session data securely
  static setSession(sessionToken: string, userId: number, keepLoggedIn: boolean = false): void {
    const sessionData: SessionData = {
      sessionToken,
      userId,
      lastUpdated: Date.now(),
      keepLoggedIn
    };
    
    try {
      // Primary storage
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      
      // Backup storage for PWA/iOS compatibility
      sessionStorage.setItem(this.BACKUP_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to store session data:', error);
    }
  }
  
  // Retrieve session data
  static getSession(): SessionData | null {
    try {
      // Try primary storage first
      let sessionStr = localStorage.getItem(this.SESSION_KEY);
      
      // Fallback to backup storage
      if (!sessionStr) {
        sessionStr = sessionStorage.getItem(this.BACKUP_KEY);
      }
      
      if (!sessionStr) return null;
      
      const sessionData: SessionData = JSON.parse(sessionStr);
      
      // Check if session is expired (for non-persistent sessions)
      if (!sessionData.keepLoggedIn) {
        const timeDiff = Date.now() - sessionData.lastUpdated;
        if (timeDiff > this.SESSION_TIMEOUT) {
          this.clearSession();
          return null;
        }
      }
      
      return sessionData;
    } catch (error) {
      console.warn('Failed to retrieve session data:', error);
      return null;
    }
  }
  
  // Clear all session data
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.BACKUP_KEY);
      
      // Clear iOS-specific backup
      localStorage.removeItem('propnet_user_backup');
      localStorage.removeItem('propnet_last_auth_check');
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }
  
  // Update session timestamp
  static refreshSession(): void {
    const session = this.getSession();
    if (session) {
      session.lastUpdated = Date.now();
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.BACKUP_KEY, JSON.stringify(session));
      } catch (error) {
        console.warn('Failed to refresh session:', error);
      }
    }
  }
  
  // Check if user should stay logged in
  static hasValidSession(): boolean {
    const session = this.getSession();
    return session !== null;
  }
  
  // Get session token for API requests
  static getSessionToken(): string | null {
    const session = this.getSession();
    return session?.sessionToken || null;
  }
  
  // Migrate old session data if needed
  static migrateOldSession(): void {
    try {
      // Check for old session format and migrate
      const oldSession = localStorage.getItem('auth_session');
      if (oldSession && !localStorage.getItem(this.SESSION_KEY)) {
        const oldData = JSON.parse(oldSession);
        if (oldData.sessionToken && oldData.userId) {
          this.setSession(oldData.sessionToken, oldData.userId, oldData.keepLoggedIn || false);
          localStorage.removeItem('auth_session');
        }
      }
    } catch (error) {
      console.warn('Failed to migrate old session:', error);
    }
  }
}