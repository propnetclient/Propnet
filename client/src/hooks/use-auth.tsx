import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

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
    staleTime: 30 * 1000,
    queryFn: async () => {
      // Always use credentials for session-based auth
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { 
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        localStorage.removeItem('propnet_session_token');
        throw new Error("Not authenticated");
      }
      
      const data = await response.json();
      return data.user;
    },
  });

  // Simple initialization logic - always set initialized after first query attempt
  useEffect(() => {
    if (!isLoading) {
      setUser(data || null);
      setIsInitialized(true);
    }
  }, [data, isLoading]);

  // Fallback timer to ensure initialization in case of any issues
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.log("Force initializing auth after 2 seconds");
        setIsInitialized(true);
        setUser(null);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  const login = (newUser: User, sessionToken?: string) => {
    setUser(newUser);
    if (sessionToken) {
      localStorage.setItem('propnet_session_token', sessionToken);
    }
    refetch();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('propnet_session_token');
    refetch();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading && !isInitialized,
        isInitialized,
        login,
        logout,
        updateUser,
      }}
    >
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