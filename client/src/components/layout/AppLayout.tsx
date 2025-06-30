import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
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

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        user={user} 
        subscription={subscription}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
