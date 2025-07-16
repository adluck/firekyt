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
      // Also refresh the user object to update onboarding step
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const skipOnboardingMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/onboarding/skip'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
      // Also refresh the user object to update onboarding step
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const isFirstTimeUser = user && user.onboardingStep === 0;
  const isOnboardingComplete = onboardingStatus?.onboardingStatus?.isComplete;
  const currentStep = onboardingStatus?.onboardingStatus?.currentStep || 0;

  const getNextOnboardingRoute = () => {
    if (!onboardingStatus?.onboardingStatus) return '/onboarding/connect';
    
    const status = onboardingStatus.onboardingStatus;
    
    if (!status.hasConnectedSite) {
      return '/onboarding/connect';
    } else if (!status.hasGeneratedContent) {
      return '/onboarding/generate';
    } else if (!status.hasPublishedContent) {
      return '/onboarding/publish';
    } else {
      return '/dashboard';
    }
  };

  const shouldShowWelcomeModal = () => {
    if (!onboardingStatus) return false;
    // Only show modal if user has onboarding step 0 and onboarding is not complete
    return user?.onboardingStep === 0 && !isOnboardingComplete;
  };

  const shouldShowResumeOnboarding = () => {
    if (!onboardingStatus?.onboardingStatus) return false;
    // Only show resume button if user has started onboarding (step > 0) but not completed it
    return user?.onboardingStep > 0 && !onboardingStatus.onboardingStatus.isComplete;
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
    completeOnboardingStep: completeStepMutation.mutate,
    skipOnboarding: skipOnboardingMutation.mutate,
    isCompletingStep: completeStepMutation.isPending,
    isSkipping: skipOnboardingMutation.isPending,
  };
}