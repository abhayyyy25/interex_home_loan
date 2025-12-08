import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatResponse {
  message: string;
  session_id: number;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(() => {
    // Restore session ID from localStorage
    const saved = localStorage.getItem("chatSessionId");
    return saved ? parseInt(saved, 10) : null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch existing session history if we have a session ID
  const { data: sessionData } = useQuery({
    queryKey: ["/api/chat/session", sessionId],
    enabled: sessionId !== null,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chat/session/${sessionId}`);
      if (!response.ok) {
        // Clear invalid session
        localStorage.removeItem("chatSessionId");
        setSessionId(null);
        return null;
      }
      return response.json();
    },
  });

  // Hydrate messages from session data (always use server as source of truth)
  useEffect(() => {
    if (sessionData?.messages) {
      setMessages(sessionData.messages);
    }
  }, [sessionData]);

  // Save session ID to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("chatSessionId", sessionId.toString());
    }
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      // Optimistically add user message immediately
      const userMessage: ChatMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setMessage(""); // Clear input immediately
      
      const response = await apiRequest("POST", "/api/chat/", {
        message: text,
        session_id: sessionId,
      });
      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      // Update session ID if this is first message
      if (!sessionId) {
        setSessionId(data.session_id);
      }
      
      // Add only AI response (user message already added optimistically)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
        },
      ]);
      
      // Invalidate session query to refetch authoritative history
      queryClient.invalidateQueries({ queryKey: ["/api/chat/session", data.session_id] });
    },
    onError: () => {
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Financial Advisor</h1>
        <p className="text-muted-foreground">
          Get personalized advice on your home loans, prepayment strategies, and financial planning
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chat with AI Advisor
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Welcome to your AI Financial Advisor!</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Ask me anything about your home loans, prepayment strategies, tax benefits, or rate negotiations.
                    I have access to your loan portfolio and can provide personalized advice.
                  </p>
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Should I prepay my loan now?",
                        "How can I negotiate a better rate?",
                        "What are the tax benefits?",
                        "Compare my current loans",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => setMessage(suggestion)}
                          data-testid={`button-suggestion-${suggestion.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.role}-${index}`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-accent">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your home loans..."
                className="resize-none min-h-[60px] max-h-[120px]"
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-[60px] w-[60px]"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
