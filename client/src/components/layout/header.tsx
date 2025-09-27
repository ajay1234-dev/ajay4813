import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { useAuth } from "@/hooks/use-auth";
import LanguageSelector from "@/components/common/language-selector";
import NotificationCenter from "@/components/common/notification-center";
import VoiceControls from "@/components/common/voice-controls";
import { Menu, Sun, Moon } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
            data-testid="menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Health Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {getGreeting()}, {user?.firstName}!
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          
          <VoiceControls />
          
          <NotificationCenter />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            title="Toggle Dark Mode"
            data-testid="dark-mode-toggle"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
