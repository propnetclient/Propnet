import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Home, Handshake, Settings, LogOut, ChevronRight, BarChart3, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/layout/bottom-navigation";
import AnalyticsDashboard from "@/components/ui/analytics-dashboard";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myProperties = [] } = useQuery({
    queryKey: ["/api/my-properties"],
  });

  const { data: colistingRequests = [] } = useQuery({
    queryKey: ["/api/colisting-requests"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    setLocation("/");
    return null;
  }

  const pendingRequests = (colistingRequests as any[]).filter((req: any) => req.status === "pending").length;

  const menuItems = [
    {
      icon: Home,
      label: "My Properties",
      action: () => setLocation("/feed"),
    },
    {
      icon: Handshake,
      label: "Co-listing Requests",
      badge: pendingRequests > 0 ? pendingRequests : null,
      action: () => setLocation("/colisting-requests"),
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => toast({ title: "Coming Soon", description: "Settings will be available soon" }),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button 
            className="text-primary mr-4"
            onClick={() => setLocation("/feed")}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 shrink-0">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <User size={16} />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 size={16} />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="px-6 py-6">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-neutral-500">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">{user?.name || "Agent"}</h3>
              <p className="text-neutral-500">{user?.agencyName || "Real Estate Agent"}</p>
              <div className="flex items-center justify-center mt-2">
                <Badge className="bg-accent text-white">
                  <Award size={12} className="mr-1" />
                  {user?.isVerified ? "Verified Agent" : "Pending Verification"}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{(myProperties as any[]).length}</div>
                <div className="text-sm text-neutral-500">Active Listings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-neutral-500">Co-listings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-neutral-500">Deals Closed</div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-4 px-4 bg-white border border-neutral-200 rounded-lg touch-target"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="text-neutral-400" size={20} />
                    <span className="text-neutral-700">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="text-neutral-300" size={16} />
                  </div>
                </button>
              ))}

              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center justify-between py-4 px-4 bg-white border border-neutral-200 rounded-lg text-red-600 touch-target"
              >
                <div className="flex items-center space-x-3">
                  <LogOut size={20} />
                  <span>Logout</span>
                </div>
                {logoutMutation.isPending ? (
                  <div className="loading-spinner" />
                ) : (
                  <ChevronRight className="text-red-300" size={16} />
                )}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto px-6 py-6">
            <AnalyticsDashboard userId={user?.id || 0} />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}