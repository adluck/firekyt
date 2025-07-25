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
  FolderOpen,
  Network,
  Lightbulb,
  BookOpen,
  Key,
  SearchCheck,
  Telescope,
  MessageSquareMore,
  PanelLeftClose,
  PanelLeft,
  Monitor,
  Plus,
  Ruler,
  Sparkles,
  Eye,
  Folder,
  Mail,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
// Use direct paths to public assets for better production compatibility
const iconPath = "/firekyt-icon.png";
const logoPath = "/firekyt-logo.png";
const logoDarkPath = "/firekyt-logo-dark.png";

interface SidebarProps {
  user?: User;
  subscription?: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  onMobileClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, dataTour: 'dashboard-nav' },
  { name: 'Sites', href: '/sites', icon: Globe, dataTour: 'sites-nav' },
  { 
    name: 'Content', 
    href: '/content', 
    icon: FileText,
    dataTour: 'content-nav',
    submenu: [
      { name: 'AI Generator', href: '/content', icon: FileText },
      { name: 'Rich Editor', href: '/content/editor', icon: FileText },
      { name: 'Content Manager', href: '/content/manage', icon: FileText },
      { name: 'Content Insights', href: '/analytics', icon: Telescope }
    ]
  },
  { 
    name: 'Ad Copy', 
    href: '/ad-copy-generator', 
    icon: Sparkles,
    dataTour: 'ad-copy-nav',
    submenu: [
      { name: 'Generate Ad Copy', href: '/ad-copy-generator', icon: Sparkles },
      { name: 'My Campaigns', href: '/my-ads', icon: Folder }
    ]
  },

  { 
    name: 'Link Management', 
    href: '/links', 
    icon: Link2,
    dataTour: 'link-management-nav',
    submenu: [
      { name: 'Link Dashboard', href: '/links', icon: Link2 },
      { name: 'Link Intelligence', href: '/links/intelligent', icon: Lightbulb },
      { name: 'AI Link Inserter', href: '/links/inserter', icon: Brain },
      { name: 'Auto-Link Rules', href: '/auto-link-rules', icon: Zap },
      { name: 'Partner Networks', href: '/partner-networks', icon: Network }
    ]
  },
  { 
    name: 'Ad Widgets', 
    href: '/ads-widgets', 
    icon: Monitor,
    dataTour: 'widgets-nav',
    submenu: [
      { name: 'Create Widget', href: '/ads-widgets/create', icon: Plus },
      { name: 'Manage Widgets', href: '/ads-widgets', icon: Monitor },
      { name: 'Ad Sizes Demo', href: '/ads-widgets/sizes', icon: Ruler }
    ]
  },
  { name: 'Publishing', href: '/publishing', icon: Send, dataTour: 'publishing-nav' },
  // { name: 'Billing', href: '/billing', icon: CreditCard }, // Temporarily hidden
  { name: 'Documentation', href: '/docs', icon: BookOpen, dataTour: 'documentation-nav' },
  { name: 'Settings', href: '/settings', icon: Settings, dataTour: 'settings-nav' },
];

// Admin-only navigation items
const adminNavigation = [
  { name: 'CRM Dashboard', href: '/admin/crm', icon: Database },
  { name: 'Feedback Dashboard', href: '/admin/feedback', icon: MessageSquareMore },
  { name: 'Test Email', href: '/admin/test-email', icon: Mail },
  { 
    name: 'Research', 
    href: '/research', 
    icon: Search,
    dataTour: 'research-nav',
    submenu: [
      { name: 'Niche Insights', href: '/research/niche', icon: Brain },
      { name: 'Product Research', href: '/research', icon: Search },
      { name: 'SEO Analysis', href: '/research/seo', icon: SearchCheck },
      { name: 'Saved Analyses', href: '/research/seo-storage', icon: Database },
      { name: 'Keyword Analytics', href: '/research/keywords', icon: Key }
    ]
  },
];

