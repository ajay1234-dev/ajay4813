import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Pill, Calendar, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TimelineEventsProps {
  events: any[];
  isLoading: boolean;
}

export default function TimelineEvents({ events, isLoading }: TimelineEventsProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'lab_result':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'medication_change':
        return <Pill className="h-4 w-4 text-green-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'lab_result':
        return 'bg-blue-100 text-blue-800';
      case 'medication_change':
        return 'bg-green-100 text-green-800';
      case 'appointment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeDisplay = (eventType: string) => {
    const typeMap: { [key: string]: string } = {
      'lab_result': 'Lab Result',
      'medication_change': 'Medication Change',
      'appointment': 'Appointment',
    };
    
    return typeMap[eventType] || eventType;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-3 h-3 rounded-full mt-2" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Events</CardTitle>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No events in timeline
            </h3>
            <p className="text-muted-foreground">
              Your health events will appear here as you upload reports and add medications
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event, index) => (
              <div
                key={event.id || index}
                className="flex items-start space-x-4"
                data-testid={`timeline-event-${index}`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-2" />
                  {index < events.length - 1 && (
                    <div className="w-px h-16 bg-border mt-2" />
                  )}
                </div>
                
                {/* Event content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.eventType)}
                      <h4 className="font-medium text-foreground">
                        {event.title}
                      </h4>
                      <Badge className={getEventColor(event.eventType)}>
                        {getEventTypeDisplay(event.eventType)}
                      </Badge>
                    </div>
                    
                    <span className="text-sm text-muted-foreground">
                      {format(parseISO(event.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {event.description}
                    </p>
                  )}
                  
                  {/* Metrics display */}
                  {event.metrics && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-foreground mb-2">
                        Key Metrics:
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(event.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="text-foreground font-medium">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {event.notes && (
                    <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {event.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
