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

    const findAndHighlightElement = () => {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        setHighlightedElement(element);
        updateTooltipPosition(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (currentStepData.waitForElement) {
        // Keep trying to find the element
        setTimeout(findAndHighlightElement, 100);
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

  const highlightStyle = highlightedElement ? (() => {
    const rect = highlightedElement.getBoundingClientRect();
    return {
      position: 'absolute' as const,
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      border: '3px solid #ea580c',
      borderRadius: '8px',
      background: 'rgba(234, 88, 12, 0.1)',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
      pointerEvents: 'none' as const,
      zIndex: 9998,
      animation: 'pulse 2s infinite'
    };
  })() : {};

  return createPortal(
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9997] pointer-events-none"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      />

      {/* Highlight */}
      {highlightedElement && (
        <div style={highlightStyle} />
      )}

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground"
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip Tour
                  </Button>
                  
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