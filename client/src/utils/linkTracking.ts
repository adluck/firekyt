// Client-side link tracking utilities

/**
 * Track a link view when content is loaded
 */
export async function trackLinkView(linkId: number, insertionId?: number, siteId?: number) {
  try {
    await fetch('/api/track/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkId,
        insertionId,
        siteId,
        userId: 1 // Will be replaced with actual user tracking
      })
    });
  } catch (error) {
    console.warn('Failed to track link view:', error);
  }
}

/**
 * Generate a tracking URL for a link
 */
export function generateTrackingUrl(linkId: number, originalUrl: string, trackingParams?: any): string {
  const baseUrl = window.location.origin;
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
 * Convert intelligent links in content to tracking URLs
 */
export function convertLinksToTrackingUrls(content: string, linkMappings: Array<{
  linkId: number;
  originalUrl: string;
  insertionId?: number;
  siteId?: number;
}>): string {
  let processedContent = content;
  
  linkMappings.forEach(({ linkId, originalUrl, insertionId, siteId }) => {
    const trackingUrl = generateTrackingUrl(linkId, originalUrl, {
      insertionId,
      siteId,
      sessionId: generateSessionId()
    });
    
    // Replace the original URL with the tracking URL in the content
    processedContent = processedContent.replace(
      new RegExp(escapeRegExp(originalUrl), 'g'),
      trackingUrl
    );
  });
  
  return processedContent;
}

/**
 * Generate a simple session ID for tracking
 */
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Track conversion when a purchase is made
 */
export async function trackConversion(linkId: number, revenue: number, commissionRate?: number, eventData?: any) {
  try {
    await fetch('/api/track/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkId,
        revenue,
        commissionRate,
        eventData,
        userId: 1 // Will be replaced with actual user tracking
      })
    });
  } catch (error) {
    console.warn('Failed to track conversion:', error);
  }
}