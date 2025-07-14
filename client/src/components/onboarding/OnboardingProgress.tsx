import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingProgress({ currentStep, totalSteps, className }: OnboardingProgressProps) {
  const steps = [
    { step: 1, title: "Connect Site", isCompleted: currentStep > 1, isCurrent: currentStep === 1 },
    { step: 2, title: "Generate Content", isCompleted: currentStep > 2, isCurrent: currentStep === 2 },
    { step: 3, title: "Publish Content", isCompleted: currentStep > 3, isCurrent: currentStep === 3 }
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.step} className="flex items-center space-x-2">
            {/* Step Circle */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
              step.isCompleted 
                ? "bg-green-500 border-green-500 text-white" 
                : step.isCurrent 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "bg-background border-muted-foreground text-muted-foreground"
            )}>
              {step.isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step.step}</span>
              )}
            </div>
            
            {/* Step Title */}
            <div className="hidden sm:block">
              <div className={cn(
                "text-sm font-medium transition-colors",
                step.isCompleted 
                  ? "text-green-600" 
                  : step.isCurrent 
                    ? "text-primary" 
                    : "text-muted-foreground"
              )}>
                {step.title}
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="hidden sm:block">
                <div className={cn(
                  "w-16 h-0.5 transition-colors",
                  step.isCompleted 
                    ? "bg-green-500" 
                    : "bg-muted-foreground/30"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}