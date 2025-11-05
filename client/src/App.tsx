import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
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

function Router() {
  // All routes are public now. Render components directly.
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/">
        <Landing />
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

      {/* App routes (now public) */}
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
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:clientId" component={ClientProfile} />
      <Route path="/profile" component={Profile} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/colisting-requests" component={ColistingRequests} />

      {/* Fallback */}
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
            <PWAInstallPrompt />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
