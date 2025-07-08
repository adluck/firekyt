import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { SessionManager } from "../auth/SessionManager";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

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

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Sidebar Overlay - completely outside layout flow */}
        <Sidebar 
          user={user} 
          subscription={subscription}
          isCollapsed={false}
          onToggleCollapse={handleToggleCollapse}
          isMobile={true}
          isMobileOpen={isMobileSidebarOpen}
          onMobileToggle={handleMobileSidebarToggle}
          onMobileClose={handleMobileSidebarClose}
        />
        
        {/* Mobile Main Content Container */}
        <div className="h-screen bg-background">
          <main className="h-full overflow-auto pt-16">
            <div className="w-full p-6" id="main-content">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar 
          user={user} 
          subscription={subscription}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isMobile={false}
          isMobileOpen={false}
          onMobileToggle={handleMobileSidebarToggle}
          onMobileClose={handleMobileSidebarClose}
        />
        
        {/* Desktop Main Content */}
        <main className="flex-1 overflow-auto min-h-0">
          <div className="w-full p-6 min-h-full" id="main-content">
            {children}
          </div>
        </main>
      </div>

      {/* Session Manager - Only active when user is logged in */}
      {user && (
        <SessionManager 
          onSessionExpired={() => {
            console.log('Session expired due to inactivity');
          }}
        />
      )}
    </>
  );
}
