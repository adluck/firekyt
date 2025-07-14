import { useLocation, Route, Switch } from 'wouter';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ConnectSiteStep } from './ConnectSiteStep';
import { GenerateContentStep } from './GenerateContentStep';
import { PublishContentStep } from './PublishContentStep';

export function OnboardingRouter() {
  const [location] = useLocation();
  const { getNextOnboardingRoute } = useOnboarding();

  // Auto-redirect to next appropriate step if accessing base onboarding route
  if (location === '/onboarding') {
    const nextRoute = getNextOnboardingRoute();
    window.history.replaceState({}, '', nextRoute);
  }

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/onboarding/connect" component={ConnectSiteStep} />
        <Route path="/onboarding/generate" component={GenerateContentStep} />
        <Route path="/onboarding/publish" component={PublishContentStep} />
        <Route path="/onboarding">
          {/* Fallback - redirect to appropriate step */}
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Redirecting to setup...</p>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}