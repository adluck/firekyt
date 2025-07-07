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
      content: 'This is your command center. Let\'s take a complete tour through all sections of your affiliate marketing platform.',
      position: 'bottom' as const,
      delay: 1000
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
      content: 'Now let\'s explore each section of your affiliate marketing toolkit. Each area has specialized features.',
      position: 'right' as const
    },
    {
      id: 'sites-nav',
      target: '[data-tour="sites-nav"]', // Sites navigation
      title: 'Sites Management',
      content: 'Connect and manage your websites, blogs, and publishing destinations.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'content-nav',
      target: '[data-tour="content-nav"]', // Content navigation
      title: 'Content Creation',
      content: 'Create high-converting affiliate content with AI assistance, rich editing tools, and SEO optimization.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'ad-copy-nav',
      target: '[data-tour="ad-copy-nav"]', // Ad Copy navigation
      title: 'AI Ad Copy Generator',
      content: 'Generate platform-specific ad copy for Google Ads, Facebook, Instagram, and email campaigns.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'research-nav',
      target: '[data-tour="research-nav"]', // Research navigation
      title: 'Research Tools',
      content: 'Discover profitable niches, analyze competitors, and find high-converting keywords.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'link-management-nav',
      target: '[data-tour="link-management-nav"]', // Link Management navigation
      title: 'Link Management',
      content: 'Manage affiliate links with AI-powered intelligent placement and performance tracking.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'widgets-nav',
      target: '[data-tour="widgets-nav"]', // Widgets navigation
      title: 'Affiliate Widgets',
      content: 'Create dynamic affiliate ad widgets that you can embed anywhere to monetize your content.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'publishing-nav',
      target: '[data-tour="publishing-nav"]', // Publishing navigation
      title: 'Publishing Hub',
      content: 'Schedule and publish content across multiple platforms with automated distribution.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'documentation-nav',
      target: '[data-tour="documentation-nav"]', // Documentation navigation
      title: 'Documentation',
      content: 'Access comprehensive guides, tutorials, and best practices for affiliate marketing success.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'settings-nav',
      target: '[data-tour="settings-nav"]', // Settings navigation
      title: 'Settings',
      content: 'Configure your account, integrations, and platform preferences.',
      position: 'right' as const,
      waitForElement: true
    },
    {
      id: 'tour-complete',
      target: 'body',
      title: 'Platform Tour Complete!',
      content: 'You\'ve seen all the main sections. Each area has its own detailed tour when you visit it for the first time. Ready to start building your affiliate empire?',
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