import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Wand2, FileText, Upload, Eye, Edit3, Trash2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPropertySchema } from "@shared/schema";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { z } from "zod";

interface ExtractedProperty {
  title?: string;
  propertyType?: string;
  transactionType?: string;
  price?: string;
  rentFrequency?: string;
  size?: string;
  sizeUnit?: string;
  location?: string;
  fullAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  commissionTerms?: string;
  bhk?: number;
  flatNumber?: string;
  floorNumber?: string;
  buildingSociety?: string;
  description?: string;
  confidence?: number;
  listingType?: string;
}

const propertyFormSchema = z.object({
  title: z.string().optional(),
  propertyType: z.string().optional(),
  transactionType: z.enum(["sale", "rent"]).optional(),
  price: z.string().optional(),
  rentFrequency: z.enum(["monthly", "yearly"]).optional(),
  size: z.string().optional(),
  sizeUnit: z.string().optional(),
  location: z.string().optional(),
  fullAddress: z.string().optional(),
  flatNumber: z.string().optional(),
  floorNumber: z.string().optional(),
  buildingSociety: z.string().optional(),
  description: z.string().optional(),
  bhk: z.number().optional(),
  listingType: z.enum(["exclusive", "shared", "co-listing"]).optional(),
  isPubliclyVisible: z.boolean().optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  commissionTerms: z.string().optional(),
  scopeOfWork: z.array(z.string()).optional(),
});

