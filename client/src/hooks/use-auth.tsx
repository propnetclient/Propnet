import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - shorter for profile updates
    gcTime: 2 * 60 * 1000, // 2 minutes - shorter cache for iOS compatibility
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    queryFn: async () => {
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
    },
  });

  useEffect(() => {
    if (data && !isLoading) {
      setUser(data);
    } else if (isError && !isLoading) {
      setUser(null);
    }
  }, [data, isLoading, isError]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // Force refetch to ensure iOS gets the latest state
    refetch();
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
