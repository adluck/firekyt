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
      {/* Sidebar - always visible but collapsed on mobile */}
      <Sidebar 
        user={user} 
        subscription={subscription}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onMobileClose={handleMobileMenuToggle}
      />
      
      <main className="flex-1 overflow-auto min-h-0">
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
