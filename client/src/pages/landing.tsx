import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Shield, CheckCircle, XCircle, Users, FileCheck, DollarSign, MapPin, Search, Star, Play, TrendingUp, Clock, Zap } from "lucide-react";

export default function Landing() {
  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });
  const { toast } = useToast();

  const betaSignupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/beta-signup", data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and contact you soon with beta access details.",
      });
      setFormData({
        name: "",
        phone: ""
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and contact number to apply for beta access.",
        variant: "destructive"
      });
      return;
    }

    betaSignupMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">PropNet</span>
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Button size="sm">
              See Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The Real Estate Network<br />
              <span className="text-yellow-300">Built for Brokers.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              A powerful private network built for brokers, by brokers — where every lead, listing, and effort is tracked, protected, and rewarded.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-8 py-3"
                onClick={() => document.getElementById('beta-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Early Access
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 font-medium">
                <Play className="w-5 h-5 mr-2" />
                See Demo
              </Button>
            </div>
            <p className="text-lg italic text-blue-200">
              "WhatsApp isn't built for real estate. We are."
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-red-50 dark:bg-red-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              <XCircle className="w-8 h-8 text-red-600 inline mr-2" />
              The Problem: Real Estate Is Broken for Brokers
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  You show a client a property, someone else closes the deal.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Your listings are shared everywhere without your name.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  You do the hard work, but get ghosted — or lose commission.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Every deal feels like a war instead of a win.
                </p>
              </div>
            </div>
            <p className="text-xl mt-8 text-gray-600 dark:text-gray-300">
              It's not your fault. You never had the right tools.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <CheckCircle className="w-8 h-8 text-green-600 inline mr-2" />
                What We Fixed
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Features That Matter</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <Shield className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Verified Brokers-Only Network</CardTitle>
                  <CardDescription>
                    Only real, verified agents and brokers. No builders, no buyers, no noise.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <FileCheck className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Owner-Approved Listings</CardTitle>
                  <CardDescription>
                    Every property comes from a real broker with owner consent. No duplicates. No misinformation.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <Zap className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>Structured Listing Sharing</CardTitle>
                  <CardDescription>
                    Upload once. Share anytime. Auto-generated, searchable, media-rich listing cards. Goodbye WhatsApp chaos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <DollarSign className="h-10 w-10 text-yellow-600 mb-2" />
                  <CardTitle>Commission Protection Tools</CardTitle>
                  <CardDescription>
                    Set clear terms with your client: role, responsibility, and commission. Get digital consent.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <Users className="h-10 w-10 text-red-600 mb-2" />
                  <CardTitle>Anti-Poaching & Lead Protection</CardTitle>
                  <CardDescription>
                    Timestamped lead logs, visit history, and soft exclusivity. Get credit for your work. Every time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <MapPin className="h-10 w-10 text-indigo-600 mb-2" />
                  <CardTitle>Map-Based Search (Beta)</CardTitle>
                  <CardDescription>
                    Find listings based on location, landmarks, radius, or micro-market demand.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 bg-blue-50 dark:bg-blue-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Built For: Brokers & Agents in the Secondary Market
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Stop losing leads due to system gaps</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Protect your commission, effort, and relationships</h3>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                <DollarSign className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Earn more with less chaos</h3>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
              What's Coming Soon
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <Search className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">AI-Powered Buyer Matching</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <FileCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Property Preference Report Generator</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold">Reputation & Rating Layer</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <Building2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Builder/Developer Module</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <Clock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold">Automated Document Handling</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Application Form */}
      <section id="beta-form" className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Get Early Access
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-2">
                We're onboarding the first 250 verified brokers in India.
              </p>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                Interested in testing our platform?
              </p>
            </div>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Join the Beta</CardTitle>
                <CardDescription>
                  Share your details and we'll be in touch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="Your full name"
                      className="h-11"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Number *</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="Your WhatsApp number"
                      className="h-11"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium"
                    disabled={betaSignupMutation.isPending}
                  >
                    {betaSignupMutation.isPending ? "Submitting..." : "Apply for Beta Access"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            We're here to make you pro.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-yellow-400 text-blue-900 hover:bg-yellow-300">
              Join The Network
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Suggest a Feature
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">PropNet</span>
              </div>
              <p className="text-gray-400 mb-4">
                A powerful private network built for brokers, by brokers.
              </p>
              <Badge variant="secondary">Beta Testing Phase</Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Beta Program</li>
                <li>Roadmap</li>
                <li>Pricing</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community</li>
                <li>Feedback</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PropNet. All rights reserved. Currently in beta testing phase - limited access available.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}