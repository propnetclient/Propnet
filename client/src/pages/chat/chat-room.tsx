import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, Phone, MoreVertical, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function ChatRoom() {
  const params = useParams();
  const chatId = parseInt(params.chatId as string);
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!user && !!chatId
  });

  const { data: chats } = useQuery({
    queryKey: ['/api/chats'],
    enabled: !!user
  });

  const currentChat = chats?.find((chat: any) => chat.id === chatId);
  const otherParticipant = currentChat?.participants?.find((p: any) => p.user.id !== user?.id)?.user;

  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { content: string; messageType?: string }) =>
      apiRequest(`/api/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify(messageData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      setMessage("");
    }
  });

  useEffect(() => {
    if (!user || !chatId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_chat', chatId }));
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      }
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave_chat', chatId }));
        ws.close();
      }
    };
  }, [user, chatId, queryClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      content: message.trim(),
      messageType: "text"
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access chat</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-16 border-b bg-white animate-pulse"></div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs bg-gray-200 rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Chat Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.profilePhoto} />
              <AvatarFallback>
                {otherParticipant?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-semibold">{otherParticipant?.name || "Unknown User"}</h2>
              {otherParticipant?.agencyName && (
                <p className="text-sm text-muted-foreground">{otherParticipant.agencyName}</p>
              )}
            </div>
            
            {otherParticipant?.isVerified && (
              <Badge variant="secondary" className="text-xs">Verified</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {currentChat?.property && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">Discussing: {currentChat.property.title}</p>
            <p className="text-xs text-muted-foreground">{currentChat.property.location}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg: any) => {
          const isOwn = msg.senderId === user.id;
          
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                isOwn 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              } rounded-lg p-3`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Professional use only. Messages are monitored for compliance.
        </div>
      </div>
    </div>
  );
}