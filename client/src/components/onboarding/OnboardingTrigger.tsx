import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLocation } from 'wouter';
import { Rocket, ArrowRight, Clock, Play } from 'lucide-react';

export function OnboardingTrigger() {
  const [, navigate] = useLocation();
  const { 
    onboardingStatus, 
    shouldShowResumeOnboarding, 
    getNextOnboardingRoute, 
    isOnboardingComplete 
  } = useOnboarding();

  // Don't show anything if onboarding is complete
  if (isOnboardingComplete) {
    return null;
  }

  // Don't show if no onboarding status available
  if (!onboardingStatus) {
    return null;
  }

  const handleStartOnboarding = () => {
    const route = getNextOnboardingRoute();
    navigate(route);
  };

  const getProgressText = () => {
    const { hasConnectedSite, hasGeneratedContent, hasPublishedContent } = onboardingStatus;
    
    if (!hasConnectedSite) {
      return "Connect your first site to get started";
    } else if (!hasGeneratedContent) {
      return "Generate your first AI-powered content";
    } else if (!hasPublishedContent) {
      return "Publish your content to start earning";
    }
    
    return "Complete your setup";
  };

  const getStepNumber = () => {
    const { hasConnectedSite, hasGeneratedContent, hasPublishedContent } = onboardingStatus;
    
    if (!hasConnectedSite) return 1;
    if (!hasGeneratedContent) return 2;
    if (!hasPublishedContent) return 3;
    
    return 3;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Rocket className="h-5 w-5 text-primary" />
          <span>Complete Your Setup</span>
          <Badge variant="outline" className="ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            {3 - getStepNumber() + 1} min left
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {getProgressText()}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(getStepNumber() / 3) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {getStepNumber()}/3
          </span>
        </div>
        
        <Button 
          onClick={handleStartOnboarding}
          className="w-full"
          size="sm"
        >
          Continue Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Help button component for Documentation page
export function OnboardingHelpButton() {
  const [, navigate] = useLocation();
  const { getNextOnboardingRoute } = useOnboarding();

  const handleStartOnboarding = () => {
    const route = getNextOnboardingRoute();
    navigate(route);
  };

  return (
    <Button 
      onClick={handleStartOnboarding}
      className="flex items-center space-x-2"
    >
      <Play className="h-4 w-4" />
      <span>Start Quick Tutorial</span>
    </Button>
  );
}