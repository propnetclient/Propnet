'use client';

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { MapPin } from "lucide-react";

export default function MapPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-neutral-900">Map View</h1>
        <p className="text-sm text-neutral-600">Properties on map</p>
      </div>

      <div className="px-4 py-4">
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="mx-auto mb-4 text-neutral-400" size={48} />
            <p className="text-neutral-600">Map view coming soon</p>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}
