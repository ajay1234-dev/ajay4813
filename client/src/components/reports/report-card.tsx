import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useVoice } from "@/hooks/use-voice";
import { Play, FileText, Clock, Download, Share } from "lucide-react";
import { format } from "date-fns";
import type { Report } from "@shared/schema";
import AnalysisSummary from "./analysis-summary";

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  const { speak } = useVoice();

  const handlePlayAudio = () => {
    if (report.summary) {
      speak(report.summary);
    } else {
      speak("Report analysis is still being processed.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReportTypeDisplay = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">
                {getReportTypeDisplay(report.reportType)}
              </CardTitle>
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-1">
              {report.fileName}
            </p>
            
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(report.createdAt!), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {report.summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayAudio}
                title="Listen to report summary"
                data-testid={`play-audio-${report.id}`}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              title="Download report"
              data-testid={`download-${report.id}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {report.status === 'completed' && report.analysis ? (
          <AnalysisSummary analysis={report.analysis} />
        ) : report.status === 'processing' ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Processing your report...
            </p>
          </div>
        ) : report.status === 'failed' ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600 mb-2">
              Failed to process report
            </p>
            <p className="text-xs text-muted-foreground">
              Please try uploading the document again
            </p>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Report uploaded successfully. Analysis will appear here once processing is complete.
            </p>
          </div>
        )}
        
        {report.summary && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">
              Summary:
            </h5>
            <p className="text-sm text-muted-foreground">
              {report.summary}
            </p>
          </div>
        )}
        
        <div className="mt-6 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              data-testid={`view-details-${report.id}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {report.status === 'completed' && (
              <Button 
                variant="outline" 
                size="sm"
                data-testid={`share-report-${report.id}`}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
