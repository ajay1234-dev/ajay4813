import { useQuery } from "@tanstack/react-query";
import WelcomeSection from "@/components/dashboard/welcome-section";
import QuickStats from "@/components/dashboard/quick-stats";
import RecentReports from "@/components/dashboard/recent-reports";
import MedicationSchedule from "@/components/dashboard/medication-schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVoice } from "@/hooks/use-voice";
import { useEffect } from "react";

export default function Dashboard() {
  const { speak } = useVoice();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const { data: activeMedications, isLoading: medicationsLoading } = useQuery({
    queryKey: ["/api/medications/active"],
  });

  // Voice announcement for dashboard
  useEffect(() => {
    if (stats) {
      const announcement = `Welcome to your health dashboard. You have ${stats.totalReports} reports, ${stats.activeMedications} active medications, and your health score is ${stats.healthScore}.`;
      speak(announcement);
    }
  }, [stats, speak]);

  return (
    <div className="space-y-6 fade-in">
      <WelcomeSection />
      
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <QuickStats stats={stats} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <RecentReports reports={recentReports?.slice(0, 3) || []} />
        )}

        {medicationsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <MedicationSchedule medications={activeMedications || []} />
        )}
      </div>
    </div>
  );
}
