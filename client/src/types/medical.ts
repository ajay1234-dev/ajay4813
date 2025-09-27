export interface MedicalAnalysis {
  keyFindings: Array<{
    parameter: string;
    value: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'borderline';
    explanation: string;
  }>;
  summary: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  nextSteps: string[];
}

export interface DashboardStats {
  totalReports: number;
  activeMedications: number;
  pendingReminders: number;
  healthScore: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  eventType: 'lab_result' | 'medication_change' | 'appointment';
  title: string;
  description: string;
  metrics?: any;
}

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  nextDose: string;
  taken: boolean;
}