export default function QuickPost() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    setLocation("/");
    return null;
  }

  const [inputText, setInputText] = useState("");
  const [extractedProperties, setExtractedProperties] = useState<ExtractedProperty[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<ExtractedProperty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      propertyType: "",
      transactionType: "sale",
      price: "",
      rentFrequency: "monthly",
      size: "",
      sizeUnit: "sq.ft",
      location: "",
      fullAddress: "",
      flatNumber: "",
      floorNumber: "",
      buildingSociety: "",
      description: "",
      bhk: 0,
      listingType: "shared",
      isPubliclyVisible: true,
      ownerName: "",
      ownerPhone: "",
      commissionTerms: "",
      scopeOfWork: [],
    },
  });

  const extractMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/quickpost/extract", {
        text: text
      });
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedProperties(data.properties || []);
      toast({
        title: "Properties Extracted",
        description: `Found ${data.count} properties from your text.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description: error?.response?.data?.message || "Failed to extract properties from text.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (properties: ExtractedProperty[]) => {
      const response = await apiRequest("POST", "/api/quickpost/create", {
        properties: properties
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      
      toast({
        title: "Properties Created",
        description: `Successfully created ${data.created} out of ${data.total} properties.`,
      });
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some Properties Failed",
          description: `${data.errors.length} properties could not be created due to missing information.`,
          variant: "destructive",
        });
      }
      
      // Clear the form and extracted properties
      setInputText("");
      setExtractedProperties([]);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error?.response?.data?.message || "Failed to create properties.",
        variant: "destructive",
      });
    },
  });

  const handleExtract = () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter property text to extract listings.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    extractMutation.mutate(inputText);
    setIsExtracting(false);
  };

  const handleEdit = (property: ExtractedProperty) => {
    setSelectedProperty(property);
    
    // Populate form with extracted data
    form.reset({
      title: property.title || "",
      propertyType: property.propertyType || "",
      transactionType: (property.transactionType as "sale" | "rent") || "sale",
      price: property.price || "",
      rentFrequency: (property.rentFrequency as "monthly" | "yearly") || "monthly",
      size: property.size || "",
      sizeUnit: property.sizeUnit || "sq.ft",
      location: property.location || "",
      fullAddress: property.fullAddress || "",
      flatNumber: property.flatNumber || "",
      floorNumber: property.floorNumber || "",
      buildingSociety: property.buildingSociety || "",
      description: property.description || "",
      bhk: property.bhk || 0,
      listingType: (property.listingType as "exclusive" | "shared" | "co-listing") || "shared",
      isPubliclyVisible: property.listingType !== "exclusive",
      ownerName: property.ownerName || "",
      ownerPhone: property.ownerPhone || "",
      commissionTerms: property.commissionTerms || "",
      scopeOfWork: [],
    });
    
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (values: z.infer<typeof propertyFormSchema>) => {
    if (selectedProperty) {
      const updatedProperty = { ...selectedProperty, ...values };
      const updatedProperties = extractedProperties.map(p => 
        p === selectedProperty ? updatedProperty : p
      );
      setExtractedProperties(updatedProperties);
      setIsEditDialogOpen(false);
      setSelectedProperty(null);
      
      toast({
        title: "Property Updated",
        description: "Property details have been updated successfully.",
      });
    }
  };

  const handleRemove = (property: ExtractedProperty) => {
    setExtractedProperties(prev => prev.filter(p => p !== property));
    toast({
      title: "Property Removed",
      description: "Property has been removed from the list.",
    });
  };

  const handleCreateAll = () => {
    if (extractedProperties.length === 0) {
      toast({
        title: "No Properties",
        description: "Please extract properties first before creating listings.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(extractedProperties);
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const percentage = Math.round(confidence * 100);
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let color = "bg-green-100 text-green-800";
    
    if (percentage < 60) {
      variant = "destructive";
      color = "bg-red-100 text-red-800";
    } else if (percentage < 80) {
      variant = "secondary";
      color = "bg-yellow-100 text-yellow-800";
    }
    
    return (
      <Badge variant={variant} className={color}>
        {percentage}% confidence
      </Badge>
    );
  };

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
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">QuickPost</h2>
              <p className="text-xs text-neutral-500">AI-powered property extraction</p>
            </div>
          </div>
          <Sparkles size={20} className="text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText size={16} className="mr-2" />
              Paste Property Text
            </CardTitle>
            <p className="text-sm text-neutral-600">
              Paste raw property listings from WhatsApp, emails, or documents. Our AI will extract structured data automatically.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your property text here... For example:
              
2 BHK flat for sale in Bandra West, Mumbai
Price: 2.5 Cr
Area: 1200 sq ft
Contact: Rajesh Kumar - 9876543210
Commission: 2%

3 BHK villa for rent in Koramangala, Bangalore
Monthly rent: 75,000
Size: 2000 sq ft
Owner: Priya Sharma - 9123456789"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleExtract}
                disabled={extractMutation.isPending || isExtracting || !inputText.trim()}
                className="flex-1"
              >
                {extractMutation.isPending || isExtracting ? (
                  <>
                    <Wand2 size={16} className="mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="mr-2" />
                    Extract Properties
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => setInputText("")}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Properties */}
        {extractedProperties.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Extracted Properties ({extractedProperties.length})
                </CardTitle>
                <Button 
                  onClick={handleCreateAll}
                  disabled={createMutation.isPending}
                  size="sm"
                >
                  {createMutation.isPending ? "Creating..." : "Create All Listings"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedProperties.map((property, index) => (
                <Card key={index} className="border border-neutral-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {property.title || `Property ${index + 1}`}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{property.propertyType}</Badge>
                          <Badge variant="outline">{property.transactionType}</Badge>
                          {property.bhk && <Badge variant="outline">{property.bhk} BHK</Badge>}
                          {getConfidenceBadge(property.confidence)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(property)}>
                          <Edit3 size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRemove(property)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-500">Price:</span>
                        <span className="ml-2 font-medium">{property.price}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Size:</span>
                        <span className="ml-2">{property.size} {property.sizeUnit}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Location:</span>
                        <span className="ml-2">{property.location}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Owner:</span>
                        <span className="ml-2">{property.ownerName}</span>
                      </div>
                    </div>

                    {property.description && (
                      <p className="text-sm text-neutral-600 mt-3 p-2 bg-neutral-50 rounded">
                        {property.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property Details</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Beautiful 2 BHK Apartment..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transaction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input placeholder="2500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Bandra West, Mumbai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation />
    </div>
  );
}