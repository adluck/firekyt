import { Link as WouterLink, useLocation } from "wouter";
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
  Search,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Send,
  Link2,
  Brain,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      { name: 'Basic Generator', href: '/content/basic', icon: FileText },
      { name: 'Content Manager', href: '/content/manage', icon: FileText },
      { name: 'Rich Editor', href: '/content/editor', icon: FileText }
    ]
  },
  { 
    name: 'Research', 
    href: '/research', 
    icon: Search,
    submenu: [
      { name: 'Product Research', href: '/research', icon: Search },
      { name: 'SEO Analysis', href: '/research/seo', icon: Search },
      { name: 'Niche Insights', href: '/research/niche', icon: Brain }
    ]
  },
  { name: 'Publishing', href: '/publishing', icon: Send },
  { 
    name: 'Link Management', 
    href: '/links', 
    icon: Link2,
    submenu: [
      { name: 'Link Dashboard', href: '/links', icon: Link2 },
      { name: 'AI Link Inserter', href: '/links/inserter', icon: Brain }
    ]
  },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ user, subscription }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
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
            <img 
              src="/src/assets/firekyt-logo-universal.png"
              alt="FireKyt" 
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== '/dashboard' && location.startsWith(item.href));
              
              if (item.submenu) {
                const isExpanded = expandedMenus.includes(item.name);
                const hasActiveSubmenu = item.submenu.some(subItem => location === subItem.href);
                
                return (
                  <div key={item.name} className="space-y-1">
                    <button 
                      className={cn(
                        "nav-link w-full justify-between",
                        (isActive || hasActiveSubmenu) && "active"
                      )}
                      onClick={() => toggleMenu(item.name)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className={cn(
                      "ml-8 space-y-1 overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {item.submenu.map((subItem) => {
                        const isSubActive = location === subItem.href;
                        return (
                          <WouterLink key={subItem.name} href={subItem.href}>
                            <div 
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isSubActive && "bg-sidebar-accent/50 text-sidebar-primary"
                              )}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              <subItem.icon className="h-4 w-4" />
                              {subItem.name}
                            </div>
                          </WouterLink>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              
              return (
                <WouterLink key={item.name} href={item.href}>
                  <div 
                    className={cn("nav-link", isActive && "active")}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                </WouterLink>
              );
            })}
          </nav>

          {/* User info & controls */}
          <div className="p-4 border-t border-sidebar-border space-y-4">
            {/* User info with subscription badge */}
            {user && (
              <div className="text-xs text-sidebar-foreground/70">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{user.firstName || user.username}</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 capitalize">
                    {user.subscriptionTier} Plan
                  </Badge>
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
