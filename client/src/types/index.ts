import type { 
  User, 
  Site, 
  Content, 
  Analytics, 
  Usage, 
  AffiliateProgram,
  InsertUser,
  InsertSite,
  InsertContent,
  InsertAnalytics,
  InsertUsage,
  InsertAffiliateProgram
} from "@shared/schema";

// Re-export types from schema
export type {
  User,
  Site,
  Content,
  Analytics,
  Usage,
  AffiliateProgram,
  InsertUser,
  InsertSite,
  InsertContent,
  InsertAnalytics,
  InsertUsage,
  InsertAffiliateProgram,
};

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

// Subscription types
export interface SubscriptionLimits {
  sites: number;
  contentPerMonth: number;
  apiCallsPerMonth: number;
  features: string[];
}

export interface UsageData {
  [feature: string]: number;
}

export interface DashboardOverview {
  totalSites: number;
  totalContent: number;
  totalRevenue: number;
  totalViews: number;
  totalClicks: number;
  conversionRate: string;
}

export interface DashboardData {
  overview: DashboardOverview;
  usage: UsageData;
  limits: SubscriptionLimits;
}

// Content generation types
export interface ContentGenerationParams {
  contentType: string;
  topic: string;
  keywords: string[];
  targetAudience: string;
  brandVoice?: string;
  niche?: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
}

// Analytics types
export interface AnalyticsDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface ChartData {
  title: string;
  data: AnalyticsDataPoint[];
  dataKey: string;
  color?: string;
}

// Subscription plan types
export interface SubscriptionPlan {
  tier: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  priceId: string;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// Theme types
export type Theme = "light" | "dark";

// Component prop types
export interface CardHoverProps {
  className?: string;
  children: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  validation?: any;
}

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
}

// Toast types
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// Utility types
export type Status = "active" | "inactive" | "pending" | "suspended";
export type ContentStatus = "draft" | "published" | "scheduled" | "archived";
export type ContentType = "blog_post" | "product_review" | "comparison" | "buying_guide";
export type BrandVoice = "professional" | "casual" | "friendly" | "authoritative";
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "past_due" | "trialing";
export type SubscriptionTier = "free" | "basic" | "pro" | "agency";
