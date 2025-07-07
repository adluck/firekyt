import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, HelpCircle } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

export function OnboardingTrigger() {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startOnboarding}
      className="text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
    >
      <Play className="h-4 w-4 mr-1" />
      Platform Tour
    </Button>
  );
}

export function OnboardingHelpButton() {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startOnboarding}
      className="text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      Need Help?
    </Button>
  );
}