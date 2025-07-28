// Database fallback utilities for handling connectivity issues
import { storage } from '../storage';

export class DatabaseFallbackManager {
  private static isHealthy = true;
  private static lastHealthCheck = 0;
  private static healthCheckInterval = 30000; // 30 seconds

  static async checkDatabaseHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isHealthy;
    }

    try {
      // Simple health check - try to get any user
      await storage.getUser(1);
      this.isHealthy = true;
      this.lastHealthCheck = now;
      return true;
    } catch (error: any) {
      if (error.message?.includes('endpoint has been disabled')) {
        this.isHealthy = false;
        console.warn('Database health check failed: endpoint disabled');
      } else {
        this.isHealthy = true; // Other errors might be temporary
      }
      this.lastHealthCheck = now;
      return this.isHealthy;
    }
  }

  static async withDatabaseFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    try {
      const isHealthy = await this.checkDatabaseHealth();
      if (!isHealthy) {
        return await fallback();
      }
      return await operation();
    } catch (error: any) {
      if (error.message?.includes('endpoint has been disabled')) {
        console.warn('Database operation failed, using fallback');
        return await fallback();
      }
      throw error;
    }
  }

  // Emergency demo user for development when database is unavailable
  static getDemoUser() {
    return {
      id: 1,
      email: "demo@firekyt.com",
      username: "demo_user",
      role: "admin",
      subscriptionTier: "admin",
      subscriptionStatus: "active"
    };
  }

  // Emergency analytics data for when database is unavailable
  static getDemoAnalytics() {
    return {
      pageViews: 125,
      clicks: 89,
      conversions: 12,
      revenue: 450.75,
      conversionRate: 13.5,
      clickThroughRate: 71.2,
      topPerformingContent: [
        { title: "Gaming Headset Review", views: 45, clicks: 32 },
        { title: "Best Laptops 2024", views: 38, clicks: 28 }
      ]
    };
  }

  // Emergency content data
  static getDemoContent() {
    return [
      {
        id: 1,
        title: "Best Gaming Headsets 2024",
        content: "Emergency fallback content - database service temporarily unavailable",
        status: "published",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Emergency sites data
  static getDemoSites() {
    return [
      {
        id: 1,
        name: "Demo Site",
        url: "https://example.com",
        platform: "wordpress",
        status: "active",
        isActive: true
      }
    ];
  }
}