import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, CheckCircle, Play, ArrowRight, Users, TrendingUp, PenTool, Link, BarChart3, Calendar, Zap } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'getting-started' | 'content-creation' | 'affiliate-marketing' | 'analytics' | 'advanced';
  estimatedTime: string;
  features: string[];
  actionText: string;
  route?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FireKyt',
    description: 'Your AI-powered affiliate marketing platform. Let\'s explore what makes FireKyt the ultimate tool for professional affiliate marketers.',
    icon: <Users className="h-6 w-6" />,
    category: 'getting-started',
    estimatedTime: '2 min',
    features: [
      'AI-powered content generation',
      'Intelligent link management',
      'Dynamic affiliate widgets',
      'Real-time analytics tracking',
      'Multi-platform publishing'
    ],
    actionText: 'Start Your Journey'
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description: 'The dashboard provides real-time insights into your affiliate marketing performance with comprehensive analytics and recent activity tracking.',
    icon: <BarChart3 className="h-6 w-6" />,
    category: 'getting-started',
    estimatedTime: '3 min',
    features: [
      'Performance overview metrics',
      'Recent activity timeline',
      'Quick action shortcuts',
      'Revenue and conversion tracking',
      'Traffic source analysis'
    ],
    actionText: 'Explore Dashboard',
    route: '/dashboard'
  },
  {
    id: 'content-creation',
    title: 'AI Content Generation',
    description: 'Create high-converting blog posts, product reviews, and affiliate content with our advanced AI engine powered by Google Gemini.',
    icon: <PenTool className="h-6 w-6" />,
    category: 'content-creation',
    estimatedTime: '5 min',
    features: [
      'AI blog post generation',
      'Product review creation',
      'SEO-optimized content',
      'Brand voice consistency',
      'Smart affiliate link insertion'
    ],
    actionText: 'Create Content',
    route: '/content/create'
  },
  {
    id: 'publishing',
    title: 'Multi-Platform Publishing',
    description: 'Publish your content across WordPress, Medium, LinkedIn, and other platforms with scheduled publishing and automated distribution.',
    icon: <Calendar className="h-6 w-6" />,
    category: 'content-creation',
    estimatedTime: '4 min',
    features: [
      'WordPress integration',
      'Scheduled publishing',
      'Social media distribution',
      'Custom platform APIs',
      'Publication history tracking'
    ],
    actionText: 'Setup Publishing',
    route: '/publishing'
  },
  {
    id: 'link-management',
    title: 'Intelligent Link Management',
    description: 'Manage affiliate links with AI-powered placement suggestions, UTM tracking, and performance analytics.',
    icon: <Link className="h-6 w-6" />,
    category: 'affiliate-marketing',
    estimatedTime: '4 min',
    features: [
      'Smart link placement',
      'UTM parameter tracking',
      'Click-through analytics',
      'Link rotation testing',
      'Revenue attribution'
    ],
    actionText: 'Manage Links',
    route: '/links'
  },
  {
    id: 'auto-link-rules',
    title: 'Smart Link Insertion',
    description: 'Automatically insert affiliate links based on keywords with priority-based rules and comprehensive analytics.',
    icon: <Zap className="h-6 w-6" />,
    category: 'affiliate-marketing',
    estimatedTime: '3 min',
    features: [
      'Keyword-based insertion',
      'Priority rule system',
      'UTM parameter automation',
      'Usage analytics',
      'Performance tracking'
    ],
    actionText: 'Setup Auto-Links',
    route: '/links/auto-link-rules'
  },
  {
    id: 'widgets',
    title: 'Dynamic Affiliate Widgets',
    description: 'Create beautiful, responsive affiliate ad widgets that can be embedded anywhere with professional templates and real-time updates.',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'affiliate-marketing',
    estimatedTime: '6 min',
    features: [
      'Professional ad templates',
      'Multiple size formats',
      'Real-time content updates',
      'WordPress plugin integration',
      'Click tracking analytics'
    ],
    actionText: 'Create Widgets',
    route: '/widgets'
  },
  {
    id: 'ad-copy',
    title: 'AI Ad Copy Generation',
    description: 'Generate platform-specific ad copy for Google Ads, Facebook, Instagram, and email campaigns with A/B testing variations.',
    icon: <PenTool className="h-6 w-6" />,
    category: 'affiliate-marketing',
    estimatedTime: '5 min',
    features: [
      'Platform-specific optimization',
      'A/B testing variations',
      'Brand voice consistency',
      'Image concept generation',
      'Campaign management'
    ],
    actionText: 'Generate Ad Copy',
    route: '/ad-copy'
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Track performance across all your affiliate marketing activities with detailed insights and actionable recommendations.',
    icon: <BarChart3 className="h-6 w-6" />,
    category: 'analytics',
    estimatedTime: '4 min',
    features: [
      'Revenue attribution',
      'Traffic source analysis',
      'Conversion tracking',
      'Performance benchmarking',
      'Trend analysis'
    ],
    actionText: 'View Analytics',
    route: '/analytics'
  },
  {
    id: 'research',
    title: 'Market Research Tools',
    description: 'Analyze competitors, discover profitable niches, and identify trending opportunities with AI-powered research capabilities.',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'advanced',
    estimatedTime: '4 min',
    features: [
      'Competitor analysis',
      'Niche discovery',
      'Trend identification',
      'Keyword research',
      'Market opportunity scoring'
    ],
    actionText: 'Start Research',
    route: '/research'
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Features', count: tourSteps.length },
    { id: 'getting-started', label: 'Getting Started', count: tourSteps.filter(s => s.category === 'getting-started').length },
    { id: 'content-creation', label: 'Content Creation', count: tourSteps.filter(s => s.category === 'content-creation').length },
    { id: 'affiliate-marketing', label: 'Affiliate Marketing', count: tourSteps.filter(s => s.category === 'affiliate-marketing').length },
    { id: 'analytics', label: 'Analytics', count: tourSteps.filter(s => s.category === 'analytics').length },
    { id: 'advanced', label: 'Advanced', count: tourSteps.filter(s => s.category === 'advanced').length }
  ];

  const filteredSteps = selectedCategory === 'all' 
    ? tourSteps 
    : tourSteps.filter(step => step.category === selectedCategory);

  const currentStepData = filteredSteps[currentStep];
  const progress = ((currentStep + 1) / filteredSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    if (currentStep === filteredSteps.length - 1) {
      onComplete();
    } else {
      handleNext();
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentStep(0);
  };

  const handleNavigateToFeature = () => {
    if (currentStepData.route) {
      window.location.href = currentStepData.route;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-orange-600" />
            FireKyt Platform Tour
          </DialogTitle>
          <DialogDescription>
            Discover all the powerful features that make FireKyt the ultimate affiliate marketing platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Step {currentStep + 1} of {filteredSteps.length}
              </span>
              <Badge variant="outline" className="text-xs">
                {currentStepData.estimatedTime}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className="text-xs"
              >
                {category.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Step Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      {currentStepData.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {currentStepData.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                      <ul className="space-y-1">
                        {currentStepData.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {currentStepData.route && (
                        <Button 
                          onClick={handleNavigateToFeature}
                          className="flex-1"
                        >
                          {currentStepData.actionText}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={handleStepComplete}
                        className="flex-1"
                      >
                        {completedSteps.has(currentStepData.id) ? 'Completed' : 'Mark Complete'}
                        <CheckCircle className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step Navigation */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tour Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          index === currentStep
                            ? 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => setCurrentStep(index)}
                      >
                        <div className={`p-1 rounded ${
                          completedSteps.has(step.id)
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : index === currentStep
                            ? 'bg-orange-100 dark:bg-orange-900/20'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {React.cloneElement(step.icon as React.ReactElement, { 
                            className: `h-3 w-3 ${
                              completedSteps.has(step.id)
                                ? 'text-green-600'
                                : index === currentStep
                                ? 'text-orange-600'
                                : 'text-slate-400'
                            }` 
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{step.title}</div>
                          <div className="text-xs text-slate-500 truncate">{step.estimatedTime}</div>
                        </div>
                        {completedSteps.has(step.id) && (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Skip Tour
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === filteredSteps.length - 1}
              >
                Next Step
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}