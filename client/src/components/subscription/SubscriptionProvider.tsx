import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";

interface SubscriptionContextType {
  subscription: any;
  isLoading: boolean;
  canAccess: (feature: string) => boolean;
  hasReachedLimit: (feature: string) => boolean;
  getUsage: (feature: string) => number;
  getLimit: (feature: string) => number;
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    enabled: isAuthenticated && !!user,
  });

  const subscription = dashboardData || null;

  const canAccess = (feature: string): boolean => {
    if (!subscription?.limits) return false;
    return subscription.limits.features.includes(feature);
  };

  const hasReachedLimit = (feature: string): boolean => {
    if (!subscription?.usage || !subscription?.limits) return false;
    
    const currentUsage = subscription.usage[feature] || 0;
    const limit = getLimit(feature);
    
    return limit !== -1 && currentUsage >= limit;
  };

  const getUsage = (feature: string): number => {
    return subscription?.usage?.[feature] || 0;
  };

  const getLimit = (feature: string): number => {
    if (!subscription?.limits) return 0;
    
    switch (feature) {
      case 'sites':
        return subscription.limits.sites;
      case 'content_generation':
        return subscription.limits.contentPerMonth;
      case 'api_calls':
        return subscription.limits.apiCallsPerMonth;
      default:
        return 0;
    }
  };

  const value = {
    subscription,
    isLoading,
    canAccess,
    hasReachedLimit,
    getUsage,
    getLimit,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
