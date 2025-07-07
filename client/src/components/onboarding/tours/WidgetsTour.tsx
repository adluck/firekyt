import React from 'react';
import { GuidedTour } from '../GuidedTour';
import { useLocation } from 'wouter';

interface WidgetsTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function WidgetsTour({ isActive, onComplete, onSkip }: WidgetsTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'widgets-welcome',
      target: 'h1', // Page title
      title: 'Welcome to Affiliate Widgets!',
      content: 'Here you can create dynamic ad widgets that display your affiliate products. These widgets can be embedded anywhere on your websites or blogs.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'create-widget-btn',
      target: '[data-tour="create-widget"]', // Create Widget button
      title: 'Create Your First Widget',
      content: 'Click here to start creating a new affiliate widget. You can customize the design, add products, and generate embed codes.',
      position: 'bottom' as const,
      action: {
        text: 'Create Widget',
        onClick: () => setLocation('/widgets/create')
      }
    },
    {
      id: 'widget-list',
      target: '[data-tour="widget-list"]', // Widget grid/list
      title: 'Your Widget Collection',
      content: 'All your created widgets appear here. You can edit, preview, or get embed codes for any widget.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'widget-types',
      target: '[data-tour="widget-types"]', // Widget type filters or info
      title: 'Widget Formats',
      content: 'Widgets support multiple ad formats: leaderboard (728x90), medium rectangle (300x250), skyscraper (160x600), and responsive.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'widgets-complete',
      target: 'body',
      title: 'Widget System Ready!',
      content: 'You\'re all set to create affiliate widgets that generate revenue. Start by creating your first widget and embedding it on your sites.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="widgets-page-tour"
    />
  );
}