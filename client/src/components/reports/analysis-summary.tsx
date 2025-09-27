import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import type { MedicalAnalysis } from "@/types/medical";

interface AnalysisSummaryProps {
  analysis: MedicalAnalysis | any;
}

export default function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  if (!analysis || !analysis.keyFindings) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Analysis data not available
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'abnormal':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'borderline':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'health-metric-normal';
      case 'abnormal':
        return 'health-metric-abnormal';
      case 'borderline':
        return 'health-metric-borderline';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Key Findings */}
      {analysis.keyFindings && analysis.keyFindings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Key Findings:</h4>
          {analysis.keyFindings.map((finding: any, index: number) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(finding.status)}`}
              data-testid={`finding-${index}`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(finding.status)}
                <div>
                  <span className="text-sm font-medium">
                    {finding.parameter}
                  </span>
                  {finding.explanation && (
                    <p className="text-xs mt-1 opacity-90">
                      {finding.explanation}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">
                  {finding.value}
                </span>
                {finding.normalRange && (
                  <span className="block text-xs opacity-75">
                    Normal: {finding.normalRange}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risk Level */}
      {analysis.riskLevel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Risk Level:
          </span>
          <Badge className={getRiskLevelColor(analysis.riskLevel)}>
            {analysis.riskLevel.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Summary */}
      {analysis.summary && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h5 className="text-sm font-semibold text-foreground mb-2">
              What this means:
            </h5>
            <p className="text-sm text-muted-foreground">
              {analysis.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-2">
            Recommendations:
          </h5>
          <ul className="space-y-1">
            {analysis.recommendations.map((recommendation: string, index: number) => (
              <li 
                key={index}
                className="text-sm text-muted-foreground flex items-start"
              >
                <span className="text-primary mr-2">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {analysis.nextSteps && analysis.nextSteps.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-2">
            Next Steps:
          </h5>
          <ul className="space-y-1">
            {analysis.nextSteps.map((step: string, index: number) => (
              <li 
                key={index}
                className="text-sm text-muted-foreground flex items-start"
              >
                <span className="text-amber-600 mr-2">→</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
