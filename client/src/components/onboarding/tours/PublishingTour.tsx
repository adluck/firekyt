import { useLocation } from 'wouter';
import { GuidedTour } from '../GuidedTour';

interface PublishingTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function PublishingTour({ isActive, onComplete, onSkip }: PublishingTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'publishing-welcome',
      target: 'h1', // Page title
      title: 'Publishing Hub!',
      content: 'Schedule and distribute your content across multiple platforms with intelligent automation.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'schedule-content',
      target: '[data-tour="schedule-content"]', // Schedule button
      title: 'Schedule Publications',
      content: 'Plan your content calendar and schedule automatic publishing to all connected platforms.',
      position: 'bottom' as const,
      waitForElement: true
    },
    {
      id: 'publishing-queue',
      target: '[data-tour="publishing-queue"]', // Publishing queue
      title: 'Publishing Queue',
      content: 'View your scheduled publications, track publishing status, and manage your content calendar.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'platform-integrations',
      target: '[data-tour="platform-integrations"]', // Platform connections
      title: 'Platform Integrations',
      content: 'Connect to WordPress, Medium, LinkedIn, and other platforms for seamless content distribution.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'publishing-complete',
      target: 'body',
      title: 'Publishing Automation Ready!',
      content: 'Your content distribution is now automated. Schedule your first publication to get started.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="publishing-page-tour"
    />
  );
}