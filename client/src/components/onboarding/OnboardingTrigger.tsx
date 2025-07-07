import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, HelpCircle } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

export function OnboardingTrigger() {
  const { startGuidedTour, startOnboarding } = useOnboarding();

  const handleClick = () => {
    // Start guided tour if on dashboard, otherwise start modal tour
    if (window.location.pathname === '/dashboard') {
      startGuidedTour();
    } else {
      startOnboarding();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
      data-tour="platform-tour"
    >
      <Play className="h-4 w-4 mr-1" />
      Platform Tour
    </Button>
  );
}

export function OnboardingHelpButton() {
  const { startGuidedTour, startOnboarding } = useOnboarding();

  const handleClick = () => {
    // Start guided tour if on dashboard, otherwise start modal tour
    if (window.location.pathname === '/dashboard') {
      startGuidedTour();
    } else {
      startOnboarding();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      Need Help?
    </Button>
  );
}