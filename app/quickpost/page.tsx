'use client';

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function QuickPostPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">QuickPost</h1>
        <p className="text-sm text-neutral-600">AI-powered listing</p>
      </div>

      <div className="px-4 py-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="mx-auto mb-4 text-blue-500" size={48} />
            <h2 className="text-xl font-bold mb-2">QuickPost with AI</h2>
            <p className="text-neutral-600 mb-6">
              Create property listings quickly using AI assistance
            </p>
            <Button className="w-full">
              <Zap size={16} className="mr-2" />
              Start QuickPost
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
