import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Users, MessageSquare, MapPin, Search, Zap, Shield, Globe } from "lucide-react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const betaSignupMutation = useMutation({
    mutationFn: async (data: { email: string; phone: string }) => {
      return apiRequest("POST", "/api/beta-signup", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to PropNet Beta!",
        description: "We'll contact you soon with access details and testing instructions.",
      });
      setEmail("");
      setPhone("");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  });

  const handleEarlyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phone) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and phone number to join our beta testing.",
        variant: "destructive"
      });
      return;
    }

    betaSignupMutation.mutate({ email, phone });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
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
            <Button variant="outline" size="sm">
              Contact Us
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4">
            🚀 Now in Beta Testing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Your
            <span className="text-blue-600 block">Real Estate Business</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with fellow agents, discover exclusive properties, and close deals faster with our intelligent real estate platform.
          </p>
          
          {/* Early Access Form */}
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader>
              <CardTitle className="text-left">Join Beta Testing</CardTitle>
              <CardDescription className="text-left">
                Be among the first to experience the future of real estate networking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEarlyAccess} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={betaSignupMutation.isPending}
                >
                  {betaSignupMutation.isPending ? "Joining..." : "Get Beta Access"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Beta Testers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Properties Listed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">50+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cities Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Built for Modern Real Estate Professionals
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with deep real estate expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Agent Network</CardTitle>
                <CardDescription>
                  Connect and collaborate with verified real estate professionals in your area
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Smart Location Search</CardTitle>
                <CardDescription>
                  Find properties with advanced location-based filtering and map integration
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Instant Messaging</CardTitle>
                <CardDescription>
                  Communicate with clients and agents in real-time with property-specific chats
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>AI-Powered Listings</CardTitle>
                <CardDescription>
                  Upload property details quickly with AI-assisted data extraction from text
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>Secure Platform</CardTitle>
                <CardDescription>
                  Enterprise-grade security with phone verification and encrypted communications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-indigo-600 mb-2" />
                <CardTitle>Mobile-First Design</CardTitle>
                <CardDescription>
                  Access your business from anywhere with our responsive, mobile-optimized interface
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Simple. Smart. Powerful.
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Get started in minutes and transform your real estate business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up & Verify</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create your account with phone verification and complete your professional profile
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">List Properties</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Add your listings with our AI-powered tools or bulk upload from existing databases
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Close</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Network with agents, find perfect matches for clients, and close deals faster
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Testing CTA */}
      <section className="bg-blue-600 dark:bg-blue-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Revolutionize Your Real Estate Business?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our exclusive beta testing program and help shape the future of real estate technology. 
            Limited spots available for serious professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary">
              Schedule a Demo
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Learn More
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
                Transforming real estate through intelligent networking and collaboration.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Beta Program</li>
                <li>API Access</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community</li>
                <li>Status</li>
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
            <p>&copy; 2025 PropNet. All rights reserved. Currently in beta testing phase.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}