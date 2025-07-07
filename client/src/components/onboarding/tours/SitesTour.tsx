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
      target: 'h1', // Page title
      title: 'Sites Management Hub!',
      content: 'Connect and manage all your websites, blogs, and publishing destinations from one central location.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'add-site-btn',
      target: '[data-tour="add-site"]', // Add Site button
      title: 'Connect Your First Site',
      content: 'Click here to connect your website or blog. Add WordPress sites, custom APIs, or other publishing platforms.',
      position: 'bottom' as const,
      waitForElement: true
    },
    {
      id: 'sites-list',
      target: '[data-tour="sites-list"]', // Sites list/grid
      title: 'Your Connected Sites',
      content: 'All your connected sites are displayed here. Monitor status, manage settings, and view publishing statistics.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'site-settings',
      target: '[data-tour="site-settings"]', // Site settings or actions
      title: 'Site Management',
      content: 'Configure publishing settings, API credentials, and content distribution preferences for each site.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'sites-complete',
      target: 'body',
      title: 'Sites Management Complete!',
      content: 'You\'re ready to connect and manage multiple publishing destinations. Start by adding your first site.',
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