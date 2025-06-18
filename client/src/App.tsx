import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
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
import Clients from "@/pages/clients/clients";
import Profile from "@/pages/profile/profile";
import EditProfile from "@/pages/profile/edit-profile";
import ColistingRequests from "@/pages/profile/colisting-requests";
import AdminPanel from "@/pages/admin";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
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
        {user ? (
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
        {user && user.isProfileComplete ? <Dashboard /> : <CompleteProfile />}
      </Route>
      <Route path="/feed">
        {user && user.isProfileComplete ? <PropertyFeed /> : <CompleteProfile />}
      </Route>
      <Route path="/search">
        {user && user.isProfileComplete ? <PropertySearch /> : <CompleteProfile />}
      </Route>
      <Route path="/add-property">
        {user && user.isProfileComplete ? <AddProperty /> : <CompleteProfile />}
      </Route>
      <Route path="/bulk-upload">
        {user && user.isProfileComplete ? <BulkUpload /> : <CompleteProfile />}
      </Route>
      <Route path="/quickpost">
        {user && user.isProfileComplete ? <QuickPost /> : <CompleteProfile />}
      </Route>
      <Route path="/property/:id">
        {user && user.isProfileComplete ? <PropertyDetail /> : <CompleteProfile />}
      </Route>
      <Route path="/my-listings">
        {user && user.isProfileComplete ? <MyListings /> : <CompleteProfile />}
      </Route>
      <Route path="/consent/:consentId" component={OwnerConsent} />
      <Route path="/requirements">
        {user && user.isProfileComplete ? <Requirements /> : <CompleteProfile />}
      </Route>
      <Route path="/map">
        {user && user.isProfileComplete ? <Map /> : <CompleteProfile />}
      </Route>
      <Route path="/messages">
        {user && user.isProfileComplete ? <Messages /> : <CompleteProfile />}
      </Route>
      <Route path="/clients">
        {user && user.isProfileComplete ? <Clients /> : <CompleteProfile />}
      </Route>
      <Route path="/profile">
        {user && user.isProfileComplete ? <Profile /> : <CompleteProfile />}
      </Route>
      <Route path="/edit-profile">
        {user && user.isProfileComplete ? <EditProfile /> : <CompleteProfile />}
      </Route>
      <Route path="/colisting-requests">
        {user && user.isProfileComplete ? <ColistingRequests /> : <CompleteProfile />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="app-container">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
