import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, KeyRound, MessageSquare, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface ResetData {
  phone: string;
  otp: string;
  newPin: string;
  confirmPin: string;
}

export default function ForgotPin() {
  const [formData, setFormData] = useState<ResetData>({
    phone: "",
    otp: "",
    newPin: "",
    confirmPin: ""
  });
  const [currentStep, setCurrentStep] = useState<'phone' | 'verify' | 'newpin'>('phone');
  const [resendTimer, setResendTimer] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, login } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // Send OTP for PIN reset
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      return apiRequest("/api/pin-auth/send-otp", "POST", { 
        phone, 
        purpose: "pin_reset" 
      });
    },
    onSuccess: (data: any) => {
      setCurrentStep('verify');
      setResendTimer(60);
      toast({
        title: "Reset Code Sent",
        description: data.message
      });
      
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code",
        variant: "destructive"
      });
    }
  });

  // Verify OTP for PIN reset
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      return apiRequest("/api/pin-auth/verify-otp", "POST", {
        phone: data.phone,
        otp: data.otp,
        purpose: "pin_reset"
      });
    },
    onSuccess: () => {
      setCurrentStep('newpin');
      toast({
        title: "Code Verified",
        description: "Now set your new PIN"
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid reset code",
        variant: "destructive"
      });
    }
  });

  // Reset PIN
  const resetPinMutation = useMutation({
    mutationFn: async (data: { phone: string; newPin: string }) => {
      return apiRequest("/api/pin-auth/reset-pin", "POST", data);
    },
    onSuccess: (data: any) => {
      login(data.user);
      toast({
        title: "PIN Reset Successful",
        description: "Your new PIN has been set"
      });
      
      if (data.requiresProfileComplete) {
        setLocation("/auth/complete-profile");
      } else {
        setLocation("/");
      }
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset PIN",
        variant: "destructive"
      });
    }
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length === 10) {
      sendOtpMutation.mutate(formData.phone);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length === 6) {
      verifyOtpMutation.mutate({
        phone: formData.phone,
        otp: formData.otp
      });
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPin !== formData.confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and confirmation PIN don't match",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPin.length < 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be at least 4 digits",
        variant: "destructive"
      });
      return;
    }

    resetPinMutation.mutate({
      phone: formData.phone,
      newPin: formData.newPin
    });
  };

  const handleBack = () => {
    if (currentStep === 'verify') {
      setCurrentStep('phone');
      setFormData(prev => ({ ...prev, otp: "" }));
      setResendTimer(0);
    } else if (currentStep === 'newpin') {
      setCurrentStep('verify');
      setFormData(prev => ({ ...prev, newPin: "", confirmPin: "" }));
    }
  };

  const handleResendOtp = () => {
    if (resendTimer === 0) {
      sendOtpMutation.mutate(formData.phone);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            {currentStep === 'phone' && <Smartphone className="h-8 w-8" />}
            {currentStep === 'verify' && <MessageSquare className="h-8 w-8" />}
            {currentStep === 'newpin' && <KeyRound className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {currentStep === 'phone' && "Reset Your PIN"}
            {currentStep === 'verify' && "Verify Reset Code"}
            {currentStep === 'newpin' && "Set New PIN"}
          </CardTitle>
          <CardDescription className="text-red-100">
            {currentStep === 'phone' && "Enter your registered mobile number"}
            {currentStep === 'verify' && "Enter the 6-digit code sent to your phone"}
            {currentStep === 'newpin' && "Create a new 4-6 digit PIN"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Phone Number Step */}
          {currentStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Registered Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10) 
                    }))}
                    className="rounded-l-none"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send a reset code to this number
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  disabled={formData.phone.length !== 10 || sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? "Sending..." : "Send Reset Code"}
                </Button>

                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>
          )}

          {/* OTP Verification Step */}
          {currentStep === 'verify' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Reset code sent to: <span className="font-medium">+91 {formData.phone}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="otp">Reset Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    otp: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  disabled={formData.otp.length !== 6 || verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="flex justify-between items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || sendOtpMutation.isPending}
                    className="text-sm"
                  >
                    {resendTimer > 0 
                      ? `Resend in ${resendTimer}s` 
                      : sendOtpMutation.isPending 
                        ? "Sending..." 
                        : "Resend Code"
                    }
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* New PIN Setup Step */}
          {currentStep === 'newpin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Setting new PIN for: <span className="font-medium">+91 {formData.phone}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="newPin">New PIN (4-6 digits)</Label>
                <Input
                  id="newPin"
                  type="password"
                  placeholder="••••••"
                  value={formData.newPin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    newPin: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPin">Confirm New PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  placeholder="••••••"
                  value={formData.confirmPin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  disabled={formData.newPin.length < 4 || formData.confirmPin.length < 4 || resetPinMutation.isPending}
                >
                  {resetPinMutation.isPending ? "Setting PIN..." : "Set New PIN"}
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
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact support for assistance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}