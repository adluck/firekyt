import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { SessionManager } from "../auth/SessionManager";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={handleMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={handleMobileMenuToggle}
        />
      )}

      {/* Sidebar with mobile drawer behavior */}
      <div className={cn(
        "lg:relative fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar 
          user={user} 
          subscription={subscription}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onMobileClose={handleMobileMenuToggle}
        />
      </div>
      
      <main className="flex-1 overflow-auto min-h-0 lg:pl-0 pl-0">
        <div className="w-full p-6 min-h-full lg:pl-6 pl-16" id="main-content">
          {children}
        </div>
      </main>

      {/* Session Manager - Only active when user is logged in */}
      {user && (
        <SessionManager 
          onSessionExpired={() => {
            console.log('Session expired due to inactivity');
          }}
        />
      )}
    </div>
  );
}
