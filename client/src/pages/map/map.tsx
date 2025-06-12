import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Layers, Phone, Eye, Filter } from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { formatPrice, getListingTypeBadgeColor } from "@/utils/formatters";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

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
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      window.initMap = initializeMap;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
        zoom: 11,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      setMap(mapInstance);
      setIsMapLoaded(true);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (map && isMapLoaded && Array.isArray(properties)) {
      addMarkersToMap();
    }
  }, [map, isMapLoaded, properties, filterType]);

  const addMarkersToMap = () => {
    if (!map || !window.google) return;

    const filteredProps = properties.filter((property: Property) => {
      if (filterType === "all") return true;
      return property.transactionType === filterType;
    });

    // Clear existing markers
    // (In a real implementation, you'd track markers to clear them)

    filteredProps.forEach((property: Property, index: number) => {
      const coords = getPropertyCoordinates(property, index);
      
      const marker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: map,
        title: property.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: property.transactionType === 'sale' ? '#3B82F6' : '#10B981',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
        label: {
          text: property.bhk?.toString() || 'P',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="min-width: 200px; padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${property.title}</div>
            <div style="color: #666; margin-bottom: 8px; font-size: 14px;">${property.location}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: bold; color: #2563eb;">${formatPrice(property.price, property.transactionType)}</span>
              <span style="background: ${property.transactionType === 'sale' ? '#dbeafe' : '#dcfce7'}; 
                           color: ${property.transactionType === 'sale' ? '#1d4ed8' : '#166534'}; 
                           padding: 2px 8px; border-radius: 4px; font-size: 12px;">${property.transactionType}</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button style="flex: 1; background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">Contact</button>
              <button style="flex: 1; background: #6b7280; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">Details</button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        setSelectedProperty(property);
        infoWindow.open(map, marker);
      });
    });

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
        label: {
          text: '📍',
          fontSize: '16px'
        }
      });
    }
  };

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

      {/* Google Maps */}
      <div className="relative h-[60vh] bg-neutral-100">
        <div 
          ref={mapRef}
          className="h-full w-full"
          style={{ minHeight: '400px' }}
        />
        
        {!isMapLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <MapPin size={48} className="mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">Loading Interactive Map...</p>
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mt-2" />
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white shadow-md"
            onClick={() => {
              if (userLocation && map) {
                map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                map.setZoom(15);
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