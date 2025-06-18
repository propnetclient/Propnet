import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { KeyRound, Shield, CheckCircle2 } from "lucide-react";

interface PinSetupData {
  phone: string;
  pin: string;
  confirmPin: string;
  keepLoggedIn: boolean;
}

export default function SetupPin() {
  const [formData, setFormData] = useState<PinSetupData>({
    phone: "",
    pin: "",
    confirmPin: "",
    keepLoggedIn: false
  });
  const { toast } = useToast();
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();

  // Get phone from authenticated user
  useState(() => {
    if (user?.phone) {
      setFormData(prev => ({ ...prev, phone: user.phone }));
    }
  });

  // PIN setup mutation
  const setupPinMutation = useMutation({
    mutationFn: async (data: { phone: string; pin: string; keepLoggedIn: boolean }) => {
      return apiRequest("/api/pin-auth/setup-pin", "POST", data);
    },
    onSuccess: (data: any) => {
      if (data.user) {
        login(data.user);
      }
      
      toast({
        title: "PIN Setup Complete!",
        description: "Your secure PIN has been created successfully"
      });

      if (data.requiresProfileComplete) {
        setLocation("/auth/complete-profile");
      } else {
        setLocation("/");
      }
    },
    onError: (error) => {
      toast({
        title: "PIN Setup Failed",
        description: error.message || "Failed to set up PIN",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.pin.length < 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be at least 4 digits",
        variant: "destructive"
      });
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "PIN and confirmation do not match",
        variant: "destructive"
      });
      return;
    }

    setupPinMutation.mutate({
      phone: formData.phone,
      pin: formData.pin,
      keepLoggedIn: formData.keepLoggedIn
    });
  };

  const isFormValid = formData.pin.length >= 4 && 
                     formData.pin === formData.confirmPin &&
                     formData.phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            <KeyRound className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your PIN</CardTitle>
          <CardDescription className="text-blue-100">
            Set up a secure 4-6 digit PIN for quick access
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Security Features</span>
            </div>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Your PIN is encrypted and stored securely</li>
              <li>• Use your PIN for quick login instead of OTP</li>
              <li>• Keep this PIN private and memorable</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pin">Create PIN (4-6 digits)</Label>
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
              <p className="text-xs text-gray-500 mt-1">
                Enter 4-6 digits that you can easily remember
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
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
              {formData.confirmPin && (
                <div className="flex items-center mt-1">
                  {formData.pin === formData.confirmPin ? (
                    <div className="flex items-center text-green-600 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      PIN matches
                    </div>
                  ) : (
                    <div className="text-red-500 text-xs">
                      PIN does not match
                    </div>
                  )}
                </div>
              )}
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
                Keep me logged in on this device
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={!isFormValid || setupPinMutation.isPending}
            >
              {setupPinMutation.isPending ? "Creating PIN..." : "Create PIN"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <Link href="/support">
                <a className="text-blue-600 hover:text-blue-800">
                  Contact Support
                </a>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}