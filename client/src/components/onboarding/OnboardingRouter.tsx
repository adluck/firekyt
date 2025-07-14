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
    <Switch>
      <Route path="/onboarding/connect" component={ConnectSiteStep} />
      <Route path="/onboarding/generate" component={GenerateContentStep} />
      <Route path="/onboarding/publish" component={PublishContentStep} />
      <Route path="/onboarding">
        {/* Fallback - redirect to appropriate step */}
        <div>Redirecting...</div>
      </Route>
    </Switch>
  );
}