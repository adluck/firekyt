/**
 * Analytics tracking utilities for site views and link performance
 */

export interface PageViewEvent {
  siteId: number;
  contentId?: number;
  pageUrl?: string;
  userId?: number;
}

export interface LinkViewEvent {
  linkId: number;
  insertionId?: number;
  siteId?: number;
  userId?: number;
}

/**
 * Track a page view for analytics
 */
export async function trackPageView(event: PageViewEvent): Promise<void> {
  try {
    await fetch('/api/track/page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

/**
 * Track a link view for link performance analytics
 */
export async function trackLinkView(event: LinkViewEvent): Promise<void> {
  try {
    await fetch('/api/track/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Failed to track link view:', error);
  }
}

/**
 * Auto-track page views based on current site context
 */
export function setupPageViewTracking(siteId: number, contentId?: number): void {
  // Track initial page view
  trackPageView({
    siteId,
    contentId,
    pageUrl: window.location.href,
  });

  // Track when user returns to page (visibility API)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      trackPageView({
        siteId,
        contentId,
        pageUrl: window.location.href,
      });
    }
  });
}