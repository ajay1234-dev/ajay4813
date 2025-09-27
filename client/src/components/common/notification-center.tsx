import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Bell, Pill, Calendar, FileCheck } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: 'medication' | 'appointment' | 'report';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  // In a real app, this would fetch actual notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: false, // Disabled for now as we don't have this endpoint
  });

  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "medication",
      title: "Medication Reminder",
      message: "Time to take your Metformin (500mg)",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "2",
      type: "report",
      title: "Report Processed",
      message: "Your blood test results are ready for review",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "3",
      type: "appointment",
      title: "Appointment Reminder",
      message: "Annual check-up with Dr. Smith tomorrow at 2:00 PM",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-4 w-4 text-blue-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'report':
        return <FileCheck className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-50 border-blue-200';
      case 'appointment':
        return 'bg-amber-50 border-amber-200';
      case 'report':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="notifications-button"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Stay updated with your health reminders and reports
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {mockNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${getNotificationBgColor(notification.type)} ${
                  !notification.read ? 'border-l-4 border-l-primary' : ''
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
