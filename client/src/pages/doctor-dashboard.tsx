import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, UserIcon, FileText, Pill, Activity } from "lucide-react";
import { format } from "date-fns";

export default function DoctorDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients"],
    queryFn: async () => {
      const response = await fetch('/api/doctor/patients', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  const { data: patientData, isLoading: isLoadingPatientData } = useQuery({
    queryKey: ["/api/doctor/patient", selectedPatient?.id, "reports"],
    enabled: !!selectedPatient,
    queryFn: async () => {
      const response = await fetch(`/api/doctor/patient/${selectedPatient.id}/reports`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch patient data');
      return response.json();
    },
  });

  const filteredPatients = (patients || []).filter((patient: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Doctor Dashboard
        </h1>
        <p className="text-muted-foreground">
          View and manage your patients' health records and reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients?.length || 0}
                </p>
              </div>
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients?.reduce((acc: number, p: any) => acc + (p.reportsCount || 0), 0) || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Patients</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients?.filter((p: any) => p.reportsCount > 0).length || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-patients"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No patients found matching your search" : "No patients yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedPatient(patient)}
                  data-testid={`patient-card-${patient.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {patient.reportsCount || 0} reports
                    </p>
                    {patient.dateOfBirth && (
                      <p className="text-xs text-muted-foreground">
                        DOB: {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient && `${selectedPatient.firstName} ${selectedPatient.lastName}'s Records`}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingPatientData ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : patientData ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patientData.patient?.email}</p>
                    </div>
                    {patientData.patient?.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{patientData.patient.phone}</p>
                      </div>
                    )}
                    {patientData.patient?.dateOfBirth && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {format(new Date(patientData.patient.dateOfBirth), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Medical Reports ({patientData.reports?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.reports?.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.reports.map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">{report.fileName}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                                  {report.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Type: {report.reportType.replace('_', ' ')}
                              </p>
                              {report.summary && (
                                <p className="text-sm">{report.summary}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reports available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Medications ({patientData.medications?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.medications?.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.medications.map((med: any) => (
                        <div key={med.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Pill className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold">{med.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {med.dosage} - {med.frequency}
                              </p>
                              {med.instructions && (
                                <p className="text-sm mt-1">{med.instructions}</p>
                              )}
                              {med.isActive && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No medications recorded
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Health Timeline */}
              {patientData.timeline?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Health Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patientData.timeline.slice(0, 5).map((event: any) => (
                        <div key={event.id} className="border-l-2 border-primary pl-4">
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.date), 'MMM dd, yyyy')}
                          </p>
                          {event.description && (
                            <p className="text-sm mt-1">{event.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
