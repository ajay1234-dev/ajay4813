import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";

interface HealthChartProps {
  data: any[];
  timeRange: string;
  metricType: string;
  isLoading: boolean;
}

export default function HealthChart({ data, timeRange, metricType, isLoading }: HealthChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Process data for chart
  const processChartData = () => {
    if (!data || data.length === 0) return [];

    // Filter and transform data based on metric type
    const filteredData = data.filter(event => {
      if (metricType === 'all') return event.metrics;
      return event.metrics && event.metrics[metricType];
    });

    // Transform to chart format
    return filteredData.map(event => {
      const chartPoint: any = {
        date: format(parseISO(event.date), 'MMM dd'),
        fullDate: event.date,
      };

      if (event.metrics) {
        // Extract relevant metrics
        if (event.metrics.blood_pressure) {
          const bp = event.metrics.blood_pressure;
          chartPoint.systolic = typeof bp === 'string' ? parseInt(bp.split('/')[0]) : bp.systolic;
          chartPoint.diastolic = typeof bp === 'string' ? parseInt(bp.split('/')[1]) : bp.diastolic;
        }
        
        if (event.metrics.blood_sugar) {
          chartPoint.bloodSugar = parseInt(event.metrics.blood_sugar);
        }
        
        if (event.metrics.cholesterol) {
          chartPoint.cholesterol = parseInt(event.metrics.cholesterol);
        }
        
        if (event.metrics.weight) {
          chartPoint.weight = parseFloat(event.metrics.weight);
        }
      }

      return chartPoint;
    }).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  };

  const chartData = processChartData();

  // Calculate trends
  const calculateTrend = (metricKey: string) => {
    const values = chartData.map(d => d[metricKey]).filter(v => v !== undefined);
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMetricLines = () => {
    const lines = [];
    
    if (metricType === 'all' || metricType === 'blood_pressure') {
      if (chartData.some(d => d.systolic)) {
        lines.push(
          <Line 
            key="systolic"
            type="monotone" 
            dataKey="systolic" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            name="Systolic BP"
          />
        );
        lines.push(
          <Line 
            key="diastolic"
            type="monotone" 
            dataKey="diastolic" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            name="Diastolic BP"
          />
        );
      }
    }
    
    if (metricType === 'all' || metricType === 'blood_sugar') {
      if (chartData.some(d => d.bloodSugar)) {
        lines.push(
          <Line 
            key="bloodSugar"
            type="monotone" 
            dataKey="bloodSugar" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            name="Blood Sugar"
          />
        );
      }
    }
    
    if (metricType === 'all' || metricType === 'cholesterol') {
      if (chartData.some(d => d.cholesterol)) {
        lines.push(
          <Line 
            key="cholesterol"
            type="monotone" 
            dataKey="cholesterol" 
            stroke="hsl(var(--chart-4))" 
            strokeWidth={2}
            name="Cholesterol"
          />
        );
      }
    }
    
    if (metricType === 'all' || metricType === 'weight') {
      if (chartData.some(d => d.weight)) {
        lines.push(
          <Line 
            key="weight"
            type="monotone" 
            dataKey="weight" 
            stroke="hsl(var(--chart-5))" 
            strokeWidth={2}
            name="Weight"
          />
        );
      }
    }
    
    return lines;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Health Trends</CardTitle>
          
          {/* Trend Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {chartData.some(d => d.systolic) && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(calculateTrend('systolic'))}
                <span>BP</span>
              </div>
            )}
            {chartData.some(d => d.bloodSugar) && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(calculateTrend('bloodSugar'))}
                <span>Sugar</span>
              </div>
            )}
            {chartData.some(d => d.cholesterol) && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(calculateTrend('cholesterol'))}
                <span>Cholesterol</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No health data available for the selected time range</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload more reports to see your health trends
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                {getMetricLines()}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
