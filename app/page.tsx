"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Users,
  FileCheck,
  IndianRupee,
  MapPin,
  Search,
  Star,
  Play,
  TrendingUp,
  Clock,
  Zap,
  MessageSquare,
} from "lucide-react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [suggestionData, setSuggestionData] = useState({
    name: "",
    contact: "",
    suggestion: "",
  });

  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Application Submitted!",
      description:
        "We'll review your application and contact you soon with beta access details.",
    });
    setFormData({
      name: "",
      phone: "",
    });
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Suggestion Submitted!",
      description: "Thank you for your feedback. We'll review it carefully.",
    });
    setSuggestionData({ name: "", contact: "", suggestion: "" });
    setShowSuggestionForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">PropNet</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:text-blue-400">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <Badge
              variant="outline"
              className="mb-4 border-blue-400/50 text-blue-400"
            >
              🚀 Now in Beta
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              The Real Estate Network
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Built for Professionals
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect with verified brokers, share listings instantly, and close
              deals faster with India's most trusted real estate network.
            </p>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose PropNet?
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to grow your real estate business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">Verified Network</CardTitle>
              <CardDescription className="text-gray-400">
                Connect only with verified, RERA-certified brokers and agents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Zap className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">Instant Sharing</CardTitle>
              <CardDescription className="text-gray-400">
                Share listings instantly with your network and get quick responses
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">Track Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor views, responses, and close deals with real-time analytics
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 container mx-auto px-4">
        <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center">
              Ready to Transform Your Business?
            </CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Join PropNet today and connect with thousands of verified real estate
              professionals
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
              <Input
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <Input
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="bg-slate-900/50 border-slate-700 text-white"
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Request Beta Access
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">
            <p>© 2024 PropNet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
