import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Medication } from "@shared/schema";

interface ReminderSetupProps {
  medication?: Medication | null;
  onSuccess: () => void;
}

export default function ReminderSetup({ medication, onSuccess }: ReminderSetupProps) {
  const [formData, setFormData] = useState({
    name: medication?.name || "",
    dosage: medication?.dosage || "",
    frequency: medication?.frequency || "daily",
    instructions: medication?.instructions || "",
    sideEffects: medication?.sideEffects || "",
    reminderTimes: ["08:00"], // Default morning time
  });

  const { toast } = useToast();

  const saveMedicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = medication ? `/api/medications/${medication.id}` : "/api/medications";
      const method = medication ? "PATCH" : "POST";
      
      const response = await apiRequest(method, url, {
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        instructions: data.instructions,
        sideEffects: data.sideEffects,
        isActive: true,
        startDate: medication?.startDate || new Date().toISOString(),
      });
      
      return response.json();
    },
    onSuccess: async (savedMedication) => {
      // Create reminders for the medication
      if (formData.reminderTimes.length > 0) {
        for (const time of formData.reminderTimes) {
          const [hours, minutes] = time.split(':');
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          await apiRequest("POST", "/api/reminders", {
            medicationId: savedMedication.id,
            type: "medication",
            title: `Take ${formData.name}`,
            message: `Time to take your ${formData.name} (${formData.dosage})`,
            scheduledTime: reminderTime.toISOString(),
            isActive: true,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      
      toast({
        title: medication ? "Medication Updated" : "Medication Added",
        description: `${formData.name} has been ${medication ? 'updated' : 'added'} successfully`,
      });
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save medication. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReminderTimeChange = (index: number, time: string) => {
    const newTimes = [...formData.reminderTimes];
    newTimes[index] = time;
    setFormData(prev => ({ ...prev, reminderTimes: newTimes }));
  };

  const addReminderTime = () => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, "08:00"]
    }));
  };

  const removeReminderTime = (index: number) => {
    const newTimes = formData.reminderTimes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, reminderTimes: newTimes }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dosage || !formData.frequency) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveMedicationMutation.mutate(formData);
  };

  const getFrequencyOptions = () => {
    return [
      { value: "daily", label: "Once daily" },
      { value: "twice_daily", label: "Twice daily" },
      { value: "three_times_daily", label: "Three times daily" },
      { value: "four_times_daily", label: "Four times daily" },
      { value: "weekly", label: "Weekly" },
      { value: "as_needed", label: "As needed" },
    ];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="medication-name">Medication Name *</Label>
        <Input
          id="medication-name"
          placeholder="e.g., Metformin"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          required
          data-testid="medication-name-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage *</Label>
          <Input
            id="dosage"
            placeholder="e.g., 500mg"
            value={formData.dosage}
            onChange={(e) => handleInputChange("dosage", e.target.value)}
            required
            data-testid="dosage-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency *</Label>
          <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
            <SelectTrigger data-testid="frequency-select">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {getFrequencyOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="e.g., Take with food"
          value={formData.instructions}
          onChange={(e) => handleInputChange("instructions", e.target.value)}
          rows={2}
          data-testid="instructions-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="side-effects">Known Side Effects</Label>
        <Textarea
          id="side-effects"
          placeholder="e.g., Nausea, dizziness"
          value={formData.sideEffects}
          onChange={(e) => handleInputChange("sideEffects", e.target.value)}
          rows={2}
          data-testid="side-effects-input"
        />
      </div>

      {/* Reminder Times */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Reminder Times</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addReminderTime}
            data-testid="add-reminder-time"
          >
            Add Time
          </Button>
        </div>
        
        {formData.reminderTimes.map((time, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => handleReminderTimeChange(index, e.target.value)}
              data-testid={`reminder-time-${index}`}
            />
            {formData.reminderTimes.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeReminderTime(index)}
                data-testid={`remove-reminder-time-${index}`}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          data-testid="cancel-medication"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saveMedicationMutation.isPending}
          data-testid="save-medication"
        >
          {saveMedicationMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            medication ? "Update Medication" : "Add Medication"
          )}
        </Button>
      </div>
    </form>
  );
}
