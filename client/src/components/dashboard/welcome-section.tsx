import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { UserRound } from "lucide-react";

export default function WelcomeSection() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {getGreeting()}, {user?.firstName}!
            </h2>
            <p className="text-muted-foreground">
              Here's your health summary for today
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <UserRound className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
