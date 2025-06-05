import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserCircle, Plus } from "lucide-react";
import PropertyCard from "@/components/ui/property-card";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";

export default function PropertyFeed() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  const filters = ["All", "Apartment", "Villa", "Commercial", "Plot"];

  const filteredProperties = properties.filter((property: any) => {
    if (selectedFilter === "All") return true;
    return property.propertyType.toLowerCase() === selectedFilter.toLowerCase();
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
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Properties</h1>
            <p className="text-sm text-neutral-500">
              {filteredProperties.length} listings available
            </p>
          </div>
          <button 
            className="p-2 text-neutral-400"
            onClick={() => setLocation("/profile")}
          >
            <UserCircle size={32} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <div className="flex space-x-3 overflow-x-auto pb-2 custom-scrollbar">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 rounded-full text-sm font-medium ${
                  selectedFilter === filter
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-600 border-none"
                }`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Property List */}
      <div className="flex-1 px-6">
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Properties Found</h3>
            <p className="text-neutral-500 mb-4">
              {selectedFilter === "All" 
                ? "Be the first to add a property to the network"
                : `No ${selectedFilter.toLowerCase()} properties available`
              }
            </p>
            <Button onClick={() => setLocation("/add-property")}>
              Add Property
            </Button>
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
