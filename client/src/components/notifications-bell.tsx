import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  meta_data?: Record<string, any>;
}

const notificationTypeColors: Record<string, string> = {
  REPO_RATE_CHANGE: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  BANK_RATE_CHANGE: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  PREPAYMENT_OPPORTUNITY: "bg-green-500/10 text-green-700 dark:text-green-400",
  MILESTONE: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  NEGOTIATION_UPDATE: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  EMI_REMINDER: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],  // ← correct
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
  

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications-bell"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full flex items-center justify-center"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0"
        align="end"
        data-testid="panel-notifications"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you about rate changes, prepayment opportunities,
                and more
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover-elevate ${
                    !notification.is_read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.is_read ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`text-sm font-medium leading-tight ${
                            !notification.is_read
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                          data-testid={`text-notification-title-${notification.id}`}
                        >
                          {notification.title}
                        </h4>

                        <Badge
                          variant="secondary"
                          className={`text-xs flex-shrink-0 ${
                            notificationTypeColors[notification.type] || ""
                          }`}
                        >
                          {notification.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </div>

                      <p
                        className="text-xs text-muted-foreground leading-relaxed mb-2"
                        data-testid={`text-notification-message-${notification.id}`}
                      >
                        {notification.message}
                      </p>

                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(notification.created_at))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm"
                onClick={() => setOpen(false)}
                data-testid="button-close-notifications"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
