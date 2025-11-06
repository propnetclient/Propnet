"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MobileNavigation from "@/components/layout/mobile-navigation";

export default function KYCPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">KYC</h1>
            <p className="text-sm text-neutral-600">Manage your kyc</p>
          </div>
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
        </div>
      </div>

      <div className="px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>KYC Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600">
              This is the kyc page. Content coming soon.
            </p>
            <div className="mt-4 space-x-2">
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Go to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}
