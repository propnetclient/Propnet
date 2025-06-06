import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, MessageCircle, Phone, Building2, MapPin, Award, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function BrokerDirectory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: brokers, isLoading } = useQuery({
    queryKey: ['/api/broker-directory', { city: cityFilter, specialty: specialtyFilter }],
    enabled: !!user
  });

  const connectMutation = useMutation({
    mutationFn: (receiverId: number) =>
      apiRequest('/api/connections', {
        method: 'POST',
        body: JSON.stringify({ receiverId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    }
  });

  const startChatMutation = useMutation({
    mutationFn: (participantId: number) =>
      apiRequest('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ participantId })
      }),
    onSuccess: (chat) => {
      setLocation(`/chat/${chat.id}`);
    }
  });

  const filteredBrokers = brokers?.filter((broker: any) => {
    const matchesSearch = broker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         broker.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         broker.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleStartChat = (brokerId: number) => {
    startChatMutation.mutate(brokerId);
  };

  const handleConnect = (brokerId: number) => {
    connectMutation.mutate(brokerId);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view the broker directory</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Broker Directory</h1>
          <p className="text-muted-foreground">Connect with verified real estate professionals</p>
        </div>
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, agency, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Chennai">Chennai</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Specialties</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Luxury">Luxury</SelectItem>
                <SelectItem value="Rentals">Rentals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Broker List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBrokers.map((broker: any) => (
            <Card key={broker.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={broker.profilePhoto} />
                    <AvatarFallback>
                      {broker.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold truncate">{broker.name}</h3>
                      {broker.isVerified && (
                        <Badge variant="default" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {broker.agencyName && (
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Building2 className="h-3 w-3 mr-1" />
                        {broker.agencyName}
                      </div>
                    )}
                    
                    {broker.city && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {broker.city}
                      </div>
                    )}
                  </div>
                </div>

                {broker.areaOfExpertise && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {broker.areaOfExpertise.slice(0, 3).map((area: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                      {broker.areaOfExpertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{broker.areaOfExpertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {broker.experience && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {broker.experience} years experience
                  </p>
                )}

                {broker.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {broker.bio}
                  </p>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleStartChat(broker.id)}
                    disabled={startChatMutation.isPending || broker.id === user.id}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(broker.id)}
                    disabled={connectMutation.isPending || broker.id === user.id}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  
                  {broker.phone && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredBrokers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No brokers found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for more professionals.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Professional Guidelines */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Professional Networking Guidelines
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Connect only for legitimate business purposes</li>
            <li>• Maintain professional communication standards</li>
            <li>• Respect others' time and expertise</li>
            <li>• Report any inappropriate behavior immediately</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}