'use client';

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Zap, 
  Building2, 
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users
} from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";

async function fetchData(url: string) {
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}

export default function Dashboard() {
  const { data: myProperties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ["/api/my-properties"],
    queryFn: () => fetchData("/api/my-properties"),
  });

  const { data: myRequirements = [] } = useQuery({
    queryKey: ["/api/my-requirements"],
    queryFn: () => fetchData("/api/my-requirements"),
  });

  const { data: allProperties = [] } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => fetchData("/api/properties"),
  });

  const { data: coListingRequests = [] } = useQuery({
    queryKey: ["/api/colisting-requests"],
    queryFn: () => fetchData("/api/colisting-requests"),
  });

  const quickActions = [
    {
      icon: Zap,
      title: "QuickPost",
      description: "AI-powered property listing",
      path: "/quickpost",
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      icon: Plus,
      title: "Add Property",
      description: "Manual property entry",
      path: "/add-property",
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      icon: Building2,
      title: "My Listings",
      description: "Manage your properties",
      path: "/my-listings",
      color: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      icon: Target,
      title: "Requirements",
      description: "Client requirements",
      path: "/requirements",
      color: "bg-orange-500",
      textColor: "text-orange-600"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1" />Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const propertyArray = Array.isArray(myProperties) ? myProperties : [];
  const coListingArray = Array.isArray(coListingRequests) ? coListingRequests : [];
  const requirementsArray = Array.isArray(myRequirements) ? myRequirements : [];
  const allPropertiesArray = Array.isArray(allProperties) ? allProperties : [];

  const stats = {
    totalListings: propertyArray.length,
    approvedListings: propertyArray.filter((p: any) => p.ownerApprovalStatus === 'approved').length,
    pendingListings: propertyArray.filter((p: any) => p.ownerApprovalStatus === 'pending').length,
    totalRequirements: requirementsArray.length,
    networkProperties: allPropertiesArray.length
  };

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
            <p className="text-sm text-neutral-600">Real Estate Network</p>
          </div>
          <Link href="/profile">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <span className="text-primary font-semibold">U</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalListings}</p>
                <p className="text-sm text-neutral-600">Total Listings</p>
              </div>
              <Building2 className="text-blue-500" size={24} />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.approvedListings}</p>
                <p className="text-sm text-neutral-600">Approved</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalRequirements}</p>
                <p className="text-sm text-neutral-600">Requirements</p>
              </div>
              <Target className="text-orange-500" size={24} />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.networkProperties}</p>
                <p className="text-sm text-neutral-600">Network</p>
              </div>
              <Users className="text-purple-500" size={24} />
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} href={action.path}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center mb-2`}>
                    <action.icon className="text-white" size={20} />
                  </div>
                  <h3 className="font-semibold text-sm text-neutral-900">{action.title}</h3>
                  <p className="text-xs text-neutral-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Properties */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Listings</h2>
          <Link href="/my-listings">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {propertyArray.slice(0, 3).map((property: any) => (
            <Card key={property.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-900">{property.title}</h3>
                    <p className="text-xs text-neutral-600">{property.location}</p>
                  </div>
                  {getStatusBadge(property.ownerApprovalStatus)}
                </div>
              </CardContent>
            </Card>
          ))}
          {propertyArray.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center text-neutral-600 text-sm">
                No listings yet. Create your first listing!
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
