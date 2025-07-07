import React from 'react';
import { GuidedTour } from '../GuidedTour';
import { useLocation } from 'wouter';

interface ContentTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function ContentTour({ isActive, onComplete, onSkip }: ContentTourProps) {
  const [location, setLocation] = useLocation();

  const tourSteps = [
    {
      id: 'content-welcome',
      target: 'h1', // Page title
      title: 'AI Content Creation Hub!',
      content: 'This is where you create high-converting affiliate content using our advanced AI. Generate blog posts, product reviews, and comparison articles.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'create-content-btn',
      target: '[data-tour="create-content"]', // Create Content button
      title: 'Start Creating Content',
      content: 'Click here to create new AI-powered content. Choose from blog posts, product reviews, comparison articles, and more.',
      position: 'bottom' as const,
      action: {
        text: 'Create Content',
        onClick: () => setLocation('/content/create')
      }
    },
    {
      id: 'content-list',
      target: '[data-tour="content-list"]', // Content grid/list
      title: 'Your Content Library',
      content: 'All your created content appears here. You can edit, publish, schedule, or manage any piece of content.',
      position: 'top' as const,
      waitForElement: true
    },
    {
      id: 'content-filters',
      target: '[data-tour="content-filters"]', // Filter buttons
      title: 'Content Organization',
      content: 'Filter your content by status (drafts, published, scheduled) and content type for easy management.',
      position: 'left' as const,
      waitForElement: true
    },
    {
      id: 'content-complete',
      target: 'body',
      title: 'Content Creation Mastered!',
      content: 'You\'re ready to create compelling affiliate content that converts. Start with your first AI-generated article.',
      position: 'center' as const
    }
  ];

  return (
    <GuidedTour
      steps={tourSteps}
      isActive={isActive}
      onComplete={onComplete}
      onSkip={onSkip}
      tourName="content-page-tour"
    />
  );
}