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

  // Auto-trigger tours on first visit to pages
  useEffect(() => {
    const checkAndTriggerPageTour = () => {
      const pageName = location.replace('/', '') || 'dashboard';
      const visitKey = `pageTour_${pageName}_visited`;
      const hasVisited = localStorage.getItem(visitKey);
      
      // Don't auto-trigger dashboard tour (handled by onboarding system)
      if (pageName === 'dashboard') return;
      
      // Auto-trigger tour for first-time visitors to specific pages
      const tourPages = ['widgets', 'content', 'analytics', 'ad-copy', 'sites', 'research', 'links', 'publishing'];
      if (!hasVisited && tourPages.includes(pageName)) {
        setTimeout(() => {
          startPageTour(pageName);
          localStorage.setItem(visitKey, 'true');
        }, 1500);
      }
    };

    checkAndTriggerPageTour();
  }, [location]);

  const startPageTour = (pageName: string) => {
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