import { apiRequest } from "./api";
import type { 
  SubscriptionPlan, 
  SubscriptionLimits, 
  UsageData, 
  DashboardData,
  User 
} from "@/types";

// Subscription tiers and pricing
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    priceId: "",
    features: [
      "1 affiliate site",
      "5 AI-generated articles per month",
      "100 API calls per month",
      "Basic content templates",
      "Community support"
    ],
    limits: {
      sites: 1,
      contentPerMonth: 5,
      apiCallsPerMonth: 100,
      features: ['basic_content_generation'],
    }
  },
  basic: {
    name: "Basic",
    price: 24,
    priceId: "price_basic",
    features: [
      "3 affiliate sites",
      "25 AI-generated articles per month",
      "1,000 API calls per month",
      "SEO optimization tools",
      "Affiliate link management",
      "Email support"
    ],
    limits: {
      sites: 3,
      contentPerMonth: 25,
      apiCallsPerMonth: 1000,
      features: ['basic_content_generation', 'seo_optimization', 'affiliate_links'],
    }
  },
  pro: {
    name: "Pro",
    price: 59,
    priceId: "price_pro",
    features: [
      "10 affiliate sites",
      "100 AI-generated articles per month",
      "5,000 API calls per month",
      "Advanced SEO & analytics",
      "Brand voice training",
      "Affiliate link tracking",
      "Priority support"
    ],
    limits: {
      sites: 10,
      contentPerMonth: 100,
      apiCallsPerMonth: 5000,
      features: ['advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice'],
    }
  },
  agency: {
    name: "Agency",
    price: 179,
    priceId: "price_agency",
    features: [
      "Unlimited affiliate sites",
      "500 AI-generated articles per month",
      "25,000 API calls per month",
      "White-label options",
      "Advanced analytics dashboard",
      "Custom brand voices",
      "Dedicated account manager",
      "Custom integrations"
    ],
    limits: {
      sites: -1,
      contentPerMonth: 500,
      apiCallsPerMonth: 25000,
      features: ['advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support'],
    }
  }
} as const;

// Subscription API functions
export async function createSubscription(priceId: string): Promise<{
  subscriptionId: string;
  clientSecret: string;
}> {
  const response = await apiRequest("POST", "/api/subscription/create", { priceId });
  return response.json();
}

export async function getOrCreateSubscription(): Promise<{
  subscriptionId: string;
  clientSecret: string;
}> {
  const response = await apiRequest("POST", "/api/subscription/get-or-create");
  return response.json();
}

export async function openCustomerPortal(): Promise<{ url: string }> {
  const response = await apiRequest("POST", "/api/subscription/portal");
  return response.json();
}

export async function cancelSubscription(): Promise<void> {
  await apiRequest("POST", "/api/subscription/cancel");
}

export async function resumeSubscription(): Promise<void> {
  await apiRequest("POST", "/api/subscription/resume");
}

export async function updateSubscription(priceId: string): Promise<void> {
  await apiRequest("PUT", "/api/subscription/update", { priceId });
}

export async function getSubscriptionDetails(): Promise<any> {
  const response = await apiRequest("GET", "/api/subscription/details");
  return response.json();
}

// Usage tracking
export async function getCurrentUsage(): Promise<UsageData> {
  const response = await apiRequest("GET", "/api/usage/current");
  return response.json();
}

export async function trackUsage(feature: string, amount: number = 1): Promise<void> {
  await apiRequest("POST", "/api/usage/track", { feature, amount });
}

