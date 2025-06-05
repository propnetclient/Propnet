import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MapPin, Calendar, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedPropertyCardProps {
  property: any;
  currentUserId?: number;
}

export default function EnhancedPropertyCard({ property, currentUserId }: EnhancedPropertyCardProps) {
  const [, setLocation] = useLocation();
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const isOwner = currentUserId === property.ownerId;
  const hasCoAgents = property.coAgents && property.coAgents.length > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Property removed from your favorites" : "Property saved to your favorites",
    });
  };

  const handleShare = () => {
    const shareText = `${property.title}\n📍 ${property.location}\n💰 ${property.price}\n📐 ${property.size}`;
    
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: shareText,
        url: window.location.origin + `/property/${property.id}`,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Link copied",
        description: "Property details copied to clipboard",
      });
    }
  };

  const priceValue = parseFloat(property.price.replace(/[^\d.]/g, ''));
  const isPremium = priceValue > 100; // Above 1Cr

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <img 
          src={property.photos?.[0] ? `/uploads/${property.photos[0]}` : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`text-xs font-medium ${
            property.propertyType === "Villa" 
              ? "bg-purple-100 text-purple-800" 
              : property.propertyType === "Commercial"
              ? "bg-orange-100 text-orange-800"
              : "bg-blue-100 text-blue-800"
          }`}>
            {property.propertyType}
          </Badge>
        </div>

        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
              <TrendingUp size={12} className="mr-1" />
              Premium
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button
            onClick={handleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isLiked ? "bg-red-500 text-white" : "bg-white/80 text-neutral-700"
            } backdrop-blur-sm`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-neutral-700"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Photo Count */}
        {property.photos && property.photos.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
            +{property.photos.length - 1} photos
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-neutral-900 text-lg leading-tight">{property.title}</h3>
          <div className="flex items-center space-x-1 ml-2">
            <Badge className={`text-xs ${
              property.listingType === "exclusive" 
                ? "bg-accent text-white" 
                : "bg-blue-100 text-blue-800"
            }`}>
              {property.listingType === "exclusive" ? "Exclusive" : "Co-listing"}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center text-neutral-600 text-sm mb-3">
          <MapPin size={14} className="mr-1" />
          {property.location}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-primary">{property.price}</div>
          <div className="text-right">
            <div className="text-sm text-neutral-500">{property.size}</div>
            {property.bhk && (
              <div className="text-xs text-neutral-400">{property.bhk} BHK</div>
            )}
          </div>
        </div>
        
        {/* Agent Info */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
          <div className="flex items-center space-x-2">
            {hasCoAgents ? (
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-neutral-500">
                      {property.owner.name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-white">
                      {property.coAgents[0].name?.charAt(0) || "A"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-700">Co-listed</div>
                  <div className="text-xs text-neutral-500">
                    {property.owner.name} & {property.coAgents.length} other{property.coAgents.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-neutral-500">
                    {property.owner.name?.charAt(0) || "A"}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-700">{property.owner.name}</div>
                  <div className="text-xs text-neutral-500">{property.owner.agencyName}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-xs text-neutral-400">
              <Calendar size={12} className="mr-1" />
              {formatDate(property.createdAt)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/property/${property.id}`)}
              className="text-primary font-medium text-sm hover:bg-primary/10"
            >
              <Eye size={14} className="mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}