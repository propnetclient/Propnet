'use client';

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";

async function fetchData(url: string) {
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}

export default function MyListingsPage() {
  const { data: myProperties = [], isLoading } = useQuery({
    queryKey: ["/api/my-properties"],
    queryFn: () => fetchData("/api/my-properties"),
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-neutral-900">My Listings</h1>
        <p className="text-sm text-neutral-600">Manage your properties</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {Array.isArray(myProperties) && myProperties.map((property: any) => (
          <Card key={property.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-base text-neutral-900">{property.title}</h3>
                {getStatusBadge(property.ownerApprovalStatus)}
              </div>
              <p className="text-sm text-neutral-600">{property.location}</p>
              <p className="text-lg font-bold text-primary mt-2">
                {property.price ? `₹${property.price.toLocaleString()}` : 'Price on request'}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {(!Array.isArray(myProperties) || myProperties.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto mb-4 text-neutral-400" size={48} />
              <p className="text-neutral-600">No listings yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
