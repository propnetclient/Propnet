"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
// Removed: useAuth hook
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, KeyRound, ArrowLeft } from "lucide-react";

interface LoginData {
  phone: string;
  pin: string;
  keepLoggedIn: boolean;
}

export default function PinLogin() {  const router = useRouter();

  const [formData, setFormData] = useState<LoginData>({
    phone: "",
    pin: "",
    keepLoggedIn: false
  });
  const [showPinInput, setShowPinInput] = useState(false);
  const { toast } = useToast();
  // Removed: useAuth usage
  // Removed: useLocation usage

  // Check phone status mutation
  const checkPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      return apiRequest("/api/pin-auth/check-phone", "POST", { phone });
    },
    onSuccess: (data: any) => {
      if (data.needsVerification) {
        router.push("/auth/phone-verification");
      } else {
        setShowPinInput(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify phone number",
        variant: "destructive"
      });
    }
  });

  // PIN login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      return apiRequest("/api/pin-auth/login-pin", "POST", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Welcome back!",
        description: "Successfully logged in"
      });
      
      if (data.requiresProfileComplete) {
        router.push("/auth/complete-profile");
      } else {
        router.push("/");
      }
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid phone number or PIN",
        variant: "destructive"
      });
    }
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length === 10) {
      checkPhoneMutation.mutate(formData.phone);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length >= 4) {
      loginMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    setShowPinInput(false);
    setFormData(prev => ({ ...prev, pin: "" }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            {showPinInput ? <KeyRound className="h-8 w-8" /> : <Smartphone className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {showPinInput ? "Enter Your PIN" : "Login to PropNet"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {showPinInput 
              ? "Enter your 4-6 digit PIN to access your account"
              : "Enter your registered mobile number to continue"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {!showPinInput ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="rounded-l-none"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={formData.phone.length !== 10 || checkPhoneMutation.isPending}
              >
                {checkPhoneMutation.isPending ? "Checking..." : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Logging in as: <span className="font-medium">+91 {formData.phone}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="pin">Enter PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••••"
                  value={formData.pin}
                  onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keepLoggedIn"
                  checked={formData.keepLoggedIn}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, keepLoggedIn: !!checked }))}
                />
                <Label htmlFor="keepLoggedIn" className="text-sm">
                  Keep me logged in
                </Label>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={formData.pin.length < 4 || loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="text-center">
                <Link href="/auth/forgot-pin">
                  <a className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot PIN?
                  </a>
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to PropNet?{" "}
              <Link href="/auth/phone-verification">
                <a className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up here
                </a>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}