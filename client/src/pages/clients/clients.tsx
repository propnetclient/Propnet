import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Phone, 
  User, 
  MessageCircle, 
  Plus,
  Building2,
  MapPin,
  Calendar,
  Star,
  Filter
} from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useAuth } from "@/hooks/use-auth";

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  agencyName?: string;
  location?: string;
  totalProperties: number;
  totalRequirements: number;
  lastActivity: string;
  status: 'active' | 'inactive';
  rating?: number;
}

export default function Clients() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);

  // Fetch network users as clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/network-users"],
  });

  // Fetch user conversations to get client interaction data
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const filteredClients = Array.isArray(clients) ? clients.filter((client: any) => {
    const matchesSearch = 
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.agencyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "active" && client.isVerified) ||
      (filterStatus === "inactive" && !client.isVerified);
    
    return matchesSearch && matchesFilter;
  }) : [];

  const getClientStats = (clientId: number) => {
    const clientConversations = Array.isArray(conversations) ? 
      conversations.filter((conv: any) => conv.otherParticipant?.id === clientId) : [];
    
    return {
      totalConversations: clientConversations.length,
      lastMessage: clientConversations[0]?.lastMessage?.content || "No messages",
      lastActivity: clientConversations[0]?.lastMessageAt || "No activity"
    };
  };

  const formatLastActivity = (dateString: string) => {
    if (!dateString || dateString === "No activity") return "No activity";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Clients</h1>
            <p className="text-sm text-neutral-600">{filteredClients.length} network connections</p>
          </div>
          <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus size={16} className="mr-1" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Clients are automatically added when they interact with your properties or send messages.
                  You can also connect with other verified brokers in the network.
                </p>
                <Button onClick={() => setShowAddClientDialog(false)}>
                  Browse Network
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-neutral-600" />
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("inactive")}
            >
              Inactive
            </Button>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="px-6 py-4">
        {filteredClients.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="mx-auto text-neutral-400 mb-4" size={48} />
            <h3 className="font-semibold text-neutral-900 mb-2">No clients yet</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Your network connections and property inquiries will appear here
            </p>
            <Button variant="outline">
              <Building2 size={16} className="mr-2" />
              Browse Properties
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client: any) => {
              const stats = getClientStats(client.id);
              
              return (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-neutral-900 text-sm truncate">
                            {client.name || "Unknown"}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {client.isVerified && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Verified
                              </Badge>
                            )}
                            {client.rating && (
                              <div className="flex items-center">
                                <Star size={12} className="text-yellow-500 fill-current" />
                                <span className="text-xs text-neutral-600 ml-1">{client.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-neutral-600">
                            <Phone size={12} className="inline mr-1" />
                            {client.phone}
                          </p>
                          
                          {client.agencyName && (
                            <p className="text-xs text-neutral-600">
                              <Building2 size={12} className="inline mr-1" />
                              {client.agencyName}
                            </p>
                          )}
                          
                          {client.workingRegions && (
                            <p className="text-xs text-neutral-600">
                              <MapPin size={12} className="inline mr-1" />
                              {client.workingRegions}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-4 text-xs text-neutral-500">
                            <span>
                              <MessageCircle size={12} className="inline mr-1" />
                              {stats.totalConversations} chats
                            </span>
                            <span>
                              <Calendar size={12} className="inline mr-1" />
                              {formatLastActivity(stats.lastActivity)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <MessageCircle size={12} className="mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm">
                              <Phone size={12} className="mr-1" />
                              Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>
      
      <MobileNavigation />
    </div>
  );
}