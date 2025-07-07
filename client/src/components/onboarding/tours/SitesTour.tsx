import { useLocation } from 'wouter';
import { GuidedTour } from '../GuidedTour';

interface SitesTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function SitesTour({ isActive, onComplete, onSkip }: SitesTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'sites-welcome',
      target: 'h1',
      title: 'Sites Management Hub!',
      content: 'Connect and manage all your websites, blogs, and publishing destinations from one central location.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'empty-state',
      target: '.space-y-6, main, .container',
      title: 'Getting Started with Sites',
      content: 'This page will show all your connected websites once you add them. Start by connecting your first site to begin publishing content.',
      position: 'center' as const,
      waitForElement: true
    },
    {
      id: 'add-site-btn',
      target: 'button',
      title: 'Connect Your First Site',
      content: 'Click any "Add Site" or "Create Site" button to connect your website or blog. You can add WordPress sites, custom APIs, or other publishing platforms.',
      position: 'bottom' as const,
      waitForElement: true
    },
    {
      id: 'sites-complete',
      target: 'body',
      title: 'Ready to Connect Sites!',
      content: 'Once you connect a site, you\'ll be able to publish content directly from FireKyt to your website. Start by adding your first site.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="sites-page-tour"
    />
  );
}