export function Sidebar({ 
  user, 
  subscription, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobile = false,
  isMobileOpen = false,
  onMobileToggle,
  onMobileClose
}: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      if (prev.includes(menuName)) {
        // Close the menu if it's already open
        return prev.filter(name => name !== menuName);
      } else {
        // Close all other menus and open only this one
        return [menuName];
      }
    });
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={onMobileToggle}
            className="bg-background"
          >
            {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div 
        data-tour="sidebar"
        className={cn(
          // Base styles for all screen sizes
          "bg-sidebar-background border-r border-sidebar-border",
          // Mobile: fixed overlay with slide-in animation
          isMobile ? [
            "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          ] : [
            // Desktop: static sidebar with collapse animation
            "relative transform transition-all duration-300 ease-in-out"
          ],
          // Width based on collapsed state
          isCollapsed && !isMobile ? "w-16" : "w-64"
        )}>
        <div className="flex flex-col h-full">
          {/* Header with logo and toggle button */}
          <div className="flex items-center justify-center px-4 py-4">
            {isCollapsed ? (
              /* Collapsed state - show icon only */
              <div className="flex justify-center">
                <img 
                  src={iconPath}
                  alt="FireKyt" 
                  className="h-8 w-8"
                />
              </div>
            ) : (
              /* Expanded state - show full logo and beta badge */
              <div className="logo-section flex items-center gap-2">
                <img 
                  src={theme === 'dark' ? logoPath : logoDarkPath}
                  alt="FireKyt" 
                  className="h-8 w-auto"
                />
                <span className="bg-slate-600 text-white text-xs font-semibold px-2 py-0.5 rounded-md shadow-sm">
                  BETA
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 py-6", isCollapsed ? "px-2" : "px-4")} style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== '/dashboard' && location.startsWith(item.href));
              
              if (item.submenu) {
                const isExpanded = expandedMenus.includes(item.name) && !isCollapsed;
                const hasActiveSubmenu = item.submenu.some(subItem => location === subItem.href);
                
                if (isCollapsed) {
                  // Collapsed state - show dropdown menu on hover/click
                  return (
                    <div key={item.name} className="relative group">
                      <button 
                        className={cn(
                          "nav-link w-full justify-center px-0",
                          (isActive || hasActiveSubmenu) && "active"
                        )}
                        onClick={() => toggleMenu(item.name)}
                        title={item.name}
                        data-tour={item.dataTour}
                      >
                        <item.icon className="h-5 w-5" />
                      </button>
                      
                      {/* Dropdown menu for collapsed state */}
                      <div className={cn(
                        "absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50",
                        expandedMenus.includes(item.name) ? "block" : "hidden"
                      )}>
                        <div className="py-2">
                          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {item.name}
                          </div>
                          {item.submenu.map((subItem) => {
                            const isSubActive = location === subItem.href;
                            return (
                              <WouterLink 
                                key={subItem.name} 
                                href={subItem.href}
                                className="no-underline"
                              >
                                <div 
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                    isSubActive && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => {
                                    onMobileClose?.();
                                    setExpandedMenus([]);
                                  }}
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  {subItem.name}
                                </div>
                              </WouterLink>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Expanded state - original behavior
                return (
                  <div key={item.name}>
                    <button 
                      className={cn(
                        "nav-link w-full justify-between",
                        (isActive || hasActiveSubmenu) && "active"
                      )}
                      onClick={() => toggleMenu(item.name)}
                      data-tour={item.dataTour}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div 
                      className={cn(
                        "ml-8 overflow-hidden transition-all duration-200",
                        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}
                      style={{display: 'flex', flexDirection: 'column', gap: '4px'}}
                    >
                      {item.submenu.map((subItem) => {
                        const isSubActive = location === subItem.href;
                        return (
                          <WouterLink 
                            key={subItem.name} 
                            href={subItem.href}
                            className="no-underline"
                          >
                            <div 
                              className={cn(
                                "nav-link text-sm ml-0",
                                isSubActive && "active"
                              )}
                              onClick={() => onMobileClose?.()}
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
                    className={cn(
                      "nav-link",
                      isCollapsed ? "justify-center px-0" : "",
                      isActive && "active"
                    )}
                    onClick={() => onMobileClose?.()}
                    title={isCollapsed ? item.name : undefined}
                    data-tour={item.dataTour}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                </WouterLink>
              );
            })}

            {/* Admin navigation - only show for admin users */}
            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-sidebar-border/50">
                {!isCollapsed && (
                  <div className="text-xs font-medium text-sidebar-foreground/50 mb-2 px-3">
                    ADMIN
                  </div>
                )}
                {adminNavigation.map((item) => {
                  const isActive = location === item.href || 
                    (item.href !== '/admin/crm' && location.startsWith(item.href));
                  
                  if (item.submenu) {
                    const isExpanded = expandedMenus.includes(item.name) && !isCollapsed;
                    const hasActiveSubmenu = item.submenu.some(subItem => location === subItem.href);
                    
                    if (isCollapsed) {
                      // Collapsed state - show dropdown menu on hover/click
                      return (
                        <div key={item.name} className="relative group">
                          <button 
                            className={cn(
                              "nav-link w-full justify-center px-0",
                              (isActive || hasActiveSubmenu) && "active"
                            )}
                            onClick={() => toggleMenu(item.name)}
                            title={item.name}
                            data-tour={item.dataTour}
                          >
                            <item.icon className="h-5 w-5" />
                          </button>
                          
                          {/* Dropdown menu for collapsed state */}
                          <div className={cn(
                            "absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50",
                            expandedMenus.includes(item.name) ? "block" : "hidden"
                          )}>
                            <div className="py-2">
                              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {item.name}
                              </div>
                              {item.submenu.map((subItem) => {
                                const isSubActive = location === subItem.href;
                                return (
                                  <WouterLink 
                                    key={subItem.name} 
                                    href={subItem.href}
                                    className="no-underline"
                                  >
                                    <div 
                                      className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                        isSubActive && "bg-accent text-accent-foreground"
                                      )}
                                      onClick={() => {
                                        onMobileClose?.();
                                        setExpandedMenus([]);
                                      }}
                                    >
                                      <subItem.icon className="h-4 w-4" />
                                      {subItem.name}
                                    </div>
                                  </WouterLink>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Expanded state - original behavior
                    return (
                      <div key={item.name}>
                        <button 
                          className={cn(
                            "nav-link w-full justify-between",
                            (isActive || hasActiveSubmenu) && "active"
                          )}
                          onClick={() => toggleMenu(item.name)}
                          data-tour={item.dataTour}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div 
                          className={cn(
                            "ml-8 overflow-hidden transition-all duration-200",
                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          )}
                          style={{display: 'flex', flexDirection: 'column', gap: '4px'}}
                        >
                          {item.submenu.map((subItem) => {
                            const isSubActive = location === subItem.href;
                            return (
                              <WouterLink 
                                key={subItem.name} 
                                href={subItem.href}
                                className="no-underline"
                              >
                                <div 
                                  className={cn(
                                    "nav-link text-sm ml-0",
                                    isSubActive && "active"
                                  )}
                                  onClick={() => onMobileClose?.()}
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
                        className={cn(
                          "nav-link",
                          isCollapsed ? "justify-center px-0" : "",
                          isActive && "active"
                        )}
                        onClick={() => onMobileClose?.()}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>
                    </WouterLink>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User info & controls */}
          <div className={cn("border-t border-sidebar-border space-y-4", isCollapsed ? "p-2" : "p-4")}>
            {/* User info with subscription badge */}
            {user && !isCollapsed && (
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
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent",
                isCollapsed ? "justify-center px-0" : "justify-start gap-2"
              )}
              title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" />
                  {!isCollapsed && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  {!isCollapsed && <span>Dark Mode</span>}
                </>
              )}
            </Button>



            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent",
                isCollapsed ? "justify-center px-0" : "justify-start gap-2"
              )}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </Button>

            {/* Toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className={cn(
                "flex w-full text-sidebar-foreground hover:bg-sidebar-accent",
                isCollapsed ? "justify-center px-0" : "justify-start gap-2"
              )}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <>
                  <PanelLeft className="h-4 w-4" />
                  {!isCollapsed && <span>Expand</span>}
                </>
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  {!isCollapsed && <span>Collapse</span>}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
