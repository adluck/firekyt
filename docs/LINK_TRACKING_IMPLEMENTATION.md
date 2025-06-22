# Link Tracking Implementation Guide

## Overview

The FireKyt platform now includes comprehensive link tracking for intelligent links. This system tracks clicks, views, conversions, and commission data when intelligent links are published and used in content.

## How It Works

### 1. Link Creation and Management
- Intelligent links are created through the Link Intelligence interface
- Each link has tracking parameters including commission rates and performance goals
- Links are categorized and can be assigned to specific sites

### 2. Content Publishing with Tracking
When content containing intelligent links is published:

1. **Link Insertion**: AI suggests optimal placement for links in content
2. **Tracking URL Generation**: Original affiliate URLs are converted to tracking URLs
3. **Content Delivery**: Published content contains tracking URLs instead of direct affiliate links

### 3. Tracking Events

#### Link Views
- Automatically tracked when content containing links is loaded
- Records: timestamp, user agent, referrer, IP address
- Used for calculating impression metrics

#### Link Clicks
- Tracked when users click on intelligent links
- Redirects through tracking endpoint: `/api/track/click/:linkId`
- Records: same data as views plus click-specific metrics
- Used for calculating click-through rates

#### Conversions
- Tracked when purchases are made through affiliate links
- Records: revenue amount, commission rate, conversion data
- Used for calculating conversion rates and total revenue

## Database Schema

### Link Tracking Table
```sql
link_tracking (
  id: serial PRIMARY KEY,
  user_id: integer NOT NULL,
  link_id: integer NOT NULL,
  insertion_id: integer (optional),
  site_id: integer (optional),
  event_type: text NOT NULL, -- 'view', 'click', 'conversion'
  event_data: jsonb,
  revenue: decimal(10,2),
  commission_rate: decimal(5,2),
  session_id: text,
  ip_address: text,
  user_agent: text,
  referrer: text,
  timestamp: timestamp DEFAULT NOW()
)
```

### Link Insertions Table
```sql
link_insertions (
  id: serial PRIMARY KEY,
  user_id: integer NOT NULL,
  content_id: integer NOT NULL,
  link_id: integer NOT NULL,
  site_id: integer,
  insertion_type: text NOT NULL, -- 'automatic', 'manual', 'ai-suggested'
  insertion_context: text,
  anchor_text: text NOT NULL,
  position: integer,
  is_active: boolean DEFAULT true,
  performance_data: jsonb
)
```

## API Endpoints

### Tracking Endpoints

#### Track Click and Redirect
```
GET /api/track/click/:linkId?url=ORIGINAL_URL&insertionId=123&siteId=456
```
- Records click event
- Redirects to original affiliate URL
- Returns 302 redirect response

#### Track View
```
POST /api/track/view
Content-Type: application/json

{
  "linkId": 123,
  "insertionId": 456,
  "siteId": 789,
  "userId": 1
}
```

#### Track Conversion
```
POST /api/track/conversion
Content-Type: application/json

{
  "linkId": 123,
  "revenue": 29.99,
  "commissionRate": 5.0,
  "eventData": {...}
}
```

### Analytics Endpoints

#### Get Link Performance Stats
```
GET /api/links/:linkId/stats?days=30
```
Returns:
```json
{
  "totalViews": 1250,
  "totalClicks": 45,
  "totalConversions": 3,
  "totalRevenue": 89.97,
  "clickThroughRate": 3.6,
  "conversionRate": 6.7,
  "averageCommission": 29.99,
  "recentActivity": [...]
}
```

#### Generate Tracking URL
```
POST /api/links/:linkId/tracking-url
Content-Type: application/json

{
  "originalUrl": "https://affiliate-partner.com/product/123?ref=xyz",
  "trackingParams": {
    "insertionId": 456,
    "siteId": 789
  }
}
```

## Implementation Details

### Server-Side Components

#### LinkTrackingService
- `trackEvent()`: Core tracking method
- `trackView()`: Track link impressions
- `trackClick()`: Track link clicks
- `trackConversion()`: Track sales/conversions
- `getLinkPerformanceStats()`: Generate analytics
- `generateTrackingUrl()`: Create tracking URLs
- `processTrackedClick()`: Handle click tracking and redirect

### Client-Side Components

#### LinkPerformanceStats Component
- Displays real-time performance metrics
- Shows views, clicks, conversions, revenue
- Calculates CTR and conversion rates
- Lists recent activity

#### Link Tracking Utilities
- `trackLinkView()`: Client-side view tracking
- `generateTrackingUrl()`: Create tracking URLs
- `convertLinksToTrackingUrls()`: Process content links
- `trackConversion()`: Client-side conversion tracking

## Usage Examples

### 1. Publishing Content with Tracking
```javascript
// Convert content links to tracking URLs before publishing
const linkMappings = [
  {
    linkId: 123,
    originalUrl: "https://affiliate.com/product/456",
    insertionId: 789,
    siteId: 1
  }
];

const trackedContent = convertLinksToTrackingUrls(originalContent, linkMappings);
```

### 2. Manual Conversion Tracking
```javascript
// Track conversion when purchase is confirmed
await trackConversion(123, 29.99, 5.0, {
  orderId: "ORD-12345",
  productId: "PROD-789",
  customerType: "new"
});
```

### 3. Getting Performance Data
```javascript
// Fetch performance stats for a link
const stats = await fetch('/api/links/123/stats?days=30').then(r => r.json());
console.log(`CTR: ${stats.clickThroughRate}%`);
console.log(`Revenue: $${stats.totalRevenue}`);
```

## Performance Metrics

The system tracks and calculates:

- **Total Views**: Number of times content with the link was viewed
- **Total Clicks**: Number of times the link was clicked
- **Total Conversions**: Number of purchases made through the link
- **Total Revenue**: Sum of all conversion revenue
- **Click-Through Rate**: (Clicks / Views) × 100
- **Conversion Rate**: (Conversions / Clicks) × 100
- **Average Commission**: Total Revenue / Total Conversions

## Privacy and Compliance

- IP addresses are stored for fraud prevention
- User agents help with device analytics
- Session IDs enable funnel tracking
- All tracking complies with GDPR requirements
- Users can opt out of detailed tracking

## Integration with Publishing

When content is published to external platforms:

1. Content is processed to replace affiliate URLs with tracking URLs
2. Tracking URLs redirect through FireKyt servers
3. Click and conversion data is captured
4. Analytics are available in real-time through the dashboard

This comprehensive tracking system ensures that users can monitor the performance of their intelligent links across all publishing platforms and optimize their affiliate marketing strategy based on real data.