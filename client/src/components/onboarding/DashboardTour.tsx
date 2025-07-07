import React from 'react';
import { GuidedTour } from './GuidedTour';
import { useLocation } from 'wouter';

interface DashboardTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function DashboardTour({ isActive, onComplete, onSkip }: DashboardTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'welcome',
      target: 'h1', // Dashboard title
      title: 'Welcome to FireKyt!',
      content: 'This is your command center where you can monitor all your affiliate marketing activities and performance metrics.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'platform-tour',
      target: '[data-tour="platform-tour"]', // Platform Tour button
      title: 'Platform Tour',
      content: 'Click here anytime to restart this guided tour or explore other features in detail.',
      position: 'bottom' as const,
      action: {
        text: 'Got it!',
        onClick: () => {}
      }
    },
    {
      id: 'create-content',
      target: '[data-tour="create-content"]', // Create Content button
      title: 'AI Content Creation',
      content: 'Start here to generate high-converting blog posts, product reviews, and affiliate content using our advanced AI.',
      position: 'bottom' as const,
      action: {
        text: 'Explore Content Creation',
        onClick: () => setLocation('/content')
      }
    },
    {
      id: 'performance-metrics',
      target: '[data-tour="performance-metrics"]', // Performance cards section
      title: 'Performance Overview',
      content: 'Monitor your key metrics: total sites, content pieces, revenue, and traffic performance at a glance.',
      position: 'top' as const
    },
    {
      id: 'recent-activity',
      target: '[data-tour="recent-activity"]', // Recent Activity section
      title: 'Recent Activity',
      content: 'Track all your recent actions including content creation, publishing, link management, and widget activities.',
      position: 'top' as const
    },
    {
      id: 'sidebar-navigation',
      target: '[data-tour="sidebar"]', // Sidebar
      title: 'Navigation Menu',
      content: 'Access all platform features from this sidebar: content tools, affiliate widgets, analytics, and research tools.',
      position: 'right' as const
    },
    {
      id: 'widgets-nav',
      target: '[href="/widgets"]', // Widgets navigation item
      title: 'Affiliate Widgets',
      content: 'Create dynamic affiliate ad widgets that you can embed anywhere to monetize your content.',
      position: 'right' as const,
      waitForElement: true,
      action: {
        text: 'View Widgets',
        onClick: () => setLocation('/widgets')
      }
    },
    {
      id: 'ad-copy-nav',
      target: '[href="/ad-copy"]', // Ad Copy navigation item
      title: 'AI Ad Copy Generator',
      content: 'Generate platform-specific ad copy for Google Ads, Facebook, Instagram, and email campaigns.',
      position: 'right' as const,
      waitForElement: true,
      action: {
        text: 'Try Ad Copy Generator',
        onClick: () => setLocation('/ad-copy')
      }
    },
    {
      id: 'analytics-nav',
      target: '[href="/analytics"]', // Analytics navigation item
      title: 'Advanced Analytics',
      content: 'Deep dive into your performance data with detailed analytics and actionable insights.',
      position: 'right' as const,
      waitForElement: true,
      action: {
        text: 'View Analytics',
        onClick: () => setLocation('/analytics')
      }
    },
    {
      id: 'tour-complete',
      target: 'body',
      title: 'Tour Complete!',
      content: 'You\'re all set! Start by creating your first piece of content or explore any feature that interests you. You can always restart this tour from the Platform Tour button.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="dashboard-tour"
    />
  );
}