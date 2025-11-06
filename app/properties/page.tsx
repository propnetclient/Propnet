'use client';

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Bed, Bath, Square } from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";

async function fetchData(url: string) {
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}

export default function PropertiesPage() {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => fetchData("/api/properties"),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
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
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-neutral-900">Properties</h1>
        <p className="text-sm text-neutral-600">Browse available listings</p>
      </div>

      {/* Properties List */}
      <div className="px-4 py-4 space-y-4">
        {Array.isArray(properties) && properties.map((property: any) => (
          <Link key={property.id} href={`/properties/${property.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-neutral-200 rounded-lg flex items-center justify-center">
                    <Building2 className="text-neutral-400" size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-neutral-900 mb-1">
                      {property.title || 'Property'}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-neutral-600 mb-2">
                      <MapPin size={14} />
                      <span>{property.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-600 mb-2">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed size={14} />
                          <span>{property.bedrooms} BHK</span>
                        </div>
                      )}
                      {property.area && (
                        <div className="flex items-center gap-1">
                          <Square size={14} />
                          <span>{property.area} sq ft</span>
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {property.price ? formatPrice(property.price) : 'Price on request'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        
        {(!Array.isArray(properties) || properties.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto mb-4 text-neutral-400" size={48} />
              <p className="text-neutral-600">No properties available</p>
            </CardContent>
          </Card>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
