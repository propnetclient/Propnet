import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import OtpVerification from "@/pages/auth/otp-verification";
import KYC from "@/pages/auth/kyc";
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
import Profile from "@/pages/profile/profile";
import EditProfile from "@/pages/profile/edit-profile";
import ColistingRequests from "@/pages/profile/colisting-requests";
import AdminPanel from "@/pages/admin";
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
        {user ? <Dashboard /> : <Landing />}
      </Route>
      
      {/* Admin panel - always accessible */}
      <Route path="/admin" component={AdminPanel} />
      
      {/* Authentication routes */}
      <Route path="/login" component={Login} />
      <Route path="/otp-verification" component={OtpVerification} />
      <Route path="/kyc" component={KYC} />
      
      {/* Protected app routes - only for authenticated users */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/feed" component={PropertyFeed} />
      <Route path="/search" component={PropertySearch} />
      <Route path="/add-property" component={AddProperty} />
      <Route path="/bulk-upload" component={BulkUpload} />
      <Route path="/quickpost" component={QuickPost} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/consent/:consentId" component={OwnerConsent} />
      <Route path="/requirements" component={Requirements} />
      <Route path="/map" component={Map} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/colisting-requests" component={ColistingRequests} />
      
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
