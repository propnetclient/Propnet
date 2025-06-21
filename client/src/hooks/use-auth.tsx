import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { iosAuthUtils } from "@/utils/ios-auth-fix";
import { SessionManager } from "@/utils/session-manager";
import { AuthStateManager } from "@/utils/auth-state-manager";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (user: User, sessionToken?: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - shorter for profile updates
    gcTime: 2 * 60 * 1000, // 2 minutes - shorter cache for iOS compatibility
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: SessionManager.hasValidSession(), // Only run if we have a session
    queryFn: async () => {
      const sessionToken = SessionManager.getSessionToken();
      
      if (!sessionToken) {
        throw new Error("No session token");
      }

      // Try session verification first
      const sessionResponse = await fetch("/api/pin-auth/verify-session", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        SessionManager.refreshSession();
        return sessionData.user;
      }

      // Fallback to regular auth check
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        // Clear invalid session
        SessionManager.clearSession();
        throw new Error("Not authenticated");
      }
      
      const data = await response.json();
      return data.user;
    },
  });

  // Initialize session manager and authentication state monitoring
  useEffect(() => {
    SessionManager.migrateOldSession();
    AuthStateManager.initialize();
    
    // Setup auth state change listener
    const unsubscribe = AuthStateManager.onAuthStateChange(() => {
      refetch();
    });
    
    return () => {
      unsubscribe();
      AuthStateManager.cleanup();
    };
  }, [refetch]);

  useEffect(() => {
    if (data && !isLoading) {
      setUser(data);
      setIsInitialized(true);
      // Backup state for iOS compatibility
      iosAuthUtils.backupUserState(data);
    } else if (isError && !isLoading) {
      // Try to restore from backup on iOS
      const backupUser = iosAuthUtils.restoreUserState();
      if (backupUser && iosAuthUtils.isIOS()) {
        setUser(backupUser);
        setIsInitialized(true);
        // Force a session refresh to verify the backup is still valid
        iosAuthUtils.forceSessionRefresh().then(refreshedUser => {
          if (refreshedUser) {
            setUser(refreshedUser);
            iosAuthUtils.backupUserState(refreshedUser);
          } else {
            setUser(null);
            iosAuthUtils.clearBackup();
          }
        });
      } else {
        setUser(null);
        setIsInitialized(true);
        iosAuthUtils.clearBackup();
      }
    }
  }, [data, isLoading, isError]);

  // iOS PWA visibility change handler for authentication persistence
  useEffect(() => {
    if (!iosAuthUtils.isIOS() || !iosAuthUtils.isStandalone()) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        // App regained focus in iOS PWA mode - refresh auth state
        setTimeout(() => {
          refetch();
        }, 100);
      }
    };

    const handlePageShow = () => {
      if (isInitialized) {
        // Page shown from cache - refresh auth state
        setTimeout(() => {
          refetch();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isInitialized, refetch]);

  const login = (userData: User, sessionToken?: string) => {
    setUser(userData);
    if (sessionToken) {
      SessionManager.setSession(sessionToken, userData.id, userData.keepLoggedIn || false);
    }
    // Backup for iOS compatibility
    iosAuthUtils.backupUserState(userData);
  };

  const logout = async () => {
    const sessionToken = SessionManager.getSessionToken();
    
    // Clear session from server
    if (sessionToken) {
      try {
        await fetch("/api/pin-auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.warn("Failed to logout from server:", error);
      }
    }
    
    // Clear all local session data
    SessionManager.clearSession();
    iosAuthUtils.clearBackup();
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // Update session with latest user data
    const session = SessionManager.getSession();
    if (session) {
      SessionManager.setSession(session.sessionToken, userData.id, session.keepLoggedIn);
    }
    // Backup updated user state for iOS compatibility
    iosAuthUtils.backupUserState(userData);
    // Force refetch to ensure latest state
    refetch();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
