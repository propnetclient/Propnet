import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, Smartphone, KeyRound, MessageSquare, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      await apiRequest("POST", "/api/auth/send-otp", { phone });
    },
    onSuccess: () => {
      localStorage.setItem("tempPhone", phone);
      setLocation("/otp-verification");
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      sendOtpMutation.mutate(phone);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Building className="text-white text-2xl" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">PropNet</h1>
          <p className="text-neutral-500">Verified Real Estate Agent Network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-400 text-sm">+91</span>
              </div>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
            disabled={sendOtpMutation.isPending || phone.length < 10}
          >
            {sendOtpMutation.isPending ? (
              <div className="loading-spinner" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>

        <p className="text-xs text-neutral-400 text-center mt-6">
          Only verified real estate agents can join this platform
        </p>
      </div>
    </div>
  );
}
