import { useLocation } from 'wouter';
import { GuidedTour } from '../GuidedTour';

interface ResearchTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function ResearchTour({ isActive, onComplete, onSkip }: ResearchTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'research-welcome',
      target: 'h1', // Page title
      title: 'Research Tools Dashboard!',
      content: 'Discover profitable niches, analyze competitors, and find high-converting keywords with AI-powered research tools.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'niche-research',
      target: '[data-tour="niche-research"]', // Niche research section
      title: 'Niche Analysis',
      content: 'Explore profitable niches with competition analysis, trend data, and market opportunity insights.',
      position: 'bottom' as const,
      waitForElement: true
    },
    {
      id: 'keyword-tools',
      target: '[data-tour="keyword-tools"]', // Keyword research tools
      title: 'Keyword Research',
      content: 'Find high-traffic, low-competition keywords that your audience is searching for.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'competitor-analysis',
      target: '[data-tour="competitor-analysis"]', // Competitor analysis
      title: 'Competitor Intelligence',
      content: 'Analyze competitor strategies, content gaps, and opportunities to outrank them.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'research-complete',
      target: 'body',
      title: 'Research Mastery Complete!',
      content: 'You\'re equipped with powerful research tools to dominate your niche. Start by exploring market opportunities.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="research-page-tour"
    />
  );
}