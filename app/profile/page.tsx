'use client';

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { User, Mail, Phone, Edit } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-neutral-900">Profile</h1>
        <p className="text-sm text-neutral-600">Your account information</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="text-primary" size={40} />
              </div>
            </div>
            <h2 className="text-center text-xl font-bold text-neutral-900 mb-1">User Profile</h2>
            <p className="text-center text-sm text-neutral-600 mb-4">Real Estate Professional</p>
            
            <Link href="/profile/edit">
              <Button className="w-full" variant="outline">
                <Edit size={16} className="mr-2" />
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="text-neutral-400" size={20} />
              <div>
                <p className="text-xs text-neutral-600">Email</p>
                <p className="text-sm font-medium">user@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-neutral-400" size={20} />
              <div>
                <p className="text-xs text-neutral-600">Phone</p>
                <p className="text-sm font-medium">+91 XXXXXXXXXX</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}
