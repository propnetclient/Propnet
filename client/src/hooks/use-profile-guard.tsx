import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";

// Custom hook for profile completion guard logic
export function useProfileGuard() {
  const { user, isInitialized } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Wait for authentication to be fully initialized
    if (!isInitialized) {
      console.log("🔄 Auth not yet initialized, waiting...");
      return;
    }

    console.log("🔍 Profile Guard Check:", {
      user: user ? { id: user.id, name: user.name, isProfileComplete: user.isProfileComplete } : null,
      isInitialized
    });

    // Only redirect if user exists and profile is incomplete
    if (user && !user.isProfileComplete) {
      console.log("➡️ Redirecting to profile completion");
      setLocation("/auth/complete-profile");
    }
  }, [user, isInitialized, setLocation]);

  return { user, isInitialized, shouldShowProfile: user && !user.isProfileComplete };
}

// Higher-order component for route protection
export function withAuthGuard<T extends object>(
  Component: React.ComponentType<T>,
  requiresProfile = true
) {
  return function AuthGuardedComponent(props: T) {
    const { user, isInitialized } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
      if (!isInitialized) {
        console.log("🔄 AuthGuard: Waiting for initialization...");
        return;
      }

      console.log("🛡️ AuthGuard Check:", {
        user: user ? { id: user.id, isProfileComplete: user.isProfileComplete } : null,
        requiresProfile,
        isInitialized
      });

      // Redirect to login if no user
      if (!user) {
        console.log("➡️ AuthGuard: Redirecting to login");
        setLocation("/login");
        return;
      }

      // Redirect to profile completion if required and incomplete
      if (requiresProfile && !user.isProfileComplete) {
        console.log("➡️ AuthGuard: Redirecting to profile completion");
        setLocation("/auth/complete-profile");
        return;
      }
    }, [user, isInitialized, setLocation]);

    // Show loading while not initialized
    if (!isInitialized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    // Show nothing while redirecting
    if (!user || (requiresProfile && !user.isProfileComplete)) {
      return null;
    }

    return <Component {...props} />;
  };
}