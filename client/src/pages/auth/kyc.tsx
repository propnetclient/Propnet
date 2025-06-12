import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function KYC() {
  const [formData, setFormData] = useState({
    name: "",
    reraId: "",
    agencyName: "",
    city: "",
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser } = useAuth();

  const cities = [
    "Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad", 
    "Kolkata", "Ahmedabad", "Gurgaon", "Noida"
  ];

  const submitKycMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/auth/complete-kyc", data);
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data.user);
      setLocation("/dashboard");
      toast({
        title: "Success",
        description: "Profile completed successfully. Welcome to PropNet!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitKycMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== "");

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-lg font-semibold text-neutral-900">Complete Your Profile</h2>
        <p className="text-sm text-neutral-500">Verify your credentials to access the network</p>
      </div>

      <div className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              RERA ID
            </Label>
            <Input
              type="text"
              value={formData.reraId}
              onChange={(e) => handleInputChange("reraId", e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your RERA registration ID"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Agency Name
            </Label>
            <Input
              type="text"
              value={formData.agencyName}
              onChange={(e) => handleInputChange("agencyName", e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your agency name"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              City
            </Label>
            <Select onValueChange={(value) => handleInputChange("city", value)}>
              <SelectTrigger className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <Info className="text-amber-500 mt-1 mr-3" size={20} />
              <div>
                <p className="text-sm text-amber-800">
                  Your credentials will be verified within 24 hours. You'll receive a notification once approved.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || submitKycMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium"
          >
            {submitKycMutation.isPending ? (
              <div className="loading-spinner" />
            ) : (
              "Submit for Verification"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
