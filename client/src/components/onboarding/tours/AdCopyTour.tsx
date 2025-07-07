import React from 'react';
import { GuidedTour } from '../GuidedTour';
import { useLocation } from 'wouter';

interface AdCopyTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function AdCopyTour({ isActive, onComplete, onSkip }: AdCopyTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'adcopy-welcome',
      target: 'h1', // Page title
      title: 'AI Ad Copy Generator!',
      content: 'Create platform-specific ad copy for Google Ads, Facebook, Instagram, and email campaigns using our advanced AI.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'create-campaign-btn',
      target: '[data-tour="create-campaign"]', // Create Campaign button
      title: 'Start Your Campaign',
      content: 'Click here to create a new ad copy campaign. Input your product details and get optimized copy for multiple platforms.',
      position: 'bottom' as const,
      action: {
        text: 'Create Campaign',
        onClick: () => setLocation('/ad-copy/create')
      }
    },
    {
      id: 'campaign-list',
      target: '[data-tour="campaign-list"]', // Campaign list
      title: 'Your Ad Campaigns',
      content: 'All your ad copy campaigns are listed here. View generated variations and copy them for use in your advertising platforms.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'platform-types',
      target: '[data-tour="platform-types"]', // Platform selector or info
      title: 'Multi-Platform Support',
      content: 'Generate optimized copy for Google Ads, Facebook/Instagram, email marketing, and Amazon product listings.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'adcopy-complete',
      target: 'body',
      title: 'Ad Copy Mastery Complete!',
      content: 'You\'re ready to create compelling ad copy that converts across all major advertising platforms.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="adcopy-page-tour"
    />
  );
}