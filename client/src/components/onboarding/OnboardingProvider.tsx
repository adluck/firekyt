import React, { createContext, useContext, useState, useEffect } from 'react';
import { OnboardingTour } from './OnboardingTour';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  showOnboarding: boolean;
  startOnboarding: () => void;
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

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboardingCompleted');
    const skipped = localStorage.getItem('onboardingSkipped');
    
    if (completed === 'true' || skipped === 'true') {
      setIsOnboardingComplete(true);
    } else {
      // Show onboarding for new users after a brief delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingCompletedDate', new Date().toISOString());
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
    
    // Track onboarding completion
    fetch('/api/track-onboarding-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
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
      body: JSON.stringify({ completed: false, skipped: true })
    }).catch(console.error);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        showOnboarding,
        startOnboarding,
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
    </OnboardingContext.Provider>
  );
}