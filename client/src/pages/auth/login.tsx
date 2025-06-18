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

interface LoginData {
  phone: string;
  pin: string;
  otp: string;
  keepLoggedIn: boolean;
}

export default function Login() {
  const [formData, setFormData] = useState<LoginData>({
    phone: "",
    pin: "",
    otp: "",
    keepLoggedIn: false
  });
  const [currentStep, setCurrentStep] = useState<'phone' | 'pin' | 'verify'>('phone');
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

  // Check if phone needs verification or can use PIN
  const checkPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", "/api/pin-auth/check-phone", { phone });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.needsVerification) {
        sendOtpMutation.mutate(formData.phone);
      } else {
        setCurrentStep('pin');
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

  // Send OTP for verification
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", "/api/pin-auth/send-otp", { 
        phone, 
        purpose: "verification" 
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setCurrentStep('verify');
      setResendTimer(60);
      toast({
        title: "Verification Code Sent",
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
        description: error.message || "Failed to send verification code",
        variant: "destructive"
      });
    }
  });

  // Verify OTP and complete registration
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const res = await apiRequest("POST", "/api/pin-auth/verify-otp", {
        phone: data.phone,
        otp: data.otp,
        purpose: "verification"
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.user) {
        login(data.user);
      }
      
      toast({
        title: "Phone Verified!",
        description: "Your phone number has been verified successfully"
      });

      if (data.requiresPinSetup) {
        setLocation("/auth/setup-pin");
      } else if (data.requiresProfileComplete) {
        setLocation("/auth/complete-profile");
      } else {
        setLocation("/");
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    }
  });

  // Login with PIN
  const loginMutation = useMutation({
    mutationFn: async (data: { phone: string; pin: string; keepLoggedIn: boolean }) => {
      const res = await apiRequest("POST", "/api/pin-auth/login-pin", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      login(data.user);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in"
      });
      
      if (data.requiresProfileComplete) {
        setLocation("/auth/complete-profile");
      } else {
        setLocation("/");
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
      loginMutation.mutate({
        phone: formData.phone,
        pin: formData.pin,
        keepLoggedIn: formData.keepLoggedIn
      });
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

  const handleBack = () => {
    if (currentStep === 'pin') {
      setCurrentStep('phone');
      setFormData(prev => ({ ...prev, pin: "" }));
    } else if (currentStep === 'verify') {
      setCurrentStep('phone');
      setFormData(prev => ({ ...prev, otp: "" }));
      setResendTimer(0);
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
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            {currentStep === 'phone' && <Smartphone className="h-8 w-8" />}
            {currentStep === 'pin' && <KeyRound className="h-8 w-8" />}
            {currentStep === 'verify' && <MessageSquare className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {currentStep === 'phone' && "Welcome to PropNet"}
            {currentStep === 'pin' && "Enter Your PIN"}
            {currentStep === 'verify' && "Verify Your Phone"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {currentStep === 'phone' && "Enter your registered mobile number"}
            {currentStep === 'pin' && "Enter your 4-6 digit PIN to access your account"}
            {currentStep === 'verify' && "Enter the 6-digit code sent to your phone"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Phone Number Step */}
          {currentStep === 'phone' && (
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
                  New users will receive a verification code
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={formData.phone.length !== 10 || checkPhoneMutation.isPending}
              >
                {checkPhoneMutation.isPending ? "Checking..." : "Continue"}
              </Button>
            </form>
          )}

          {/* PIN Entry Step */}
          {currentStep === 'pin' && (
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
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    pin: e.target.value.replace(/\D/g, '').slice(0, 6) 
                  }))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keepLoggedIn"
                  checked={formData.keepLoggedIn}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    keepLoggedIn: !!checked 
                  }))}
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
                <Link href="/auth/forgot-pin" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot PIN?
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
                  Code sent to: <span className="font-medium">+91 {formData.phone}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="otp">Verification Code</Label>
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Exclusive platform for verified real estate agents
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
