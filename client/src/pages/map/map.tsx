import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Layers, Phone, Eye, Filter } from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { formatPrice, getListingTypeBadgeColor } from "@/utils/formatters";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different property types
const createCustomIcon = (color: string, text: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${text}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

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
    
    // For Gujarat properties, use Ahmedabad as center and distribute around it
    const ahmedabadLat = 23.0225;
    const ahmedabadLng = 72.5714;
    
    // Create a circular distribution around Ahmedabad
    const angle = (index * 2 * Math.PI) / Math.max(Array.isArray(properties) ? properties.length : 1, 1);
    const radius = 0.05 + (index % 3) * 0.02; // Vary radius for different rings
    
    return {
      lat: ahmedabadLat + Math.cos(angle) * radius,
      lng: ahmedabadLng + Math.sin(angle) * radius
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

      {/* Interactive Map */}
      <div className="relative h-[60vh] bg-neutral-100">
        <MapContainer
          center={[23.0225, 72.5714]} // Ahmedabad coordinates
          zoom={11}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createCustomIcon('#10B981', '📍')}
            >
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Property Markers */}
          {filteredProperties.map((property: Property, index: number) => {
            const coords = getPropertyCoordinates(property, index);
            const markerColor = property.transactionType === 'sale' ? '#3B82F6' : '#10B981';
            const markerText = property.bhk?.toString() || 'P';

            return (
              <Marker
                key={property.id}
                position={[coords.lat, coords.lng]}
                icon={createCustomIcon(markerColor, markerText)}
                eventHandlers={{
                  click: () => setSelectedProperty(property),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="font-semibold text-gray-900 mb-2">
                      {property.title}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {property.location}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-blue-600">
                        {formatPrice(property.price, property.transactionType)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        property.transactionType === 'sale' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {property.transactionType}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600">
                        Contact
                      </button>
                      <button className="flex-1 bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600">
                        Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white shadow-md"
            onClick={() => {
              if (userLocation) {
                console.log("Centering on user location:", userLocation);
              }
            }}
          >
            <Navigation size={16} />
          </Button>
          <Button variant="outline" size="sm" className="bg-white shadow-md">
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