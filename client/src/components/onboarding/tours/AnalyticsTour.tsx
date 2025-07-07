import React from 'react';
import { GuidedTour } from '../GuidedTour';

interface AnalyticsTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function AnalyticsTour({ isActive, onComplete, onSkip }: AnalyticsTourProps) {
  const tourSteps = [
    {
      id: 'analytics-welcome',
      target: 'h1', // Page title
      title: 'Advanced Analytics Dashboard!',
      content: 'Track your affiliate performance with detailed analytics. Monitor clicks, conversions, revenue, and identify your top-performing content.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'performance-overview',
      target: '[data-tour="performance-overview"]', // Performance cards
      title: 'Performance Overview',
      content: 'Get a quick snapshot of your key metrics: total clicks, conversion rate, revenue, and growth trends.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'revenue-chart',
      target: '[data-tour="revenue-chart"]', // Revenue chart
      title: 'Revenue Tracking',
      content: 'Visualize your affiliate revenue over time to identify trends and optimize your strategy.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'content-performance',
      target: '[data-tour="content-performance"]', // Content performance table
      title: 'Content Performance',
      content: 'See which content pieces generate the most clicks and revenue. Use this data to create more successful content.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'analytics-complete',
      target: 'body',
      title: 'Analytics Mastery Achieved!',
      content: 'You now know how to track and optimize your affiliate performance. Use these insights to maximize your revenue.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="analytics-page-tour"
    />
  );
}