import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Building2, MapPin, Clock, Shield, Eye, EyeOff, Phone, User, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPropertySchema } from "@shared/schema";
import FileUpload from "@/components/ui/file-upload";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { z } from "zod";

const propertyFormSchema = insertPropertySchema.extend({
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().min(10, "Valid phone number is required"),
  commissionTerms: z.string().optional(),
  scopeOfWork: z.array(z.string()).optional(),
  agreementDocument: z.string().optional(),
});

export default function MyListings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [agreementFiles, setAgreementFiles] = useState<File[]>([]);
  const [showOwnerPhone, setShowOwnerPhone] = useState<{[key: number]: boolean}>({});

  const { data: myProperties = [], isLoading } = useQuery({
    queryKey: ["/api/my-properties"],
  });

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      propertyType: "",
      price: "",
      size: "",
      location: "",
      fullAddress: "",
      flatNumber: "",
      floorNumber: "",
      buildingSociety: "",
      description: "",
      bhk: 0,
      listingType: "exclusive",
      ownerName: "",
      ownerPhone: "",
      commissionTerms: "",
      scopeOfWork: [],
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsAddDialogOpen(false);
      form.reset();
      setSelectedFiles([]);
      setAgreementFiles([]);
      toast({
        title: "Property Listed Successfully",
        description: "Owner approval request has been sent. Property will go live after approval.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create property listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: z.infer<typeof propertyFormSchema>) => {
    const formData = new FormData();
    
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'scopeOfWork' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    selectedFiles.forEach(file => {
      formData.append('photos', file);
    });

    if (agreementFiles.length > 0) {
      formData.append('agreementDocument', agreementFiles[0]);
    }

    createPropertyMutation.mutate(formData);
  };

  const toggleOwnerPhone = (propertyId: number) => {
    setShowOwnerPhone(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1" />Pending Approval</Badge>;
    }
  };

  const scopeOfWorkOptions = [
    "Property Viewing Coordination",
    "Marketing & Promotion",
    "Documentation Support",
    "Negotiation Assistance",
    "Legal Compliance Check",
    "Market Analysis",
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button 
              className="text-primary mr-4"
              onClick={() => setLocation("/feed")}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">My Listings</h2>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Plus size={16} />
                <span>Add Listing</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Property Listing</DialogTitle>
                <p className="text-sm text-neutral-600">
                  <Shield size={14} className="inline mr-1" />
                  Your data is secure. All sensitive information is stored safely and never displayed without explicit permission.
                </p>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Property Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Property Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Beautiful 2 BHK Apartment..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="propertyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Apartment">Apartment</SelectItem>
                                  <SelectItem value="Villa">Villa</SelectItem>
                                  <SelectItem value="Commercial">Commercial</SelectItem>
                                  <SelectItem value="Plot">Plot</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bhk"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>BHK (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="2" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input placeholder="₹50 Lakhs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size (sq. ft.)</FormLabel>
                              <FormControl>
                                <Input placeholder="1200" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="fullAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Complete address with landmarks..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="flatNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Flat/Unit No.</FormLabel>
                              <FormControl>
                                <Input placeholder="A-101" {...field} />
                              </FormControl>
                              <p className="text-xs text-neutral-500">Encrypted & used only for verification</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="floorNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Floor No.</FormLabel>
                              <FormControl>
                                <Input placeholder="3rd Floor" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="buildingSociety"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Building/Society</FormLabel>
                              <FormControl>
                                <Input placeholder="Sunshine Residency" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location (Area, City)</FormLabel>
                            <FormControl>
                              <Input placeholder="Bandra West, Mumbai" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Property details, amenities, nearby facilities..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium">Property Photos (Up to 10)</label>
                        <FileUpload 
                          onFilesChange={setSelectedFiles}
                          maxFiles={10}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Listing Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Listing Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="listingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="exclusive"
                                    value="exclusive"
                                    checked={field.value === "exclusive"}
                                    onChange={() => field.onChange("exclusive")}
                                  />
                                  <label htmlFor="exclusive" className="text-sm font-medium">
                                    Exclusive - Only I can list and share it
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="colisting"
                                    value="colisting"
                                    checked={field.value === "colisting"}
                                    onChange={() => field.onChange("colisting")}
                                  />
                                  <label htmlFor="colisting" className="text-sm font-medium">
                                    Allow Co-Listing - Multiple agents can list with permission
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="shared"
                                    value="shared"
                                    checked={field.value === "shared"}
                                    onChange={() => field.onChange("shared")}
                                  />
                                  <label htmlFor="shared" className="text-sm font-medium">
                                    Shared Within Network - Platform-controlled visibility
                                  </label>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Owner Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Shield size={16} className="mr-2" />
                        Owner Details (Encrypted & Secure)
                      </CardTitle>
                      <p className="text-xs text-neutral-600">
                        Owner will receive a consent request with clear terms
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Property owner's full name" {...field} />
                            </FormControl>
                            <p className="text-xs text-neutral-500">This information is encrypted and never shared publicly</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 9876543210" {...field} />
                            </FormControl>
                            <p className="text-xs text-neutral-500">Required for verification and trust</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="commissionTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Terms</FormLabel>
                            <FormControl>
                              <Input placeholder="2% of sale value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="text-sm font-medium">Scope of Work</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {scopeOfWorkOptions.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={option}
                                checked={form.watch('scopeOfWork')?.includes(option)}
                                onCheckedChange={(checked) => {
                                  const current = form.getValues('scopeOfWork') || [];
                                  if (checked) {
                                    form.setValue('scopeOfWork', [...current, option]);
                                  } else {
                                    form.setValue('scopeOfWork', current.filter(item => item !== option));
                                  }
                                }}
                              />
                              <label htmlFor={option} className="text-xs">{option}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Agreement Document (Optional)</label>
                        <FileUpload 
                          onFilesChange={setAgreementFiles}
                          maxFiles={1}
                        />
                        <p className="text-xs text-neutral-500 mt-1">Upload agent agreement or authorization letter</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPropertyMutation.isPending}
                      className="flex-1"
                    >
                      {createPropertyMutation.isPending ? "Creating..." : "Create Listing"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : myProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">No listings yet</h3>
            <p className="text-neutral-500 mb-4">Create your first property listing to get started</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Listing
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(myProperties as any[]).map((property: any) => (
              <Card key={property.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">{property.title}</h3>
                    <div className="flex items-center text-sm text-neutral-500 space-x-4 mb-2">
                      <span className="flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {property.location}
                      </span>
                      <span className="flex items-center">
                        <Building2 size={12} className="mr-1" />
                        {property.propertyType}
                      </span>
                      <span className="font-medium text-primary">{property.price}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(property.ownerApprovalStatus)}
                      <Badge variant="outline" className="text-xs">
                        {property.listingType}
                      </Badge>
                    </div>
                  </div>
                </div>

                {property.description && (
                  <p className="text-sm text-neutral-600 mb-3">{property.description}</p>
                )}

                {/* Owner Details (Masked) */}
                <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-neutral-700">Owner Details</h4>
                    <Shield size={14} className="text-green-600" />
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center">
                      <User size={12} className="mr-2 text-neutral-400" />
                      <span>{property.ownerName}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone size={12} className="mr-2 text-neutral-400" />
                      <span>
                        {showOwnerPhone[property.id] 
                          ? property.ownerPhone 
                          : `${property.ownerPhone?.slice(0, 3)}****${property.ownerPhone?.slice(-2)}`
                        }
                      </span>
                      <button
                        onClick={() => toggleOwnerPhone(property.id)}
                        className="ml-2 text-primary hover:text-primary/80"
                      >
                        {showOwnerPhone[property.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Listed {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                    {property.approvalTimestamp && (
                      <span className="flex items-center">
                        <CheckCircle size={12} className="mr-1" />
                        Approved {new Date(property.approvalTimestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {property.ownerApprovalStatus === 'approved' && (
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      <Download size={12} className="mr-1" />
                      Generate PDF
                    </Button>
                  )}
                </div>

                {property.ownerApprovalStatus === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-800 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      Waiting for owner approval. You'll be notified once the owner responds.
                    </p>
                  </div>
                )}

                {property.ownerApprovalStatus === 'rejected' && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-800 flex items-center">
                      <XCircle size={12} className="mr-1" />
                      Owner declined this listing. Please contact the owner directly.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}