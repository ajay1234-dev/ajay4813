import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CloudUpload, File, X, CheckCircle, AlertCircle } from "lucide-react";

interface DragDropZoneProps {
  onUploadProgress?: (progress: number | null) => void;
  uploadProgress?: number | null;
}

export default function DragDropZone({ onUploadProgress, uploadProgress }: DragDropZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; status: 'uploading' | 'success' | 'error'; progress: number }>>([]);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data, file) => {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );
      
      toast({
        title: "Upload Successful",
        description: "Your medical document has been uploaded and is being processed.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      // Clear upload progress after success
      setTimeout(() => {
        onUploadProgress?.(null);
        setUploadedFiles([]);
      }, 3000);
    },
    onError: (error, file) => {
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', progress: 0 }
            : f
        )
      );
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload the document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPG, or PNG files only.",
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        file,
        status: 'uploading' as const,
        progress: 0,
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      onUploadProgress?.(0);

      // Upload files sequentially
      validFiles.forEach((file, index) => {
        setTimeout(() => {
          uploadMutation.mutate(file);
          
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadedFiles(prev => 
              prev.map(f => 
                f.file === file && f.status === 'uploading'
                  ? { ...f, progress: Math.min(f.progress + 10, 90) }
                  : f
              )
            );
          }, 200);
          
          setTimeout(() => {
            clearInterval(progressInterval);
          }, 2000);
        }, index * 100);
      });
    }
  }, [uploadMutation, toast, onUploadProgress]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    noClick: false, // Allow clicking on the upload zone
  });

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const getFileIcon = (status: 'uploading' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`upload-zone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-border hover:border-primary hover:bg-primary/5'
            }`}
            data-testid="upload-zone"
          >
            <input {...getInputProps()} data-testid="file-input" />
            
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CloudUpload className="h-8 w-8 text-primary" />
            </div>
            
            {isDragActive ? (
              <div>
                <h4 className="text-lg font-medium text-primary mb-2">
                  Drop your files here
                </h4>
                <p className="text-muted-foreground">
                  Release to upload your medical documents
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Drop your files here
                </h4>
                <p className="text-muted-foreground mb-4">
                  or click to browse your computer
                </p>
                <Button 
                  onClick={open}
                  data-testid="browse-files-button"
                >
                  Choose Files
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Supports PDF, PNG, JPG files up to 10MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-medium text-foreground mb-4">
              Uploading Files
            </h4>
            
            <div className="space-y-4">
              {uploadedFiles.map((fileObj, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-4 p-3 border border-border rounded-lg"
                  data-testid={`upload-item-${index}`}
                >
                  {getFileIcon(fileObj.status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {fileObj.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(fileObj.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    
                    {fileObj.status === 'uploading' && (
                      <Progress 
                        value={fileObj.progress} 
                        className="h-2"
                        data-testid={`progress-${index}`}
                      />
                    )}
                    
                    {fileObj.status === 'success' && (
                      <p className="text-xs text-green-600">
                        Upload complete - Processing document...
                      </p>
                    )}
                    
                    {fileObj.status === 'error' && (
                      <p className="text-xs text-red-600">
                        Upload failed - Please try again
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileObj.file)}
                    data-testid={`remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
