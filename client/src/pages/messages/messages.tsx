import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Search, 
  Phone, 
  User, 
  Clock,
  Send,
  MoreVertical,
  Building2
} from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";

interface Conversation {
  id: number;
  propertyId: number;
  propertyTitle: string;
  otherUser: {
    id: number;
    name: string;
    phone: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: "inquiry" | "colisting" | "general";
}

interface Message {
  id: number;
  senderId: number;
  message: string;
  timestamp: string;
  type: "text" | "property_share" | "contact_request";
}

export default function Messages() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock conversations data - in real app, this would come from API
  const mockConversations: Conversation[] = [
    {
      id: 1,
      propertyId: 3,
      propertyTitle: "North Park 2 BHK",
      otherUser: {
        id: 2,
        name: "Rajesh Kumar",
        phone: "9876543210"
      },
      lastMessage: "Is this property still available?",
      lastMessageTime: "2 hours ago",
      unreadCount: 2,
      type: "inquiry"
    },
    {
      id: 2,
      propertyId: 4,
      propertyTitle: "Sea View Apartment",
      otherUser: {
        id: 3,
        name: "Priya Sharma",
        phone: "9123456789"
      },
      lastMessage: "Can we schedule a visit tomorrow?",
      lastMessageTime: "5 hours ago",
      unreadCount: 0,
      type: "inquiry"
    },
    {
      id: 3,
      propertyId: 0,
      propertyTitle: "Co-listing Request",
      otherUser: {
        id: 4,
        name: "Amit Patel",
        phone: "9988776655"
      },
      lastMessage: "I'd like to co-list your Bandra property",
      lastMessageTime: "1 day ago",
      unreadCount: 1,
      type: "colisting"
    }
  ];

  // Mock messages for selected conversation
  const mockMessages: Message[] = selectedConversation ? [
    {
      id: 1,
      senderId: selectedConversation.otherUser.id,
      message: "Hi, I'm interested in the property you listed",
      timestamp: "2 hours ago",
      type: "text"
    },
    {
      id: 2,
      senderId: user?.id || 0,
      message: "Thank you for your interest! The property is still available.",
      timestamp: "2 hours ago",
      type: "text"
    },
    {
      id: 3,
      senderId: selectedConversation.otherUser.id,
      message: selectedConversation.lastMessage,
      timestamp: selectedConversation.lastMessageTime,
      type: "text"
    }
  ] : [];

  const filteredConversations = mockConversations.filter(conv =>
    conv.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConversationTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'bg-blue-100 text-blue-800';
      case 'colisting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // In real app, this would send the message via API
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
              >
                ←
              </Button>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">{selectedConversation.otherUser.name}</h2>
                <p className="text-sm text-neutral-600">{selectedConversation.propertyTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Phone size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {mockMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === user?.id 
                  ? 'bg-primary text-white' 
                  : 'bg-white border border-neutral-200'
              }`}>
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === user?.id ? 'text-primary-200' : 'text-neutral-500'
                }`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-neutral-200 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>

        <div className="h-20"></div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
            <p className="text-sm text-neutral-600">{filteredConversations.length} conversations</p>
          </div>
          <Button variant="outline" size="sm">
            <MessageCircle size={16} className="mr-1" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-6 py-4">
        {filteredConversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="mx-auto text-neutral-400 mb-4" size={48} />
            <h3 className="font-semibold text-neutral-900 mb-2">No messages yet</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Start conversations with property inquiries and co-listing requests
            </p>
            <Button variant="outline">
              <Building2 size={16} className="mr-2" />
              Browse Properties
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-neutral-900 text-sm truncate">
                          {conversation.otherUser.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <Badge className={`text-xs ${getConversationTypeColor(conversation.type)}`}>
                            {conversation.type}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 mb-2">{conversation.propertyTitle}</p>
                      <p className="text-sm text-neutral-700 truncate mb-1">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center text-xs text-neutral-500">
                        <Clock size={12} className="mr-1" />
                        {conversation.lastMessageTime}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>
      
      <BottomNavigation />
    </div>
  );
}