import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Globe, 
  FileText, 
  CreditCard, 
  Settings, 
  Zap,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface SidebarProps {
  user?: User;
  subscription?: any;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sites', href: '/sites', icon: Globe },
  { 
    name: 'Content', 
    href: '/content', 
    icon: FileText,
    submenu: [
      { name: 'AI Generator', href: '/content', icon: FileText },
      { name: 'Basic Generator', href: '/content/basic', icon: FileText }
    ]
  },
  { 
    name: 'Research', 
    href: '/research', 
    icon: Search,
    submenu: [
      { name: 'Product Research', href: '/research', icon: Search },
      { name: 'SEO Analysis', href: '/research/seo', icon: Search }
    ]
  },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ user, subscription }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobile}
          className="bg-background"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="logo-section">
            <div className="logo-icon gradient-bg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="brand-name">AffiliateAI</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== '/dashboard' && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <div 
                    className={cn("nav-link", isActive && "active")}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User info & controls */}
          <div className="p-4 border-t border-sidebar-border space-y-4">
            {/* Subscription tier */}
            {user && (
              <div className="text-xs text-sidebar-foreground/70">
                <div className="font-medium">{user.firstName || user.username}</div>
                <div className="capitalize">
                  {user.subscriptionTier} Plan
                </div>
              </div>
            )}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              )}
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
