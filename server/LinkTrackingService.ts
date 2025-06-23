import { storage } from './storage';

export interface TrackingEvent {
  linkId: number;
  insertionId?: number;
  siteId?: number;
  eventType: 'view' | 'click' | 'conversion';
  userId: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  revenue?: number;
  commissionRate?: number;
  eventData?: any;
}

export class LinkTrackingService {
  
  /**
   * Track a link event (view, click, conversion)
   */
  async trackEvent(event: TrackingEvent): Promise<void> {
    try {
      await storage.createLinkTracking({
        userId: event.userId,
        linkId: event.linkId,
        insertionId: event.insertionId,
        siteId: event.siteId,
        eventType: event.eventType,
        eventData: event.eventData || {},
        revenue: event.revenue?.toString(),
        commissionRate: event.commissionRate?.toString(),
        sessionId: event.sessionId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        referrer: event.referrer
      });

      console.log(`Tracked ${event.eventType} event for link ${event.linkId}`);
    } catch (error) {
      console.error('Error tracking link event:', error);
      throw error;
    }
  }

  /**
   * Track a link view (when content is loaded)
   */
  async trackView(params: {
    linkId: number;
    insertionId?: number;
    siteId?: number;
    userId: number;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    await this.trackEvent({
      ...params,
      eventType: 'view'
    });
  }

  /**
   * Track a link click
   */
  async trackClick(params: {
    linkId: number;
    insertionId?: number;
    siteId?: number;
    userId: number;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    await this.trackEvent({
      ...params,
      eventType: 'click'
    });
  }

  /**
   * Track a conversion with revenue and commission
   */
  async trackConversion(params: {
    linkId: number;
    insertionId?: number;
    siteId?: number;
    userId: number;
    revenue: number;
    commissionRate: number;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    eventData?: any;
  }): Promise<void> {
    await this.trackEvent({
      ...params,
      eventType: 'conversion'
    });
  }

  /**
   * Process a tracked click - records the click and returns the redirect URL
   */
  async processTrackedClick(
    linkId: number, 
    originalUrl: string, 
    trackingData: any
  ): Promise<string> {
    try {
      // Track the click event
      await this.trackClick({
        linkId,
        insertionId: trackingData.insertionId,
        siteId: trackingData.siteId,
        userId: 1, // Default user for anonymous tracking
        sessionId: trackingData.sessionId,
        ipAddress: trackingData.ipAddress,
        userAgent: trackingData.userAgent,
        referrer: trackingData.referrer
      });

      // Return the original URL for redirect
      return originalUrl;
    } catch (error) {
      console.error('Error processing tracked click:', error);
      // Even if tracking fails, still redirect to the original URL
      return originalUrl;
    }
  }

  /**
   * Get comprehensive performance stats for a link
   */
  async getLinkPerformanceStats(linkId: number, days: number = 30): Promise<{
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    clickThroughRate: number;
    conversionRate: number;
    averageCommission: number;
    recentActivity: any[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tracking = await storage.getLinkTracking(linkId, startDate);

    const views = tracking.filter(t => t.eventType === 'view');
    const clicks = tracking.filter(t => t.eventType === 'click');
    const conversions = tracking.filter(t => t.eventType === 'conversion');

    const totalViews = views.length;
    const totalClicks = clicks.length;
    const totalConversions = conversions.length;
    const totalRevenue = conversions.reduce((sum, t) => sum + Number(t.revenue || 0), 0);

    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const averageCommission = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    // Get recent activity (last 10 events)
    const recentActivity = tracking
      .slice(0, 10)
      .map(t => ({
        eventType: t.eventType,
        timestamp: t.timestamp,
        revenue: t.revenue,
        sessionId: t.sessionId
      }));

    return {
      totalViews,
      totalClicks,
      totalConversions,
      totalRevenue,
      clickThroughRate,
      conversionRate,
      averageCommission,
      recentActivity
    };
  }

  /**
   * Generate a tracking URL for a link
   */
  generateTrackingUrl(linkId: number, originalUrl: string, trackingParams?: any): string {
    const baseUrl = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN || 'https://c452b6e1-7450-487d-9a83-f5b3f95ecfa2-00-18lteac2m5pu5.worf.replit.dev';
    const trackingUrl = new URL(`${baseUrl}/api/track/click/${linkId}`);
    
    // Add the original URL as a parameter
    trackingUrl.searchParams.set('url', originalUrl);
    
    // Add any additional tracking parameters
    if (trackingParams) {
      Object.entries(trackingParams).forEach(([key, value]) => {
        trackingUrl.searchParams.set(key, String(value));
      });
    }
    
    return trackingUrl.toString();
  }

  /**
   * Process a tracked click and redirect to the original URL
   */
  async processTrackedClick(
    linkId: number, 
    originalUrl: string, 
    trackingData: {
      userId?: number;
      insertionId?: number;
      siteId?: number;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
    }
  ): Promise<string> {
    // Track the click
    if (trackingData.userId) {
      await this.trackClick({
        linkId,
        ...trackingData
      });
    }

    // Return the original URL for redirect
    return originalUrl;
  }
}

export const linkTrackingService = new LinkTrackingService();