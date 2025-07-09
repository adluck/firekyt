import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, Play, Target, SkipForward } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    text: string;
    onClick: () => void;
  };
  waitForElement?: boolean;
  delay?: number;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tourName: string;
}

export function GuidedTour({ steps, isActive, onComplete, onSkip, tourName }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // Clean up previous highlights
    const previousHighlights = document.querySelectorAll('.tour-highlight-active');
    previousHighlights.forEach(el => el.classList.remove('tour-highlight-active'));

    const findAndHighlightElement = () => {
      // Try multiple selectors if provided (comma-separated)
      const selectors = currentStepData.target.split(',').map(s => s.trim());
      let element = null;
      
      for (const selector of selectors) {
        try {
          element = document.querySelector(selector);
          if (element) break;
        } catch (e) {
          console.warn('Invalid selector:', selector, e);
        }
      }
      
      if (element) {
        const rect = element.getBoundingClientRect();
        console.log('Found element for tour:', currentStepData.target, element);
        console.log('Element rect:', rect);
        
        // Ensure element is visible and has dimensions
        if (rect.width === 0 || rect.height === 0) {
          console.log('Element has zero dimensions, attempting to fix...');
          
          // Try to make element visible if it's hidden
          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.display === 'none') {
            element.style.display = 'block';
          }
          if (computedStyle.visibility === 'hidden') {
            element.style.visibility = 'visible';
          }
          
          // For navigation elements, ensure they're properly sized
          if (element.classList.contains('nav-link') || element.hasAttribute('data-tour')) {
            element.style.minHeight = '44px';
            element.style.minWidth = '120px';
            element.style.display = 'flex';
            element.style.alignItems = 'center';
            element.style.padding = '12px 16px';
          }
          
          // Additional fixes for desktop navigation
          if (element.closest('.sidebar') || element.closest('nav')) {
            element.style.position = 'relative';
            element.style.zIndex = '10000';
            element.style.backgroundColor = 'var(--background)';
            element.style.border = '1px solid var(--border)';
            element.style.borderRadius = '8px';
          }
          
          // Force layout recalculation
          element.offsetHeight; // Trigger reflow
          const newRect = element.getBoundingClientRect();
          console.log('New rect after fixes:', newRect);
          
          // If still zero dimensions, try to find parent container
          if (newRect.width === 0 || newRect.height === 0) {
            const parent = element.parentElement;
            if (parent) {
              console.log('Using parent element instead');
              parent.classList.add('tour-highlight-active');
              parent.style.minHeight = '44px';
              parent.style.minWidth = '120px';
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.padding = '12px 16px';
              parent.style.position = 'relative';
              parent.style.zIndex = '10000';
              setHighlightedElement(parent);
              updateTooltipPosition(parent);
              return;
            }
          }
        }
        
        // Add tour highlight class directly to element
        element.classList.add('tour-highlight-active');
        
        setHighlightedElement(element);
        updateTooltipPosition(element);
        
        // Scroll to element with better positioning
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        
        // Add slight delay to ensure element is properly rendered
        setTimeout(() => {
          updateTooltipPosition(element);
        }, 100);
        
      } else if (currentStepData.waitForElement) {
        // Keep trying to find the element with limited retries
        const retryCount = (findAndHighlightElement as any).retryCount || 0;
        if (retryCount < 50) { // Max 5 seconds of retries
          (findAndHighlightElement as any).retryCount = retryCount + 1;
          setTimeout(findAndHighlightElement, 100);
        } else {
          console.warn('Could not find tour element after retries:', currentStepData.target);
        }
      }
    };

    const delay = currentStepData.delay || 500;
    const timer = setTimeout(findAndHighlightElement, delay);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, currentStepData]);

  const updateTooltipPosition = (element: Element) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 16;

    let x = 0;
    let y = 0;

    switch (currentStepData.position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - padding;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + padding;
        break;
      case 'left':
        x = rect.left - tooltipWidth - padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'center':
        x = window.innerWidth / 2 - tooltipWidth / 2;
        y = window.innerHeight / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ x, y });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Clean up all highlights
    const previousHighlights = document.querySelectorAll('.tour-highlight-active');
    previousHighlights.forEach(el => el.classList.remove('tour-highlight-active'));
    
    // Track tour completion
    fetch('/api/track-onboarding-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        completed: true, 
        tourName,
        stepsCompleted: steps.length 
      })
    }).catch(console.error);
    
    onComplete();
  };

  const handleSkip = () => {
    // Clean up all highlights
    const previousHighlights = document.querySelectorAll('.tour-highlight-active');
    previousHighlights.forEach(el => el.classList.remove('tour-highlight-active'));
    
    // Track tour skip
    fetch('/api/track-onboarding-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        completed: false, 
        skipped: true, 
        tourName,
        stepsCompleted: currentStep + 1
      })
    }).catch(console.error);
    
    onSkip();
  };

  if (!isActive || !currentStepData) return null;

  return createPortal(
    <>
      {/* Background overlay to dim everything except highlighted element */}
      <div 
        className="fixed inset-0 bg-black/30 z-[9997] pointer-events-none"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          width: '320px'
        }}
      >
        <Card className="shadow-xl border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <Progress value={progress} className="h-1 mb-3" />

            {/* Content */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.content}
              </p>

              {/* Action Button */}
              {currentStepData.action && (
                <Button
                  size="sm"
                  onClick={currentStepData.action.onClick}
                  className="w-full"
                >
                  {currentStepData.action.text}
                </Button>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {/* Only show skip button if not on the final step */}
                  {currentStep < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                      className="text-xs text-muted-foreground"
                    >
                      <SkipForward className="h-3 w-3 mr-1" />
                      Skip Tour
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="text-xs"
                  >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `
      }} />
    </>,
    document.body
  );
}