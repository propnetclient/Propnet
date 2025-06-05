import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function OtpVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [, setLocation] = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { login } = useAuth();

  const phone = localStorage.getItem("tempPhone") || "";

  useEffect(() => {
    if (!phone) {
      setLocation("/");
    }
  }, [phone, setLocation]);

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { phone, otp });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      localStorage.removeItem("tempPhone");
      
      if (data.isKycComplete) {
        setLocation("/feed");
      } else {
        setLocation("/kyc");
      }
      
      toast({
        title: "Success",
        description: "Phone number verified successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length === 6) {
      verifyOtpMutation.mutate({ phone, otp: otpString });
    }
  };

  const isOtpComplete = otp.every(digit => digit !== "");

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 py-4 border-b border-neutral-100">
        <button 
          className="text-primary"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Verify Phone Number</h2>
          <p className="text-neutral-500">
            Enter the 6-digit code sent to <span className="font-medium">+91 {phone}</span>
          </p>
        </div>

        <div className="flex justify-center space-x-3 mb-8">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center border border-neutral-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          disabled={!isOtpComplete || verifyOtpMutation.isPending}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium mb-4"
        >
          {verifyOtpMutation.isPending ? (
            <div className="loading-spinner" />
          ) : (
            "Verify & Continue"
          )}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Didn't receive code?{" "}
          <button className="text-primary font-medium">Resend</button>
        </p>
      </div>
    </div>
  );
}
