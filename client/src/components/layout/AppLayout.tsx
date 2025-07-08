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
      {/* Mobile Overlay - only visible when sidebar is open on mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleMobileMenuToggle}
        />
      )}
      
      {/* Sidebar - always visible but collapsed on mobile */}
      <Sidebar 
        user={user} 
        subscription={subscription}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onMobileClose={handleMobileMenuToggle}
        isMobileOpen={isMobileSidebarOpen}
      />
      
      <main className="flex-1 overflow-auto min-h-0 min-w-0">
        {/* Mobile Hamburger Header */}
        <div className="lg:hidden flex items-center p-4 border-b border-border bg-background mobile-header-v2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMobileMenuToggle}
            className="mr-3"
            style={{height: '32px', width: '32px', padding: '4px', minHeight: '32px', maxHeight: '32px', minWidth: '32px', maxWidth: '32px'}}
          >
            <Menu style={{height: '12px', width: '12px', minHeight: '12px', maxHeight: '12px', minWidth: '12px', maxWidth: '12px'}} />
          </Button>
          <h1 className="text-lg font-semibold">FireKyt</h1>
        </div>
        
        <div className="w-full p-6 min-h-full" id="main-content">
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
