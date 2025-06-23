import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { iosAuthUtils } from "@/utils/ios-auth-fix";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
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
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false, // Prevent infinite refetch loops
    refetchOnMount: true,
    refetchOnReconnect: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        const data = await response.json();
        return data.user;
      } catch (error) {
        // Ensure error is properly thrown to set loading to false
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (data) {
        setUser(data);
        setIsInitialized(true);
        iosAuthUtils.backupUserState(data);
      } else {
        // No authenticated user - check iOS backup
        const backupUser = iosAuthUtils.restoreUserState();
        if (backupUser && iosAuthUtils.isIOS()) {
          setUser(backupUser);
        } else {
          setUser(null);
          iosAuthUtils.clearBackup();
        }
        setIsInitialized(true);
      }
    }
  }, [data, isLoading]);

  // Simplified iOS authentication persistence - only on app initialization
  useEffect(() => {
    if (iosAuthUtils.isIOS() && iosAuthUtils.isStandalone() && !user && isInitialized) {
      // Check for backup user on iOS PWA startup only
      const backupUser = iosAuthUtils.restoreUserState();
      if (backupUser) {
        setUser(backupUser);
      }
    }
  }, [isInitialized, user]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    // Clear iOS backup state on logout
    iosAuthUtils.clearBackup();
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // Backup updated user state for iOS compatibility
    iosAuthUtils.backupUserState(userData);
    // Don't refetch immediately to prevent loops
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
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
