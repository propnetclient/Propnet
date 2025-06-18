import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Upload, X, Plus } from "lucide-react";

const AREA_OF_EXPERTISE_OPTIONS = [
  "Residential Sales",
  "Commercial Sales", 
  "Residential Rentals",
  "Commercial Rentals",
  "Investment Properties",
  "Luxury Properties",
  "Affordable Housing",
  "Plot/Land Sales",
  "Industrial Properties",
  "Warehouse/Logistics",
  "Office Spaces",
  "Retail Spaces",
  "Co-working Spaces",
  "Villa/Independent Houses",
  "Apartments/Flats",
  "Builder Relations",
  "Property Management",
  "Legal Documentation",
  "Property Valuation",
  "Market Research"
];

const AHMEDABAD_AREAS = [
  "Bopal", "Prahlad Nagar", "Satellite", "Vastrapur", "Thaltej", "Bodakdev", 
  "Ambawadi", "Navrangpura", "C.G. Road", "Ashram Road", "Maninagar", 
  "Ghatlodia", "Shela", "South Bopal", "Sindhu Bhavan Road", "S.G. Highway",
  "Sarkhej", "Juhapura", "Vejalpur", "Chandkheda", "Motera", "Sabarmati",
  "Paldi", "Ellis Bridge", "Mithakhali", "Gurukul", "Drive-in Road",
  "Jodhpur", "Judges Bungalow", "Law Garden", "Nehru Nagar", "Sola",
  "Science City Road", "Prahladnagar", "Iscon", "Adani Shantigram"
];

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    // Personal Information
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    
    // Agency Information  
    agencyName: "",
    reraId: "",
    
    // Professional Information
    city: "Ahmedabad",
    experience: "",
    website: "",
    
    // Arrays for multi-select
    areaOfExpertise: [] as string[],
    workingRegions: [] as string[],
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  // For adding custom areas/regions
  const [customExpertise, setCustomExpertise] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [filteredRegions, setFilteredRegions] = useState<string[]>([]);

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          formDataToSend.append(key, JSON.stringify(data[key]));
        } else {
          formDataToSend.append(key, data[key]);
        }
      });
      
      // Add profile photo if selected
      if (profilePhoto) {
        formDataToSend.append('profilePhoto', profilePhoto);
      }
      
      return apiRequest("POST", "/api/auth/complete-profile", formDataToSend);
    },
    onSuccess: (response: any) => {
      if (response.user) {
        updateUser(response.user);
      }
      toast({
        title: "Profile Completed!",
        description: "Welcome to PropNet. You can now access all features.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Profile Update Failed",
        description: error.message || "Please check all required fields",
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addExpertise = (expertise: string) => {
    if (expertise && !formData.areaOfExpertise.includes(expertise)) {
      setFormData(prev => ({
        ...prev,
        areaOfExpertise: [...prev.areaOfExpertise, expertise]
      }));
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      areaOfExpertise: prev.areaOfExpertise.filter(item => item !== expertise)
    }));
  };

  const addCustomExpertise = () => {
    if (customExpertise.trim()) {
      addExpertise(customExpertise.trim());
      setCustomExpertise("");
    }
  };

  const addWorkingRegion = (region: string) => {
    if (region && !formData.workingRegions.includes(region)) {
      setFormData(prev => ({
        ...prev,
        workingRegions: [...prev.workingRegions, region]
      }));
    }
  };

  const removeWorkingRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      workingRegions: prev.workingRegions.filter(item => item !== region)
    }));
  };

  const addCustomRegion = () => {
    if (customRegion.trim()) {
      addWorkingRegion(customRegion.trim());
      setCustomRegion("");
      setFilteredRegions([]);
    }
  };

  const handleRegionInputChange = (value: string) => {
    setCustomRegion(value);
    if (value.length > 0) {
      const filtered = AHMEDABAD_AREAS.filter(area => 
        area.toLowerCase().includes(value.toLowerCase()) &&
        !formData.workingRegions.includes(area)
      );
      setFilteredRegions(filtered);
    } else {
      setFilteredRegions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = {
      name: "Full Name",
      email: "Email", 
      agencyName: "Agency Name",
      reraId: "RERA ID",
      areaOfExpertise: "Area of Expertise",
      workingRegions: "Working Regions"
    };

    const missing = [];
    if (!formData.name.trim()) missing.push("Full Name");
    if (!formData.email.trim()) missing.push("Email");
    if (!formData.agencyName.trim()) missing.push("Agency Name");
    if (!formData.reraId.trim()) missing.push("RERA ID");
    if (formData.areaOfExpertise.length === 0) missing.push("Area of Expertise");
    if (formData.workingRegions.length === 0) missing.push("Working Regions");

    if (missing.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    profileMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <p className="text-blue-100 mt-2">
              Please fill all required information to access PropNet
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Profile Photo Section */}
              <div className="text-center">
                <Label className="text-lg font-semibold text-gray-700 mb-4 block">
                  Profile Photo (Recommended)
                </Label>
                <div className="flex flex-col items-center space-y-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview("");
                          setProfilePhoto(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="profilePhoto"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('profilePhoto')?.click()}
                  >
                    Choose Photo
                  </Button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Personal Information <span className="text-red-500">*</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
                    placeholder="Brief description about yourself..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Agency Information */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Agency Information <span className="text-red-500">*</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agencyName">RERA Registered Agency Name *</Label>
                    <Input
                      id="agencyName"
                      value={formData.agencyName}
                      onChange={(e) => setFormData(prev => ({...prev, agencyName: e.target.value}))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reraId">RERA ID *</Label>
                    <Input
                      id="reraId"
                      value={formData.reraId}
                      onChange={(e) => setFormData(prev => ({...prev, reraId: e.target.value}))}
                      placeholder="e.g., RERA/GUJ/AHMD/..."
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Professional Information <span className="text-red-500">*</span>
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience (Optional)</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({...prev, experience: e.target.value}))}
                      placeholder="e.g., 5 years"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({...prev, website: e.target.value}))}
                    placeholder="https://your-website.com"
                    className="mt-1"
                  />
                </div>

                {/* Area of Expertise */}
                <div className="mb-6">
                  <Label className="text-base font-medium">Area of Expertise *</Label>
                  <p className="text-sm text-gray-600 mb-3">Select or add your areas of expertise</p>
                  
                  {/* Selected Expertise */}
                  {formData.areaOfExpertise.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.areaOfExpertise.map((expertise) => (
                        <Badge key={expertise} variant="secondary" className="bg-yellow-100">
                          {expertise}
                          <button
                            type="button"
                            onClick={() => removeExpertise(expertise)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Expertise Options */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {AREA_OF_EXPERTISE_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={formData.areaOfExpertise.includes(option) ? "default" : "outline"}
                        size="sm"
                        onClick={() => 
                          formData.areaOfExpertise.includes(option) 
                            ? removeExpertise(option)
                            : addExpertise(option)
                        }
                        className="justify-start text-left text-xs"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Expertise Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom expertise..."
                      value={customExpertise}
                      onChange={(e) => setCustomExpertise(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomExpertise())}
                    />
                    <Button type="button" onClick={addCustomExpertise} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Working Regions */}
                <div>
                  <Label className="text-base font-medium">Working Regions *</Label>
                  <p className="text-sm text-gray-600 mb-3">Add areas where you actively work</p>
                  
                  {/* Selected Regions */}
                  {formData.workingRegions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.workingRegions.map((region) => (
                        <Badge key={region} variant="secondary" className="bg-green-100">
                          {region}
                          <button
                            type="button"
                            onClick={() => removeWorkingRegion(region)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Region Input with Suggestions */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type to search Ahmedabad areas..."
                        value={customRegion}
                        onChange={(e) => handleRegionInputChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRegion())}
                      />
                      <Button type="button" onClick={addCustomRegion} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Suggestions Dropdown */}
                    {filteredRegions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredRegions.map((region) => (
                          <button
                            key={region}
                            type="button"
                            onClick={() => {
                              addWorkingRegion(region);
                              setCustomRegion("");
                              setFilteredRegions([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={profileMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-12 py-3"
                >
                  {profileMutation.isPending ? "Completing Profile..." : "Complete Profile & Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}