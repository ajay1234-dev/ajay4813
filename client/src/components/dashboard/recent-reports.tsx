import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Play, FileText, Clock } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import { format } from "date-fns";
import type { Report } from "@shared/schema";

interface RecentReportsProps {
  reports: Report[];
}

export default function RecentReports({ reports }: RecentReportsProps) {
  const { speak } = useVoice();

  const handlePlayAudio = (summary: string) => {
    speak(summary || "Report analysis is being processed.");
  };

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

  const getReportTypeDisplay = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Latest Reports
          </CardTitle>
          <Link href="/reports">
            <Button variant="outline" size="sm" data-testid="view-all-reports">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reports uploaded yet</p>
            <Link href="/upload">
              <Button className="mt-4" data-testid="upload-first-report">
                Upload Your First Report
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">
                        {getReportTypeDisplay(report.reportType)}
                      </h4>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {report.fileName}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(report.createdAt!), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  {report.summary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayAudio(report.summary!)}
                      title="Listen to report summary"
                      data-testid={`play-audio-${report.id}`}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {report.summary && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-foreground mb-2">
                      Summary:
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {report.summary}
                    </p>
                  </div>
                )}
                
                <div className="mt-3 flex justify-between items-center">
                  <Link href={`/reports/${report.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`view-report-${report.id}`}
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
