import { useLocation } from 'wouter';
import { GuidedTour } from '../GuidedTour';

interface LinkManagementTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function LinkManagementTour({ isActive, onComplete, onSkip }: LinkManagementTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'links-welcome',
      target: 'h1', // Page title
      title: 'Link Management Center!',
      content: 'Manage all your affiliate links with AI-powered intelligent placement, tracking, and optimization.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'create-link',
      target: '[data-tour="create-link"]', // Create link button
      title: 'Create Smart Links',
      content: 'Transform any affiliate URL into an intelligent, trackable link with automatic optimization.',
      position: 'bottom' as const,
      waitForElement: true
    },
    {
      id: 'links-dashboard',
      target: '[data-tour="links-dashboard"]', // Links overview
      title: 'Link Performance',
      content: 'Monitor click-through rates, conversions, and revenue for all your affiliate links in real-time.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'auto-link-rules',
      target: '[data-tour="auto-link-rules"]', // Auto-link rules
      title: 'Automation Rules',
      content: 'Set up automatic link insertion based on keywords, content type, and audience targeting.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'link-intelligence',
      target: '[data-tour="link-intelligence"]', // AI suggestions
      title: 'AI Link Intelligence',
      content: 'Get AI-powered suggestions for optimal link placement and content optimization.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'links-complete',
      target: 'body',
      title: 'Link Management Mastery!',
      content: 'Your affiliate links are now optimized for maximum conversions. Start creating intelligent links.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="links-page-tour"
    />
  );
}