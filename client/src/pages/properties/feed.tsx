import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { UserCircle, Plus, Search, Filter, X, Sparkles } from "lucide-react";
import CompactPropertyCard from "@/components/ui/compact-property-card";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/utils/formatters";

export default function PropertyFeed() {
  const [selectedTab, setSelectedTab] = useState("sale");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Filter state
  const [filters, setFilters] = useState({
    transactionType: "",
    propertyType: "",
    bhk: "",
    location: "",
    listingType: "",
    minPrice: "",
    maxPrice: "",
  });
  const [priceRange, setPriceRange] = useState([0, 10000000]);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  const filteredProperties = Array.isArray(properties) ? properties.filter((property: any) => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter (transaction type)
    const matchesTab = selectedTab === "all" || property.transactionType === selectedTab;

    // Advanced filters
    const matchesTransactionType = !filters.transactionType || 
      property.transactionType === filters.transactionType;
    const matchesPropertyType = !filters.propertyType || 
      property.propertyType === filters.propertyType;
    const matchesBHK = !filters.bhk || 
      property.bhk?.toString() === filters.bhk;
    const matchesLocation = !filters.location || 
      property.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesListingType = !filters.listingType || 
      property.listingType === filters.listingType;

    const propertyPrice = parseFloat(property.price.replace(/[^\d.]/g, ''));
    const matchesPriceRange = propertyPrice >= priceRange[0] && propertyPrice <= priceRange[1];

    return matchesSearch && matchesTab && matchesTransactionType && matchesPropertyType && 
           matchesBHK && matchesLocation && matchesListingType && matchesPriceRange;
  }) : [];

  const clearFilters = () => {
    setFilters({
      transactionType: "",
      propertyType: "",
      bhk: "",
      location: "",
      listingType: "",
      minPrice: "",
      maxPrice: "",
    });
    setPriceRange([0, 10000000]);
    setSearchQuery("");
    setShowFilters(false);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + 
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Properties</h1>
              <p className="text-sm text-neutral-500">
                {filteredProperties.length} listings available
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/quickpost")}
                className="flex items-center space-x-1 text-primary border-primary hover:bg-primary/5"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">QuickPost</span>
              </Button>
              <button 
                className="p-2 text-neutral-400"
                onClick={() => setLocation("/profile")}
              >
                <UserCircle size={28} />
              </button>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by address, city, or ZIP code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 border-gray-200 focus:border-primary bg-gray-50 focus:bg-white transition-colors rounded-lg"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-3 min-w-fit rounded-lg ${
                activeFiltersCount > 0 ? 'border-primary text-primary bg-primary/5' : 'bg-gray-50'
              }`}
            >
              <Filter size={16} />
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Transaction Type Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedTab("sale")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedTab === "sale"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              For Sale
            </button>
            <button
              onClick={() => setSelectedTab("rent")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedTab === "rent"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              For Rent
            </button>
            <button
              onClick={() => setSelectedTab("all")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <Card className="mx-4 mb-3 border-t-0 rounded-t-none shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* Quick Filters Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Select value={filters.transactionType} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, transactionType: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Buy/Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.propertyType} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, propertyType: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Shop">Shop</SelectItem>
                    <SelectItem value="Plot">Plot</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.bhk} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, bhk: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="BHK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                    <SelectItem value="5">5+ BHK</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.listingType} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, listingType: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Listing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                    <SelectItem value="colisting">Co-Listing</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range: {formatPrice(priceRange[0].toString(), filters.transactionType || 'sale')} - {formatPrice(priceRange[1].toString(), filters.transactionType || 'sale')}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={10000000}
                  min={0}
                  step={50000}
                  className="w-full"
                />
              </div>

              {/* Location Filter */}
              <div>
                <Input
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={clearFilters} size="sm" className="text-sm">
                    <X size={14} className="mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Property List */}
      <div className="flex-1 px-4 py-4">
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Properties Found</h3>
            <p className="text-neutral-500 mb-4">
              {selectedTab === "all" 
                ? "Be the first to add a property to the network"
                : `No ${selectedTab === "sale" ? "sale" : "rental"} properties available`
              }
            </p>
            <Button onClick={() => setLocation("/add-property")}>
              Add Property
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProperties.map((property: any) => (
              <CompactPropertyCard 
                key={property.id} 
                property={property}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-20 touch-target"
        onClick={() => setLocation("/add-property")}
      >
        <Plus size={24} />
      </button>

      <BottomNavigation />
    </div>
  );
}
