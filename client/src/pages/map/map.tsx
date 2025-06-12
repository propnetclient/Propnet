import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Layers, Phone, Eye, Filter } from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { formatPrice, getListingTypeBadgeColor } from "@/utils/formatters";

interface Property {
  id: number;
  title: string;
  propertyType: string;
  transactionType: string;
  price: string;
  location: string;
  fullAddress?: string;
  size: string;
  sizeUnit: string;
  bhk?: number;
  owner: {
    name: string;
    phone: string;
  };
  latitude?: number;
  longitude?: number;
}

export default function Map() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied:", error);
        }
      );
    }
  }, []);

  // Generate coordinates for properties based on location
  const getPropertyCoordinates = (property: Property, index: number) => {
    if (property.latitude && property.longitude) {
      return { lat: property.latitude, lng: property.longitude };
    }
    
    // Distribute properties in a grid pattern for visualization
    const gridSize = Math.ceil(Math.sqrt(Array.isArray(properties) ? properties.length : 0));
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    return {
      lat: 19.0760 + (row * 0.02), // Mumbai base coordinate
      lng: 72.8777 + (col * 0.02)
    };
  };

  const filteredProperties = Array.isArray(properties) ? properties.filter((property: Property) => {
    if (filterType === "all") return true;
    return property.transactionType === filterType;
  }) : [];

  const propertyTypes = ["all", "sale", "rent"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Property Map</h1>
            <p className="text-sm text-neutral-600">{filteredProperties.length} properties found</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (userLocation) {
                console.log("Centering on user location:", userLocation);
              }
            }}
          >
            <Navigation size={16} className="mr-1" />
            My Location
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-neutral-600" />
          <div className="flex space-x-2">
            {propertyTypes.map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[60vh] bg-neutral-100">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center text-neutral-500">
            <MapPin size={48} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-sm">Interactive Map View</p>
            <p className="text-xs text-neutral-400">Showing {filteredProperties.length} properties</p>
          </div>
        </div>

        {/* Property Markers */}
        <div className="absolute inset-0">
          {filteredProperties.map((property: Property, index: number) => {
            const position = {
              left: `${20 + (index % 6) * 12}%`,
              top: `${20 + Math.floor(index / 6) * 15}%`
            };

            return (
              <div
                key={property.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                style={position}
                onClick={() => setSelectedProperty(property)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg ${
                  property.transactionType === 'sale' ? 'bg-blue-500' : 'bg-green-500'
                } ${selectedProperty?.id === property.id ? 'ring-4 ring-white' : ''}`}>
                  {property.bhk || 'P'}
                </div>
                {selectedProperty?.id === property.id && (
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">
                        {property.title}
                      </div>
                      <div className="text-xs text-neutral-600 mb-2">
                        {property.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">
                          {formatPrice(property.price, property.transactionType)}
                        </span>
                        <Badge 
                          className={`text-xs ${getListingTypeBadgeColor(property.transactionType)}`}
                        >
                          {property.transactionType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button variant="outline" size="sm" className="bg-white">
            <Layers size={16} />
          </Button>
        </div>
      </div>

      {/* Property List */}
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Properties in View</h2>
        <div className="space-y-3">
          {filteredProperties.slice(0, 5).map((property: Property) => (
            <Card 
              key={property.id} 
              className={`cursor-pointer transition-all ${
                selectedProperty?.id === property.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedProperty(property)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-neutral-900 text-sm">{property.title}</h3>
                      <Badge className={`text-xs ${getListingTypeBadgeColor(property.transactionType)}`}>
                        {property.transactionType}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 mb-2">{property.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(property.price, property.transactionType)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Phone size={12} className="mr-1" />
                          Contact
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye size={12} className="mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>
      
      <BottomNavigation />
    </div>
  );
}