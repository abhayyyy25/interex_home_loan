"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Bell,
  Send,
  Users,
  User,
  Megaphone,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";

const notificationTypes = [
  { value: "SYSTEM", label: "System", description: "General system announcements", icon: Bell },
  { value: "LOAN", label: "Loan", description: "Loan-related updates", icon: AlertCircle },
  { value: "NEGOTIATION", label: "Negotiation", description: "Rate negotiation updates", icon: Megaphone },
  { value: "PROMOTION", label: "Promotion", description: "Promotional offers and news", icon: CheckCircle2 },
];

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export default function AdminNotificationsSend() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("SYSTEM");
  const [receiverType, setReceiverType] = useState<"all" | "selected">("all");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  // Fetch users for selection
  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users/");
      return res.json();
    },
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      message: string;
      notification_type: string;
      receiver_type: string;
      selected_user_email?: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/notifications/send/", payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notifications Sent",
        description: data.message,
      });
      // Reset form
      setTitle("");
      setMessage("");
      setNotificationType("SYSTEM");
      setReceiverType("all");
      setSelectedUserEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send notifications",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    if (receiverType === "selected" && !selectedUserEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a user or enter an email",
        variant: "destructive",
      });
      return;
    }

    sendMutation.mutate({
      title,
      message,
      notification_type: notificationType,
      receiver_type: receiverType,
      selected_user_email: receiverType === "selected" ? selectedUserEmail : undefined,
    });
  };

  const selectedTypeInfo = notificationTypes.find((t) => t.value === notificationType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-jakarta flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Send Notification
            </h1>
            <p className="text-muted-foreground">
              Broadcast messages to all users or send targeted notifications
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Fill in the details below to send a notification to your users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Notification Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Important Update: New Features Available"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12"
                  data-testid="input-notification-title"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-base font-medium">
                  Message Body *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Write your notification message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                  data-testid="textarea-notification-message"
                />
                <p className="text-xs text-muted-foreground">
                  {message.length} characters
                </p>
              </div>

              <Separator />

              {/* Notification Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Notification Type *</Label>
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger className="h-12" data-testid="select-notification-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <span>{type.label}</span>
                          <span className="text-muted-foreground text-xs">
                            - {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTypeInfo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <selectedTypeInfo.icon className="w-4 h-4" />
                    {selectedTypeInfo.description}
                  </div>
                )}
              </div>

              <Separator />

              {/* Receiver Type */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Send To *</Label>
                <RadioGroup
                  value={receiverType}
                  onValueChange={(v) => setReceiverType(v as "all" | "selected")}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      receiverType === "all"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setReceiverType("all")}
                  >
                    <RadioGroupItem value="all" id="all" />
                    <Label
                      htmlFor="all"
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">All Users</p>
                        <p className="text-sm text-muted-foreground">
                          Send to everyone ({users.length} users)
                        </p>
                      </div>
                    </Label>
                    {receiverType === "all" && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>

                  <div
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      receiverType === "selected"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setReceiverType("selected")}
                  >
                    <RadioGroupItem value="selected" id="selected" />
                    <Label
                      htmlFor="selected"
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="p-2 rounded-full bg-orange-500/10">
                        <User className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Selected User</p>
                        <p className="text-sm text-muted-foreground">
                          Send to a specific user
                        </p>
                      </div>
                    </Label>
                    {receiverType === "selected" && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </RadioGroup>

                {/* User Selection (shown when selected) */}
                {receiverType === "selected" && (
                  <div className="ml-12 space-y-3 animate-in slide-in-from-top-2">
                    <Label htmlFor="user-email" className="text-sm">
                      Select User or Enter Email
                    </Label>
                    <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
                      <SelectTrigger data-testid="select-user">
                        <SelectValue placeholder="Choose a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.email}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({user.email})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Or enter email manually:
                    </p>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="user@example.com"
                      value={selectedUserEmail}
                      onChange={(e) => setSelectedUserEmail(e.target.value)}
                      data-testid="input-user-email"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Preview */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Preview</Label>
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 mt-1">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">
                          {title || "Notification Title"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {message || "Your message will appear here..."}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notificationType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            • Just now
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4">
                <Link href="/admin">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  disabled={sendMutation.isPending}
                  className="gap-2 min-w-[200px]"
                  data-testid="button-send-notification"
                >
                  {sendMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

