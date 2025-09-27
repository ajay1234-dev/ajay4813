import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pill, Edit2, Trash2, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Medication } from "@shared/schema";
import ReminderSetup from "./reminder-setup";

interface MedicationListProps {
  medications: Medication[];
  isLoading: boolean;
}

export default function MedicationList({ medications, isLoading }: MedicationListProps) {
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const { toast } = useToast();

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/medications/${id}`, { isActive: !isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
      toast({
        title: "Medication Updated",
        description: "Medication status has been updated successfully",
      });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/medications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
      toast({
        title: "Medication Removed",
        description: "Medication has been removed from your list",
      });
    },
  });

  const handleToggleActive = (medication: Medication) => {
    toggleActiveMutation.mutate({ id: medication.id, isActive: medication.isActive! });
  };

  const handleDelete = (medication: Medication) => {
    if (confirm(`Are you sure you want to remove ${medication.name}?`)) {
      deleteMedicationMutation.mutate(medication.id);
    }
  };

  const getFrequencyDisplay = (frequency: string) => {
    const frequencyMap: { [key: string]: string } = {
      'daily': 'Once daily',
      'twice_daily': 'Twice daily',
      'three_times_daily': 'Three times daily',
      'four_times_daily': 'Four times daily',
      'weekly': 'Weekly',
      'as_needed': 'As needed',
    };
    
    return frequencyMap[frequency] || frequency;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
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
        <CardTitle>Your Medications</CardTitle>
      </CardHeader>
      
      <CardContent>
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No medications added
            </h3>
            <p className="text-muted-foreground mb-4">
              Add your first medication to start tracking your prescriptions
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                  <DialogDescription>
                    Add your medication details and set up reminders
                  </DialogDescription>
                </DialogHeader>
                <ReminderSetup onSuccess={() => {}} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <div
                key={medication.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow"
                data-testid={`medication-${medication.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    medication.isActive ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Pill className={`h-5 w-5 ${
                      medication.isActive ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${
                        medication.isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {medication.name}
                      </h4>
                      {!medication.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{medication.dosage}</span>
                      <span>•</span>
                      <span>{getFrequencyDisplay(medication.frequency)}</span>
                      {medication.startDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started {format(new Date(medication.startDate), 'MMM d, yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {medication.instructions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {medication.instructions}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMedication(medication)}
                        data-testid={`edit-medication-${medication.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Medication</DialogTitle>
                        <DialogDescription>
                          Update your medication details and reminders
                        </DialogDescription>
                      </DialogHeader>
                      <ReminderSetup 
                        medication={editingMedication}
                        onSuccess={() => setEditingMedication(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(medication)}
                    disabled={deleteMedicationMutation.isPending}
                    data-testid={`delete-medication-${medication.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <Switch
                    checked={medication.isActive}
                    onCheckedChange={() => handleToggleActive(medication)}
                    disabled={toggleActiveMutation.isPending}
                    data-testid={`toggle-medication-${medication.id}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
