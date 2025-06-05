import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Filter, MapPin, Home, Building2, TrendingUp, SlidersHorizontal, X, Plus, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import EnhancedPropertyCard from "@/components/ui/enhanced-property-card";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPropertyRequirementSchema } from "@shared/schema";
import type { Property, PropertyRequirement } from "@shared/schema";
import { z } from "zod";

const requirementFormSchema = insertPropertyRequirementSchema.extend({
  validUntil: z.string().optional(),
});

export default function PropertySearch() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [locationFilter, setLocationFilter] = useState("");
  const [bhk, setBhk] = useState("");
  const [listingType, setListingType] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ["/api/property-requirements"],
  });

  const form = useForm<z.infer<typeof requirementFormSchema>>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      title: "",
      propertyType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      description: "",
      validUntil: "",
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requirementFormSchema>) => {
      const { validUntil, ...requirementData } = data;
      const payload = {
        ...requirementData,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      };
      return apiRequest("POST", "/api/property-requirements", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-requirements"] });
      setIsRequirementDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Your property requirement has been posted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post requirement. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Advanced filtering logic
  const filteredProperties = (properties as any[]).filter((property: any) => {
    const matchesSearch = property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !propertyType || property.propertyType === propertyType;
    const matchesLocation = !locationFilter || property.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesBhk = !bhk || property.bhk?.toString() === bhk || `${property.bhk} BHK` === bhk;
    const matchesListingType = !listingType || property.listingType === listingType;
    
    // Price filtering with range
    const priceStr = property.price?.toString() || '0';
    const price = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
    const priceInLakhs = price / 100000; // Convert to lakhs
    const matchesPrice = priceInLakhs >= priceRange[0] && priceInLakhs <= (priceRange[1] === 200 ? Infinity : priceRange[1]);
    
    return matchesSearch && matchesType && matchesLocation && matchesBhk && matchesListingType && matchesPrice;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case "price-low":
        const priceA = parseFloat((a.price?.toString() || '0').replace(/[^\d.]/g, '')) || 0;
        const priceB = parseFloat((b.price?.toString() || '0').replace(/[^\d.]/g, '')) || 0;
        return priceA - priceB;
      case "price-high":
        const priceHighA = parseFloat((a.price?.toString() || '0').replace(/[^\d.]/g, '')) || 0;
        const priceHighB = parseFloat((b.price?.toString() || '0').replace(/[^\d.]/g, '')) || 0;
        return priceHighB - priceHighA;
      case "recent":
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const filteredRequirements = (requirements as any[]).filter((requirement: any) => {
    const matchesSearch = requirement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         requirement.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         requirement.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !propertyType || requirement.propertyType === propertyType;
    const matchesLocation = !locationFilter || requirement.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setPropertyType("");
    setPriceRange([0, 200]);
    setLocationFilter("");
    setBhk("");
    setListingType("");
    setSortBy("recent");
  };

  const activeFiltersCount = [propertyType, locationFilter, bhk, listingType].filter(Boolean).length +
    (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button 
            className="text-primary mr-4"
            onClick={() => setLocation("/feed")}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Search & Requirements</h2>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <Input
              placeholder="Search properties and requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3 overflow-x-auto">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 whitespace-nowrap"
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 bg-primary text-white text-xs min-w-[20px] h-5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isRequirementDialogOpen} onOpenChange={setIsRequirementDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center space-x-2 whitespace-nowrap">
                  <Plus size={16} />
                  <span>Post Requirement</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle>Post Property Requirement</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createRequirementMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirement Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Looking for 2 BHK apartment..." {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
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
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter area or city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Price</FormLabel>
                            <FormControl>
                              <Input placeholder="₹50 Lakhs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Price</FormLabel>
                            <FormControl>
                              <Input placeholder="₹1 Crore" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your requirements in detail..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsRequirementDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createRequirementMutation.isPending}
                        className="flex-1"
                      >
                        {createRequirementMutation.isPending ? "Posting..." : "Post Requirement"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="mx-6 mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Property Type */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Property Type</label>
              <Select value={propertyType} onValueChange={(value) => setPropertyType(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Price Range: ₹{priceRange[0]}L - ₹{priceRange[1]}L {priceRange[1] === 200 ? "+" : ""}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={200}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Location</label>
              <Input
                placeholder="Enter area or city"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            {/* BHK */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">BHK</label>
              <Select value={bhk} onValueChange={(value) => setBhk(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Any BHK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any BHK</SelectItem>
                  <SelectItem value="1 BHK">1 BHK</SelectItem>
                  <SelectItem value="2 BHK">2 BHK</SelectItem>
                  <SelectItem value="3 BHK">3 BHK</SelectItem>
                  <SelectItem value="4+ BHK">4+ BHK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Listing Type</label>
              <Select value={listingType} onValueChange={(value) => setListingType(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Listings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Listings</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                  <SelectItem value="colisting">Co-listing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="flex-1 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-neutral-600">
            {filteredProperties.length} properties found
          </div>
          {(searchQuery || activeFiltersCount > 0) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear search
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">No properties found</h3>
            <p className="text-neutral-500 mb-4">Try adjusting your search criteria</p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((property: any) => (
              <EnhancedPropertyCard 
                key={property.id} 
                property={property}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}