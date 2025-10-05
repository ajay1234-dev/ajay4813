import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { VoiceProvider } from "@/hooks/use-voice";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import Upload from "@/pages/upload";
import Reports from "@/pages/reports";
import Medications from "@/pages/medications";
import Timeline from "@/pages/timeline";
import Reminders from "@/pages/reminders";
import Share from "@/pages/share";
import MainLayout from "@/components/layout/main-layout";

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" nest>
        <MainLayout>
          <Switch>
            <Route path="/" component={DashboardRouter} />
            <Route path="/upload" component={Upload} />
            <Route path="/reports" component={Reports} />
            <Route path="/medications" component={Medications} />
            <Route path="/timeline" component={Timeline} />
            <Route path="/reminders" component={Reminders} />
            <Route path="/share" component={Share} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <VoiceProvider>
            <Toaster />
            <Router />
          </VoiceProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
