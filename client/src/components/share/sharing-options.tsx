import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Link as LinkIcon, Mail, Copy, Download, Share2 } from "lucide-react";

interface SharingOptionsProps {
  selectedReports: string[];
  doctorEmail?: string;
  disabled?: boolean;
}

export default function SharingOptions({ selectedReports, doctorEmail, disabled }: SharingOptionsProps) {
  const [shareLink, setShareLink] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { toast } = useToast();

  const createShareLinkMutation = useMutation({
    mutationFn: async (data: { reportIds: string[]; doctorEmail?: string; expiresInDays?: number }) => {
      const response = await apiRequest("POST", "/api/share/create", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShareLink(data.shareUrl);
      setShareDialogOpen(true);
      toast({
        title: "Share Link Created",
        description: "Your health summary link has been generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generatePDFMutation = useMutation({
    mutationFn: async (reportIds: string[]) => {
      // This would generate a PDF report
      const response = await apiRequest("POST", "/api/reports/generate-pdf", { reportIds });
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-summary-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: "Your health summary PDF has been downloaded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const emailDoctorMutation = useMutation({
    mutationFn: async (data: { reportIds: string[]; doctorEmail: string }) => {
      const response = await apiRequest("POST", "/api/share/email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Health summary has been sent to your doctor",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateShareLink = (expiresInDays: number = 7) => {
    createShareLinkMutation.mutate({
      reportIds: selectedReports,
      doctorEmail,
      expiresInDays,
    });
  };

  const handleGeneratePDF = () => {
    generatePDFMutation.mutate(selectedReports);
  };

  const handleEmailDoctor = () => {
    if (!doctorEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your doctor's email address",
        variant: "destructive",
      });
      return;
    }
    
    emailDoctorMutation.mutate({
      reportIds: selectedReports,
      doctorEmail,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Sharing Options */}
      <div className="grid grid-cols-1 gap-4">
        <Button
          onClick={handleGeneratePDF}
          disabled={disabled || generatePDFMutation.isPending}
          className="flex items-center justify-center p-4 h-auto"
          variant="outline"
          data-testid="generate-pdf-button"
        >
          <div className="text-center">
            <FileText className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="font-medium">Generate PDF</p>
            <p className="text-xs text-muted-foreground">
              Comprehensive health summary
            </p>
          </div>
        </Button>
        
        <Button
          onClick={() => handleCreateShareLink(7)}
          disabled={disabled || createShareLinkMutation.isPending}
          className="flex items-center justify-center p-4 h-auto"
          variant="outline"
          data-testid="create-share-link-button"
        >
          <div className="text-center">
            <LinkIcon className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="font-medium">Create Share Link</p>
            <p className="text-xs text-muted-foreground">
              Secure 7-day access
            </p>
          </div>
        </Button>
        
        <Button
          onClick={handleEmailDoctor}
          disabled={disabled || !doctorEmail || emailDoctorMutation.isPending}
          className="flex items-center justify-center p-4 h-auto"
          variant="outline"
          data-testid="email-doctor-button"
        >
          <div className="text-center">
            <Mail className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="font-medium">Email Doctor</p>
            <p className="text-xs text-muted-foreground">
              Send directly to provider
            </p>
          </div>
        </Button>
      </div>

      {/* Share Link Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Link Created</DialogTitle>
            <DialogDescription>
              Your health summary link is ready. This link will expire in 7 days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1"
                  data-testid="share-link-input"
                />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(shareLink)}
                  data-testid="copy-link-button"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.open(shareLink, '_blank');
                }}
                data-testid="open-share-link"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Open Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Usage Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">
            How to Share:
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• PDF: Download a complete health summary for offline viewing</li>
            <li>• Share Link: Create a secure link that expires automatically</li>
            <li>• Email: Send summary directly to your healthcare provider</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
