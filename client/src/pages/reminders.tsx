import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReminderSetup from "@/components/medications/reminder-setup";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Check, Clock, Pill, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Reminders() {
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const { toast } = useToast();

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const { data: activeReminders } = useQuery({
    queryKey: ["/api/reminders/active"],
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/reminders/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/active"] });
      toast({
        title: "Reminder Updated",
        description: "Reminder status has been updated successfully",
      });
    },
  });

  const completeReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/reminders/${id}`, { isCompleted: true });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/active"] });
      toast({
        title: "Reminder Completed",
        description: "Reminder marked as completed",
      });
    },
  });

  const handleToggleReminder = (id: string, isActive: boolean) => {
    toggleReminderMutation.mutate({ id, isActive: !isActive });
  };

  const handleCompleteReminder = (id: string) => {
    completeReminderMutation.mutate(id);
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-100 text-blue-800';
      case 'appointment':
        return 'bg-green-100 text-green-800';
      case 'refill':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Reminders
          </h1>
          <p className="text-muted-foreground">
            Manage your medication and appointment reminders
          </p>
        </div>
        
        <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
          <DialogTrigger asChild>
            <Button data-testid="add-reminder-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set up a new reminder for medications or appointments
              </DialogDescription>
            </DialogHeader>
            <ReminderSetup 
              onSuccess={() => setIsAddingReminder(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reminders</p>
                <p className="text-2xl font-bold text-foreground">
                  {reminders?.length || 0}
                </p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Reminders</p>
                <p className="text-2xl font-bold text-foreground">
                  {activeReminders?.length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold text-foreground">
                  {activeReminders?.filter((r: any) => {
                    const today = new Date().toDateString();
                    const reminderDate = new Date(r.scheduledTime).toDateString();
                    return today === reminderDate;
                  }).length || 0}
                </p>
              </div>
              <Check className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : !reminders || reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No reminders set
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first reminder to stay on top of your medications and appointments
              </p>
              <Button onClick={() => setIsAddingReminder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Reminder
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder: any) => (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    reminder.isCompleted ? 'bg-muted/50 border-muted' : 'border-border'
                  }`}
                  data-testid={`reminder-${reminder.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      reminder.isCompleted ? 'bg-green-100' : 'bg-primary/10'
                    }`}>
                      {reminder.isCompleted ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        getReminderIcon(reminder.type)
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${
                          reminder.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                          {reminder.title}
                        </h4>
                        <Badge className={getReminderColor(reminder.type)}>
                          {reminder.type}
                        </Badge>
                        {!reminder.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        {reminder.message}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reminder.scheduledTime), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!reminder.isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteReminder(reminder.id)}
                          data-testid={`complete-reminder-${reminder.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        
                        <Switch
                          checked={reminder.isActive}
                          onCheckedChange={() => handleToggleReminder(reminder.id, reminder.isActive)}
                          data-testid={`toggle-reminder-${reminder.id}`}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
