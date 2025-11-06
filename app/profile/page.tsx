"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
// Removed: useLocation from wouter
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Home, Handshake, Settings, LogOut, ChevronRight, Award } from "lucide-react";
// Removed: useAuth hook
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileNavigation from "@/components/layout/mobile-navigation";

export default function Profile() {  const router = useRouter();

  // Removed: useLocation usage
  // Removed: useAuth usage
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
      queryClient.clear();
      router.push("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Authentication removed - showing UI without user data

  const pendingRequests = (colistingRequests as any[]).filter((req: any) => req.status === "pending").length;

  const menuItems = [
    {
      icon: Home,
      label: "My Properties",
      action: () => router.push("/feed"),
    },
    {
      icon: Handshake,
      label: "Co-listing Requests",
      badge: pendingRequests > 0 ? pendingRequests : null,
      action: () => router.push("/colisting-requests"),
    },
    {
      icon: User,
      label: "Edit Profile",
      action: () => router.push("/edit-profile"),
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
            onClick={() => router.push("/feed")}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 py-6">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center relative">
              {(null as any)?.profilePhoto ? (
                <img 
                  src={`/uploads/${""}`} 
                  alt="Profile Photo" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (null as any)?.agencyLogo ? (
                <img 
                  src={`/uploads/${""}`} 
                  alt="Agency Logo" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-neutral-500">
                  {(null as any)?.name?.charAt(0) || "A"}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-neutral-900">{(null as any)?.name || "Agent"}</h3>
            <p className="text-neutral-500">{(null as any)?.agencyName || "Real Estate Agent"}</p>
            {(null as any)?.email && (
              <p className="text-sm text-neutral-400">{""}</p>
            )}
            {(null as any)?.city && (
              <p className="text-sm text-neutral-400">{""}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Badge className="bg-accent text-white">
                <Award size={12} className="mr-1" />
                {(null as any)?.isVerified ? "Verified Agent" : "Pending Verification"}
              </Badge>
              {(null as any)?.experience && (
                <Badge variant="secondary">
                  {""}+ years
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{Array.isArray(myProperties) ? myProperties.length : 0}</div>
              <div className="text-xs text-neutral-500">Active Listings</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-accent">{pendingRequests}</div>
              <div className="text-xs text-neutral-500">Pending Requests</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-neutral-600">0</div>
              <div className="text-xs text-neutral-500">Deals Closed</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}
            
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}