import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pill, Check, Plus } from "lucide-react";
import type { Medication } from "@shared/schema";

interface MedicationScheduleProps {
  medications: Medication[];
}

export default function MedicationSchedule({ medications }: MedicationScheduleProps) {
  const { toast } = useToast();

  const markTakenMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      // This would create a reminder entry or update medication log
      const response = await apiRequest("POST", "/api/reminders", {
        medicationId,
        type: "medication",
        title: "Medication Taken",
        message: "Medication marked as taken",
        scheduledTime: new Date().toISOString(),
        isCompleted: true,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Medication Marked",
        description: "Successfully marked as taken",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark medication as taken",
        variant: "destructive",
      });
    },
  });

  const handleMarkTaken = (medicationId: string, medicationName: string) => {
    markTakenMutation.mutate(medicationId);
    
    toast({
      title: "Medication Taken",
      description: `${medicationName} has been marked as taken`,
    });
  };

  // Calculate next dose time (simplified logic)
  const getNextDoseTime = (frequency: string) => {
    const now = new Date();
    const hours = now.getHours();
    
    if (frequency.includes('daily') || frequency.includes('once')) {
      return '8:00 AM';
    } else if (frequency.includes('twice')) {
      return hours < 12 ? '2:00 PM' : '8:00 AM';
    } else if (frequency.includes('three') || frequency.includes('3')) {
      if (hours < 8) return '8:00 AM';
      if (hours < 14) return '2:00 PM';
      return '8:00 PM';
    }
    
    return '8:00 AM';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Today's Medications
          </CardTitle>
          <Link href="/medications">
            <Button variant="outline" size="sm" data-testid="manage-medications">
              Manage All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No active medications</p>
            <Link href="/medications">
              <Button data-testid="add-first-medication">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.slice(0, 3).map((medication) => (
              <div
                key={medication.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:shadow-sm transition-shadow"
                data-testid={`medication-${medication.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Pill className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {medication.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {medication.dosage} - {medication.frequency}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    Next: {getNextDoseTime(medication.frequency)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full hover:bg-green-100 hover:border-green-300"
                    onClick={() => handleMarkTaken(medication.id, medication.name)}
                    disabled={markTakenMutation.isPending}
                    data-testid={`mark-taken-${medication.id}`}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                </div>
              </div>
            ))}
            
            {medications.length > 3 && (
              <div className="text-center pt-2">
                <Link href="/medications">
                  <Button variant="ghost" size="sm">
                    View {medications.length - 3} more medications
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
