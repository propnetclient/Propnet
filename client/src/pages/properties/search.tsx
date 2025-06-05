import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, MapPin, Filter, SlidersHorizontal } from "lucide-react";
import PropertyCard from "@/components/ui/property-card";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";

export default function PropertySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  const cities = ["all", "Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad"];
  const propertyTypes = ["all", "Apartment", "Villa", "Commercial", "Plot"];
  const priceRanges = [
    { value: "all", label: "Any Price" },
    { value: "0-50", label: "Under ₹50L" },
    { value: "50-100", label: "₹50L - ₹1Cr" },
    { value: "100-250", label: "₹1Cr - ₹2.5Cr" },
    { value: "250+", label: "Above ₹2.5Cr" }
  ];

  const filteredProperties = properties.filter((property: any) => {
    const matchesSearch = !searchQuery || 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || 
      property.propertyType.toLowerCase() === selectedType.toLowerCase();
    
    const matchesCity = selectedCity === "all" || 
      property.location.toLowerCase().includes(selectedCity.toLowerCase());

    return matchesSearch && matchesType && matchesCity;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold text-neutral-900">Search Properties</h2>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or location..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-2 mb-3">
            <SlidersHorizontal size={16} className="text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filters</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city === "all" ? "All Cities" : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3">
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-neutral-500">
            {filteredProperties.length} properties found
          </span>
          {(searchQuery || selectedType !== "all" || selectedCity !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
                setSelectedCity("all");
                setPriceRange("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MapPin className="text-neutral-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Properties Found</h3>
            <p className="text-neutral-500">
              Try adjusting your search filters or search terms
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((property: any) => (
              <PropertyCard 
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