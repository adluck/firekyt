import { apiRequest } from "./api";
import type { User, LoginCredentials, RegisterData, AuthResponse } from "@/types";

// JWT token management
export const TOKEN_KEY = "authToken";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // Invalid token format
  }
}

export function getTokenPayload(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// Authentication API functions
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json();
  
  if (data.token) {
    setStoredToken(data.token);
  }
  
  return data;
}

export async function registerUser(userData: RegisterData): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/register", userData);
  const data = await response.json();
  
  if (data.token) {
    setStoredToken(data.token);
  }
  
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      removeStoredToken();
      return null;
    }

    const response = await apiRequest("GET", "/api/auth/me");
    const data = await response.json();
    return data.user;
  } catch (error) {
    // Token might be invalid, remove it
    removeStoredToken();
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    // Optional: Call logout endpoint if you want to blacklist tokens
    // await apiRequest("POST", "/api/auth/logout");
  } catch (error) {
    // Ignore logout API errors
    console.warn("Logout API call failed:", error);
  } finally {
    removeStoredToken();
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest("POST", "/api/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest("PUT", "/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

// User profile management
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  const response = await apiRequest("PUT", "/api/auth/profile", updates);
  return response.json();
}

export async function deleteUserAccount(): Promise<void> {
  await apiRequest("DELETE", "/api/auth/account");
  removeStoredToken();
}

// Permission helpers
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  // Define permissions based on subscription tier
  const permissions = {
    free: [
      'basic_content_generation',
      'view_analytics',
    ],
    basic: [
      'basic_content_generation',
      'seo_optimization',
      'affiliate_links',
      'view_analytics',
      'site_creation',
    ],
    pro: [
      'advanced_content_generation',
      'seo_optimization',
      'affiliate_links',
      'analytics',
      'brand_voice',
      'view_analytics',
      'site_creation',
      'bulk_operations',
    ],
    agency: [
      'advanced_content_generation',
      'seo_optimization',
      'affiliate_links',
      'analytics',
      'brand_voice',
      'white_label',
      'priority_support',
      'view_analytics',
      'site_creation',
      'bulk_operations',
      'team_management',
      'custom_integrations',
    ],
  };

  const userPermissions = permissions[user.subscriptionTier as keyof typeof permissions] || permissions.free;
  return userPermissions.includes(permission);
}

export function canAccessFeature(user: User | null, feature: string): boolean {
  return hasPermission(user, feature);
}

export function getSubscriptionLimits(tier: string) {
  const limits = {
    free: {
      sites: 1,
      contentPerMonth: 5,
      apiCallsPerMonth: 100,
      features: ['basic_content_generation'],
    },
    basic: {
      sites: 3,
      contentPerMonth: 25,
      apiCallsPerMonth: 1000,
      features: ['basic_content_generation', 'seo_optimization', 'affiliate_links'],
    },
    pro: {
      sites: 10,
      contentPerMonth: 100,
      apiCallsPerMonth: 5000,
      features: ['advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice'],
    },
    agency: {
      sites: -1,
      contentPerMonth: 500,
      apiCallsPerMonth: 25000,
      features: ['advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support'],
    },
  };

  return limits[tier as keyof typeof limits] || limits.free;
}

// Authentication state helpers
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  return token !== null && !isTokenExpired(token);
}

export function requireAuth(): void {
  if (!isAuthenticated()) {
    throw new Error("Authentication required");
  }
}

// Session management
export function extendSession(): void {
  const token = getStoredToken();
  if (token && !isTokenExpired(token)) {
    // Refresh token if it's close to expiration (within 1 hour)
    const payload = getTokenPayload(token);
    const exp = payload.exp * 1000;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (exp - now < oneHour) {
      // TODO: Implement token refresh endpoint
      console.info("Token approaching expiration, consider refreshing");
    }
  }
}

// Error handling helpers
export function isAuthError(error: any): boolean {
  return error?.status === 401 || error?.status === 403;
}

export function handleAuthError(error: any): void {
  if (isAuthError(error)) {
    removeStoredToken();
    // Redirect to login or trigger auth state update
    window.location.href = "/login";
  }
}

// Utility functions for form validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }
  
  if (username.length > 30) {
    errors.push("Username must be less than 30 characters");
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, underscores, and dashes");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Two-factor authentication helpers (for future implementation)
export async function enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
  const response = await apiRequest("POST", "/api/auth/2fa/enable");
  return response.json();
}

export async function verifyTwoFactor(code: string): Promise<void> {
  await apiRequest("POST", "/api/auth/2fa/verify", { code });
}

export async function disableTwoFactor(password: string): Promise<void> {
  await apiRequest("POST", "/api/auth/2fa/disable", { password });
}
