import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MapPin, Phone, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContactModal from "@/components/ui/contact-modal";
import { formatPrice, formatArea, getListingTypeBadgeColor, getListingTypeLabel } from "@/utils/formatters";

interface CompactPropertyCardProps {
  property: any;
  currentUserId?: number;
}

export default function CompactPropertyCard({ property, currentUserId }: CompactPropertyCardProps) {
  const [, setLocation] = useLocation();
  const [isLiked, setIsLiked] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { toast } = useToast();

  const isOwner = currentUserId === property.ownerId;
  const hasPhotos = property.photos && property.photos.length > 0;

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Property removed from your favorites" : "Property saved to your favorites",
    });
  };

  const handleShare = () => {
    const formattedPrice = formatPrice(property.price, property.transactionType, property.rentFrequency);
    const formattedArea = formatArea(property.size, property.sizeUnit);
    const shareText = `${property.title}\n📍 ${property.location}\n💰 ${formattedPrice}\n📐 ${formattedArea}`;
    
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Property details copied to clipboard",
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 mb-3">
        <div className="flex">
          {/* Content Section - Left */}
          <div className="flex-1 p-4">
            {/* Property Type Badge */}
            <div className="mb-2">
              <Badge 
                variant="secondary" 
                className="text-xs text-blue-600 bg-blue-50 font-medium"
              >
                {property.propertyType}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="font-bold text-neutral-900 text-lg leading-tight mb-1 line-clamp-2">
              {property.title}
            </h3>

            {/* Property Details */}
            <div className="flex items-center text-blue-600 text-sm mb-3 space-x-4">
              {property.bhk && (
                <span>{property.bhk} bed{property.bhk > 1 ? 's' : ''}</span>
              )}
              {property.bathrooms && (
                <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
              )}
              <span>{formatArea(property.size, property.sizeUnit || 'sq ft')}</span>
            </div>

            {/* Location */}
            <div className="flex items-center text-neutral-600 text-sm mb-2">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>

            {/* Price */}
            <div className="text-xl font-bold text-neutral-900 mb-3">
              {formatPrice(property.price, property.transactionType, property.rentFrequency)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowContactModal(true)}
                className="text-xs px-3 py-1.5 h-auto"
              >
                <Phone size={12} className="mr-1" />
                Contact
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLocation(`/property/${property.id}`)}
                className="text-xs px-3 py-1.5 h-auto"
              >
                <Eye size={12} className="mr-1" />
                Details
              </Button>

              <div className="flex space-x-1 ml-auto">
                <button
                  onClick={handleLike}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isLiked ? "bg-red-50 text-red-500" : "bg-neutral-50 text-neutral-400"
                  } transition-colors`}
                >
                  <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Image Section - Right */}
          <div className="w-32 sm:w-40 flex-shrink-0">
            {hasPhotos ? (
              <div className="relative h-full min-h-[160px]">
                <img 
                  src={`/uploads/${property.photos[0]}`} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.photos && property.photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    +{property.photos.length - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full min-h-[160px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <div className="text-blue-400 text-center">
                  <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">
                      {property.propertyType?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="text-xs text-blue-500">No Image</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listing Type Badge - Bottom */}
        {property.listingType && (
          <div className="px-4 pb-3">
            <Badge className={`text-xs ${getListingTypeBadgeColor(property.listingType)}`}>
              {getListingTypeLabel(property.listingType)}
            </Badge>
          </div>
        )}
      </div>

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyOwner={property.owner}
        propertyTitle={property.title}
      />
    </>
  );
}