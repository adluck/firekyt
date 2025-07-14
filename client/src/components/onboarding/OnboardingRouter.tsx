import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ConnectSiteStep } from './ConnectSiteStep';
import { GenerateContentStep } from './GenerateContentStep';
import { PublishContentStep } from './PublishContentStep';

export function OnboardingRouter() {
  const [location] = useLocation();
  const { getNextOnboardingRoute } = useOnboarding();

  // Extract step from URL
  const step = location.split('/onboarding/')[1] || '';

  // Auto-redirect to next appropriate step if accessing base onboarding route
  if (location === '/onboarding' || !step) {
    const nextRoute = getNextOnboardingRoute();
    window.location.href = nextRoute;
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to setup...</p>
        </div>
      </div>
    );
  }

  // Render appropriate step component
  return (
    <div className="min-h-screen bg-background">
      {step === 'connect' && <ConnectSiteStep />}
      {step === 'generate' && <GenerateContentStep />}
      {step === 'publish' && <PublishContentStep />}
      {!['connect', 'generate', 'publish'].includes(step) && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}