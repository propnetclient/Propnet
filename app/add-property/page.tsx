'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export default function AddPropertyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">Add Property</h1>
        <p className="text-sm text-neutral-600">Create a new listing</p>
      </div>

      <div className="px-4 py-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Property Title</label>
              <Input placeholder="e.g., 3 BHK Apartment" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input placeholder="Enter location" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Price</label>
              <Input type="number" placeholder="Enter price" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Property description" className="mt-1" rows={4} />
            </div>
            <Button className="w-full">
              <Plus size={16} className="mr-2" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
