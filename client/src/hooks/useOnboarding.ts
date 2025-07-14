import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/components/auth/AuthProvider';

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ['/api/onboarding/status'],
    queryFn: () => apiRequest('GET', '/api/onboarding/status'),
    enabled: !!user,
  });

  const completeStepMutation = useMutation({
    mutationFn: (stepNumber: number) => apiRequest('POST', `/api/onboarding/complete-step/${stepNumber}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
    },
  });

  const skipOnboardingMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/onboarding/skip'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
    },
  });

  const isFirstTimeUser = user && user.onboardingStep === 0;
  const isOnboardingComplete = onboardingStatus?.onboardingStatus?.isComplete;
  const currentStep = onboardingStatus?.onboardingStatus?.currentStep || 0;

  const getNextOnboardingRoute = () => {
    if (!onboardingStatus?.onboardingStatus) return '/onboarding/connect-site';
    
    const status = onboardingStatus.onboardingStatus;
    
    if (!status.hasConnectedSite) {
      return '/onboarding/connect-site';
    } else if (!status.hasGeneratedContent) {
      return '/onboarding/generate-content';
    } else if (!status.hasPublishedContent) {
      return '/onboarding/publish-content';
    } else {
      return '/dashboard';
    }
  };

  const shouldShowWelcomeModal = () => {
    return isFirstTimeUser && !isOnboardingComplete;
  };

  const shouldShowResumeOnboarding = () => {
    if (!onboardingStatus?.onboardingStatus) return false;
    return !onboardingStatus.onboardingStatus.isComplete;
  };

  return {
    onboardingStatus: onboardingStatus?.onboardingStatus,
    isLoading,
    isFirstTimeUser,
    isOnboardingComplete,
    currentStep,
    getNextOnboardingRoute,
    shouldShowWelcomeModal,
    shouldShowResumeOnboarding,
    completeStep: completeStepMutation.mutate,
    skipOnboarding: skipOnboardingMutation.mutate,
    isCompletingStep: completeStepMutation.isPending,
    isSkipping: skipOnboardingMutation.isPending,
  };
}