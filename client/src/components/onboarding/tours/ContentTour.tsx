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
      target: 'h1',
      title: 'AI Content Creation Hub!',
      content: 'This is where you create high-converting affiliate content using our advanced AI. Generate blog posts, product reviews, and comparison articles.',
      position: 'bottom' as const,
      delay: 1000
    },
    {
      id: 'empty-state',
      target: '.space-y-6, main, .container',
      title: 'Getting Started with Content',
      content: 'This page will show all your created content once you start writing. FireKyt helps you create blog posts, product reviews, and affiliate content with AI assistance.',
      position: 'center' as const,
      waitForElement: true
    },
    {
      id: 'create-content-btn',
      target: 'button',
      title: 'Start Creating Content',
      content: 'Click any "Create Content" or "New Content" button to create AI-powered content. Choose from blog posts, product reviews, comparison articles, and more.',
      position: 'bottom' as const,
      waitForElement: true
    },
    {
      id: 'content-complete',
      target: 'body',
      title: 'Content Creation Ready!',
      content: 'Once you create content, you can edit, schedule, and publish it directly to your connected sites. Start with your first AI-generated article.',
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