export async function getUsageHistory(startDate: Date, endDate: Date): Promise<UsageData[]> {
  const response = await apiRequest("GET", `/api/usage/history?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
  return response.json();
}

// Dashboard analytics
export async function getDashboardData(period: number = 30): Promise<DashboardData> {
  const response = await apiRequest("GET", `/api/analytics/dashboard?period=${period}`);
  return response.json();
}

// Subscription utility functions
export function getSubscriptionLimits(tier: string): SubscriptionLimits {
  const subscription = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  const limits = subscription?.limits || SUBSCRIPTION_TIERS.free.limits;
  return {
    sites: limits.sites,
    contentPerMonth: limits.contentPerMonth,
    apiCallsPerMonth: limits.apiCallsPerMonth,
    features: [...limits.features]
  };
}

export function canAccessFeature(user: User | null, feature: string): boolean {
  if (!user) return false;
  
  const limits = getSubscriptionLimits(user.subscriptionTier);
  return limits.features.includes(feature);
}

export function hasReachedLimit(usage: UsageData, limits: SubscriptionLimits, feature: string): boolean {
  const currentUsage = usage[feature] || 0;
  
  switch (feature) {
    case 'content_generation':
      return limits.contentPerMonth !== -1 && currentUsage >= limits.contentPerMonth;
    case 'api_calls':
      return limits.apiCallsPerMonth !== -1 && currentUsage >= limits.apiCallsPerMonth;
    case 'sites':
      return limits.sites !== -1 && currentUsage >= limits.sites;
    default:
      return false;
  }
}

export function getUsagePercentage(usage: UsageData, limits: SubscriptionLimits, feature: string): number {
  const currentUsage = usage[feature] || 0;
  
  switch (feature) {
    case 'content_generation':
      return limits.contentPerMonth === -1 ? 0 : (currentUsage / limits.contentPerMonth) * 100;
    case 'api_calls':
      return limits.apiCallsPerMonth === -1 ? 0 : (currentUsage / limits.apiCallsPerMonth) * 100;
    case 'sites':
      return limits.sites === -1 ? 0 : (currentUsage / limits.sites) * 100;
    default:
      return 0;
  }
}

export function getRemainingUsage(usage: UsageData, limits: SubscriptionLimits, feature: string): number {
  const currentUsage = usage[feature] || 0;
  
  switch (feature) {
    case 'content_generation':
      return limits.contentPerMonth === -1 ? Infinity : Math.max(0, limits.contentPerMonth - currentUsage);
    case 'api_calls':
      return limits.apiCallsPerMonth === -1 ? Infinity : Math.max(0, limits.apiCallsPerMonth - currentUsage);
    case 'sites':
      return limits.sites === -1 ? Infinity : Math.max(0, limits.sites - currentUsage);
    default:
      return 0;
  }
}

// Subscription status helpers
export function isSubscriptionActive(user: User | null): boolean {
  if (!user) return false;
  return user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
}

export function isSubscriptionExpired(user: User | null): boolean {
  if (!user || !user.currentPeriodEnd) return false;
  return new Date(user.currentPeriodEnd) < new Date();
}

export function getSubscriptionStatus(user: User | null): string {
  if (!user) return 'No subscription';
  
  switch (user.subscriptionStatus) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Payment overdue';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Payment incomplete';
    default:
      return 'Inactive';
  }
}

export function getNextBillingDate(user: User | null): Date | null {
  if (!user || !user.currentPeriodEnd) return null;
  return new Date(user.currentPeriodEnd);
}

export function getDaysUntilRenewal(user: User | null): number {
  const nextBilling = getNextBillingDate(user);
  if (!nextBilling) return 0;
  
  const now = new Date();
  const diffTime = nextBilling.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Pricing helpers
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getAnnualDiscount(monthlyPrice: number, annualPrice: number): number {
  const annualMonthlyPrice = annualPrice / 12;
  return Math.round(((monthlyPrice - annualMonthlyPrice) / monthlyPrice) * 100);
}

export function calculateProration(currentPlan: string, newPlan: string, daysRemaining: number): number {
  const currentPrice = SUBSCRIPTION_TIERS[currentPlan as keyof typeof SUBSCRIPTION_TIERS]?.price || 0;
  const newPrice = SUBSCRIPTION_TIERS[newPlan as keyof typeof SUBSCRIPTION_TIERS]?.price || 0;
  
  const dailyCurrentPrice = currentPrice / 30;
  const dailyNewPrice = newPrice / 30;
  
  const refund = dailyCurrentPrice * daysRemaining;
  const charge = dailyNewPrice * daysRemaining;
  
  return Math.max(0, charge - refund);
}

// Feature gating
export function requireFeature(user: User | null, feature: string): void {
  if (!canAccessFeature(user, feature)) {
    throw new Error(`This feature requires a higher subscription tier. Current tier: ${user?.subscriptionTier || 'none'}`);
  }
}

export function requireUsageLimit(usage: UsageData, limits: SubscriptionLimits, feature: string): void {
  if (hasReachedLimit(usage, limits, feature)) {
    throw new Error(`You have reached your ${feature} limit for this billing period. Please upgrade your plan to continue.`);
  }
}

// Analytics helpers
export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return revenue > 0 ? Infinity : 0;
  return ((revenue - cost) / cost) * 100;
}

export function calculateConversionRate(conversions: number, clicks: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function formatMetricValue(value: number, type: 'currency' | 'percentage' | 'number'): string {
  switch (type) {
    case 'currency':
      return formatPrice(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'number':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}

// Trial management
export function isInTrial(user: User | null): boolean {
  return user?.subscriptionStatus === 'trialing';
}

export function getTrialDaysRemaining(user: User | null): number {
  if (!user || !user.trialEndsAt) return 0;
  
  const now = new Date();
  const trialEnd = new Date(user.trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function hasTrialExpired(user: User | null): boolean {
  if (!user || !user.trialEndsAt) return false;
  return new Date(user.trialEndsAt) < new Date();
}

// Webhook helpers (for server-side processing)
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // This would typically be done on the server side
  // Implementation depends on your webhook provider (Stripe, etc.)
  return true; // Placeholder
}

export function processSubscriptionEvent(event: any): void {
  // Handle subscription lifecycle events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      // Process the event
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Export all subscription plans for easy access
export { SUBSCRIPTION_TIERS as plans };

// Default export for common subscription operations
export default {
  createSubscription,
  openCustomerPortal,
  getCurrentUsage,
  getDashboardData,
  canAccessFeature,
  hasReachedLimit,
  getSubscriptionLimits,
  isSubscriptionActive,
  formatPrice,
};
