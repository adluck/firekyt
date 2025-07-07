import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { WidgetsTour } from './tours/WidgetsTour';
import { ContentTour } from './tours/ContentTour';
import { AnalyticsTour } from './tours/AnalyticsTour';
import { AdCopyTour } from './tours/AdCopyTour';
import { SitesTour } from './tours/SitesTour';
import { ResearchTour } from './tours/ResearchTour';
import { LinkManagementTour } from './tours/LinkManagementTour';
import { PublishingTour } from './tours/PublishingTour';

interface PageTourContextType {
  startPageTour: (pageName: string) => void;
  isPageTourActive: boolean;
  activePageTour: string | null;
}

const PageTourContext = createContext<PageTourContextType | undefined>(undefined);

export function usePageTour() {
  const context = useContext(PageTourContext);
  if (!context) {
    throw new Error('usePageTour must be used within PageTourProvider');
  }
  return context;
}

interface PageTourProviderProps {
  children: React.ReactNode;
}

export function PageTourProvider({ children }: PageTourProviderProps) {
  const [location] = useLocation();
  const [activePageTour, setActivePageTour] = useState<string | null>(null);
  const [isPageTourActive, setIsPageTourActive] = useState(false);

  // Auto-trigger tours on first visit to pages (only for empty states)
  useEffect(() => {
    const checkAndTriggerPageTour = async () => {
      const pageName = location.replace('/', '') || 'dashboard';
      const visitKey = `pageTour_${pageName}_visited`;
      const hasVisited = localStorage.getItem(visitKey);
      
      // Don't auto-trigger dashboard tour (handled by onboarding system)
      if (pageName === 'dashboard') return;
      
      // Check if page is in empty state before triggering tour
      const tourPages = ['widgets', 'content', 'ad-copy', 'sites', 'research', 'links', 'publishing'];
      if (!hasVisited && tourPages.includes(pageName)) {
        // Check if page has existing data
        const hasExistingData = await checkPageHasData(pageName);
        
        // Only trigger tour if page is empty
        if (!hasExistingData) {
          setTimeout(() => {
            startPageTour(pageName);
            localStorage.setItem(visitKey, 'true');
          }, 1500);
        }
      }
    };

    checkAndTriggerPageTour();
  }, [location]);

  // Check if a page has existing data
  const checkPageHasData = async (pageName: string): Promise<boolean> => {
    try {
      switch (pageName) {
        case 'sites':
          // Check if user has any sites
          const sites = await fetch('/api/sites').then(r => r.json()).catch(() => []);
          return Array.isArray(sites) && sites.length > 0;
          
        case 'content':
          // Check if user has any content
          const content = await fetch('/api/content').then(r => r.json()).catch(() => []);
          return Array.isArray(content) && content.length > 0;
          
        case 'widgets':
          // Check if user has any widgets
          const widgets = await fetch('/api/widgets').then(r => r.json()).catch(() => []);
          return Array.isArray(widgets) && widgets.length > 0;
          
        case 'links':
          // Check if user has any intelligent links
          const links = await fetch('/api/intelligent-links').then(r => r.json()).catch(() => []);
          return Array.isArray(links) && links.length > 0;
          
        case 'ad-copy':
          // Check if user has any ad copy campaigns
          const campaigns = await fetch('/api/ad-copy/campaigns').then(r => r.json()).catch(() => []);
          return Array.isArray(campaigns) && campaigns.length > 0;
          
        default:
          // For research and publishing, always show tour on first visit
          return false;
      }
    } catch (error) {
      console.warn('Error checking page data:', error);
      return false; // Default to showing tour if check fails
    }
  };

  const startPageTour = (pageName: string) => {
    console.log('🎯 Starting page tour for:', pageName);
    setActivePageTour(pageName);
    setIsPageTourActive(true);
  };

  const completeTour = () => {
    const completionKey = `pageTour_${activePageTour}_completed`;
    localStorage.setItem(completionKey, 'true');
    localStorage.setItem(`pageTour_${activePageTour}_completedDate`, new Date().toISOString());
    
    setIsPageTourActive(false);
    setActivePageTour(null);
  };

  const skipTour = () => {
    const skipKey = `pageTour_${activePageTour}_skipped`;
    localStorage.setItem(skipKey, 'true');
    localStorage.setItem(`pageTour_${activePageTour}_skippedDate`, new Date().toISOString());
    
    setIsPageTourActive(false);
    setActivePageTour(null);
  };

  return (
    <PageTourContext.Provider
      value={{
        startPageTour,
        isPageTourActive,
        activePageTour
      }}
    >
      {children}
      
      {/* Render active page tours */}
      {activePageTour === 'widgets' && (
        <WidgetsTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'content' && (
        <ContentTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'analytics' && (
        <AnalyticsTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'ad-copy' && (
        <AdCopyTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'sites' && (
        <SitesTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'research' && (
        <ResearchTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'links' && (
        <LinkManagementTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
      
      {activePageTour === 'publishing' && (
        <PublishingTour
          isActive={isPageTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </PageTourContext.Provider>
  );
}