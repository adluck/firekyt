import React, { createContext, useContext, useState, useEffect } from 'react';
import { OnboardingTour } from './OnboardingTour';
import { DashboardTour } from './DashboardTour';
import { useLocation } from 'wouter';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  showOnboarding: boolean;
  showGuidedTour: boolean;
  startOnboarding: () => void;
  startGuidedTour: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboardingCompleted');
    const skipped = localStorage.getItem('onboardingSkipped');
    
    if (completed === 'true' || skipped === 'true') {
      setIsOnboardingComplete(true);
    }
    
    // Remove automatic tour triggering - only show when user clicks button
  }, [location]);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const startGuidedTour = () => {
    setShowGuidedTour(true);
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingCompletedDate', new Date().toISOString());
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
    
    // Start guided tour after modal completion
    if (location === '/dashboard') {
      setTimeout(() => setShowGuidedTour(true), 1000);
    }
    
    // Track onboarding completion
    fetch('/api/track-onboarding-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true, tourType: 'modal' })
    }).catch(console.error);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboardingSkipped', 'true');
    localStorage.setItem('onboardingSkippedDate', new Date().toISOString());
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
    
    // Track onboarding skip
    fetch('/api/track-onboarding-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false, skipped: true, tourType: 'modal' })
    }).catch(console.error);
  };

  const completeGuidedTour = () => {
    localStorage.setItem('guidedTourCompleted', 'true');
    localStorage.setItem('guidedTourCompletedDate', new Date().toISOString());
    setShowGuidedTour(false);
  };

  const skipGuidedTour = () => {
    localStorage.setItem('guidedTourSkipped', 'true');
    localStorage.setItem('guidedTourSkippedDate', new Date().toISOString());
    setShowGuidedTour(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        showOnboarding,
        showGuidedTour,
        startOnboarding,
        startGuidedTour,
        completeOnboarding,
        skipOnboarding
      }}
    >
      {children}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={skipOnboarding}
        onComplete={completeOnboarding}
      />
      <DashboardTour
        isActive={showGuidedTour}
        onComplete={completeGuidedTour}
        onSkip={skipGuidedTour}
      />
    </OnboardingContext.Provider>
  );
}