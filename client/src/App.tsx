import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import PinLogin from "@/pages/auth/pin-login";
import PhoneVerification from "@/pages/auth/phone-verification";
import SetupPin from "@/pages/auth/setup-pin";
import ForgotPin from "@/pages/auth/forgot-pin";
import OtpVerification from "@/pages/auth/otp-verification";
import KYC from "@/pages/auth/kyc";
import CompleteProfile from "@/pages/auth/complete-profile";
import Dashboard from "@/pages/dashboard/dashboard";
import PropertyFeed from "@/pages/properties/feed";
import PropertySearch from "@/pages/properties/search";
import AddProperty from "@/pages/properties/add-property";
import BulkUpload from "@/pages/properties/bulk-upload";
import PropertyDetail from "@/pages/properties/property-detail";
import MyListings from "@/pages/properties/my-listings";
import QuickPost from "@/pages/properties/quickpost";
import OwnerConsent from "@/pages/properties/owner-consent";
import Requirements from "@/pages/requirements/requirements";
import Map from "@/pages/map/map";
import Messages from "@/pages/messages/messages";
import Clients from "@/pages/clients";
import ClientProfile from "@/pages/clients/client-profile";
import Profile from "@/pages/profile/profile";
import EditProfile from "@/pages/profile/edit-profile";
import ColistingRequests from "@/pages/profile/colisting-requests";
import AdminPanel from "@/pages/admin";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import NotFound from "@/pages/not-found";

// Protected Route Component with proper initialization handling
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isInitialized } = useAuth();

  // Debug logging to track authentication state
  console.log("Protected Route Check:", {
    user: user ? { id: user.id, name: user.name, isProfileComplete: user.isProfileComplete } : null,
    isInitialized,
    timestamp: new Date().toISOString()
  });

  // Wait for initialization to complete
  if (!isInitialized) {
    console.log("Waiting for auth initialization");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    console.log("No user, redirecting to login");
    return <Login />;
  }

  // Redirect to profile completion if incomplete
  if (!user.isProfileComplete) {
    console.log("Profile incomplete, showing completion screen");
    return <CompleteProfile />;
  }

  console.log("User authenticated with complete profile, rendering component");
  return <Component />;
}

function Router() {
  const { user, isLoading, isInitialized } = useAuth();

  console.log('Router state:', { user: user ? { id: user.id, isProfileComplete: user.isProfileComplete } : null, isLoading, isInitialized });

  // Show loading while checking authentication or initializing
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Landing page for unauthenticated users */}
      <Route path="/">
        {user && user.id ? (
          user.isProfileComplete ? <Dashboard /> : <CompleteProfile />
        ) : (
          <Landing />
        )}
      </Route>
      
      {/* Secure Admin Portal - completely separate from user interface */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminPanel} />
      
      {/* Authentication routes */}
      <Route path="/login" component={Login} />
      <Route path="/auth/login" component={PinLogin} />
      <Route path="/auth/phone-verification" component={PhoneVerification} />
      <Route path="/auth/setup-pin" component={SetupPin} />
      <Route path="/auth/forgot-pin" component={ForgotPin} />
      <Route path="/otp-verification" component={OtpVerification} />
      <Route path="/kyc" component={KYC} />
      <Route path="/auth/complete-profile" component={CompleteProfile} />
      <Route path="/complete-profile" component={CompleteProfile} />
      
      {/* Protected app routes - only for authenticated users with complete profiles */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/feed">
        <ProtectedRoute component={PropertyFeed} />
      </Route>
      <Route path="/search">
        <ProtectedRoute component={PropertySearch} />
      </Route>
      <Route path="/add-property">
        <ProtectedRoute component={AddProperty} />
      </Route>
      <Route path="/bulk-upload">
        <ProtectedRoute component={BulkUpload} />
      </Route>
      <Route path="/quickpost">
        <ProtectedRoute component={QuickPost} />
      </Route>
      <Route path="/property/:id">
        <ProtectedRoute component={PropertyDetail} />
      </Route>
      <Route path="/my-listings">
        <ProtectedRoute component={MyListings} />
      </Route>
      <Route path="/consent/:consentId" component={OwnerConsent} />
      <Route path="/requirements">
        <ProtectedRoute component={Requirements} />
      </Route>
      <Route path="/map">
        <ProtectedRoute component={Map} />
      </Route>
      <Route path="/messages">
        <ProtectedRoute component={Messages} />
      </Route>
      <Route path="/clients">
        <ProtectedRoute component={Clients} />
      </Route>
      <Route path="/clients/:clientId">
        <ProtectedRoute component={ClientProfile} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/edit-profile">
        <ProtectedRoute component={EditProfile} />
      </Route>
      <Route path="/colisting-requests">
        <ProtectedRoute component={ColistingRequests} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="app-container">
              <Toaster />
              <Router />
              <PWAInstallPrompt />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;