import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HealthChart from "@/components/timeline/health-chart";
import TimelineEvents from "@/components/timeline/timeline-events";
import { Calendar, TrendingUp } from "lucide-react";

export default function Timeline() {
  const [timeRange, setTimeRange] = useState("3m");
  const [metricType, setMetricType] = useState("all");

  const { data: timeline, isLoading } = useQuery({
    queryKey: ["/api/timeline"],
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
  });

  // Filter data based on time range
  const getFilteredData = () => {
    if (!timeline) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return timeline;
    }
    
    return timeline.filter((event: any) => new Date(event.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Health Timeline
          </h1>
          <p className="text-muted-foreground">
            Track your health progress and visualize trends over time
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-48" data-testid="metric-filter">
              <SelectValue placeholder="Metric Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
              <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
              <SelectItem value="cholesterol">Cholesterol</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48" data-testid="time-range-filter">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredData.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lab Results</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredData.filter((e: any) => e.eventType === 'lab_result').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medication Changes</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredData.filter((e: any) => e.eventType === 'medication_change').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredData.filter((e: any) => e.eventType === 'appointment').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Trends Chart */}
      <HealthChart 
        data={filteredData}
        timeRange={timeRange}
        metricType={metricType}
        isLoading={isLoading}
      />

      {/* Timeline Events */}
      <TimelineEvents 
        events={filteredData}
        isLoading={isLoading}
      />
    </div>
  );
}
