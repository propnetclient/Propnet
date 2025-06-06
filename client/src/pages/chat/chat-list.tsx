import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageCircle, User, Building2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export default function ChatList() {
  const { user } = useAuth();
  
  const { data: chats, isLoading } = useQuery({
    queryKey: ['/api/chats'],
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your chats</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <MessageCircle className="h-6 w-6 text-muted-foreground" />
      </div>

      {!chats || chats.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start connecting with other agents by messaging them from property listings or the broker directory.
            </p>
            <Link href="/community/directory">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Browse Directory
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {chats.map((chat: any) => {
            const otherParticipant = chat.participants?.find((p: any) => p.user.id !== user.id)?.user;
            const lastMessage = chat.messages?.[0];
            
            return (
              <Link key={chat.id} href={`/chat/${chat.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant?.profilePhoto} />
                        <AvatarFallback>
                          {otherParticipant?.name?.charAt(0) || <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">
                            {otherParticipant?.name || "Unknown User"}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(lastMessage.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {otherParticipant?.agencyName && (
                          <div className="flex items-center text-sm text-muted-foreground mb-1">
                            <Building2 className="h-3 w-3 mr-1" />
                            {otherParticipant.agencyName}
                          </div>
                        )}
                        
                        {chat.property && (
                          <Badge variant="outline" className="text-xs mb-2">
                            Re: {chat.property.title}
                          </Badge>
                        )}
                        
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      
                      {otherParticipant?.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Professional Use Only:</strong> This chat is for professional real estate communication only. 
          Misuse may lead to account suspension.
        </p>
      </div>
    </div>
  );
}