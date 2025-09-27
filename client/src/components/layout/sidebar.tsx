import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Pill, 
  Clock, 
  Bell, 
  Share,
  Heart,
  LogOut,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Upload Report", href: "/upload", icon: Upload },
  { name: "My Reports", href: "/reports", icon: FileText },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Health Timeline", href: "/timeline", icon: Clock },
  { name: "Reminders", href: "/reminders", icon: Bell },
  { name: "Share with Doctor", href: "/share", icon: Share },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const sidebarClasses = cn(
    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
    {
      "translate-x-0": isOpen || !isMobile,
      "-translate-x-full": !isOpen && isMobile,
    }
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">MediCare</span>
          </div>
          
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="sidebar-close"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    {
                      "text-primary bg-primary/10 sidebar-active": isActive,
                      "text-muted-foreground hover:text-foreground hover:bg-muted": !isActive,
                    }
                  )}
                  onClick={() => isMobile && onClose()}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            data-testid="logout-button"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
