import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DragDropZone from "@/components/upload/drag-drop-zone";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Upload() {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports"],
    refetchInterval: 5000, // Refetch every 5 seconds to check processing status
  });

  const recentUploads = reports?.slice(0, 5) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Upload Medical Documents
        </h1>
        <p className="text-muted-foreground">
          Upload your medical reports, prescriptions, and lab results for AI-powered analysis
        </p>
      </div>

      <DragDropZone 
        onUploadProgress={setUploadProgress}
        uploadProgress={uploadProgress}
      />

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
          ) : recentUploads.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your uploaded documents will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUploads.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow"
                  data-testid={`upload-${report.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">
                          {report.fileName}
                        </h4>
                        <Badge className={getStatusColor(report.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            {report.status}
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getReportTypeDisplay(report.reportType)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(report.createdAt!), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {report.status === 'completed' && (
                      <Link href={`/reports`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`view-report-${report.id}`}
                        >
                          View Report
                        </Button>
                      </Link>
                    )}
                    
                    {report.status === 'processing' && (
                      <span className="text-sm text-amber-600">
                        Processing...
                      </span>
                    )}
                    
                    {report.status === 'failed' && (
                      <span className="text-sm text-red-600">
                        Failed to process
                      </span>
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
