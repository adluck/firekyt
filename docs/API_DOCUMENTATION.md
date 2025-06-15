# Affiliate Marketing Platform API Documentation

## Overview

This document provides comprehensive API documentation for the affiliate marketing platform's core modules, including performance optimization systems, AI services, and business logic APIs.

## Performance Optimization APIs

### Cache Manager API

The CacheManager provides enterprise-grade multi-layer caching with intelligent fallback support and real-time performance monitoring.

#### Class: `CacheManager`

**Purpose**: High-performance multi-layer cache management with TTL, LRU eviction, and memory optimization.

**Architecture**: 
- Memory Cache: High-frequency data (1-hour TTL, 10K keys)
- Query Cache: Database results (15-minute TTL, 5K keys)  
- Session Cache: User sessions (30-minute TTL, 50K keys)
- Analytics Cache: Metrics data (5-minute TTL, 1K keys)

#### Methods

##### `getInstance(): CacheManager`
Returns singleton cache manager instance.
```typescript
const cache = CacheManager.getInstance();
```

##### `get(key, layer?, fallback?, customTTL?): Promise<any>`
Retrieves data from cache with intelligent fallback support.

**Parameters:**
- `key: string` - Cache key identifier
- `layer: 'memory' | 'query' | 'session' | 'analytics'` - Target cache layer (default: 'memory')
- `fallback: () => Promise<any>` - Optional function to execute on cache miss
- `customTTL: number` - Optional custom expiration time in seconds

**Returns:** Cached data or fallback result

**Examples:**
```typescript
// Simple retrieval
const userData = await cache.get('user:123');

// With database fallback
const userData = await cache.get('user:123', 'memory', async () => {
  return await database.getUser(123);
});

// Analytics data with custom TTL
const metrics = await cache.get('metrics:daily', 'analytics', 
  () => calculateDailyMetrics(), 
  3600 // 1 hour
);
```

##### `set(key, value, layer?, ttl?): boolean`
Stores data in specified cache layer.

**Parameters:**
- `key: string` - Cache key identifier
- `value: any` - Data to cache
- `layer: string` - Target cache layer (default: 'memory')
- `ttl: number` - Optional custom TTL in seconds

**Returns:** Success boolean

##### `invalidatePattern(pattern): number`
Removes all cache entries matching pattern.

**Parameters:**
- `pattern: string` - Wildcard pattern (e.g., 'user:*', 'analytics:*')

**Returns:** Number of keys removed

##### `getStats(): CacheStats`
Returns comprehensive cache performance statistics.

**Returns:**
```typescript
{
  hits: number,        // Successful retrievals
  misses: number,      // Cache misses
  hitRatio: number,    // Hit ratio percentage
  sets: number,        // Write operations
  deletes: number,     // Delete operations
  evictions: number    // Automatic evictions
}
```

---

### Rate Limiter API

The RateLimiter implements sliding window algorithms for precise rate limiting with automatic cleanup and burst protection.

#### Class: `RateLimiter`

**Purpose**: Enterprise-grade rate limiting with sliding window algorithm and configurable rules per endpoint.

**Features:**
- Sliding window precision
- Per-user and per-IP tracking
- Configurable rules per endpoint
- Automatic cleanup of expired entries
- Burst protection with customizable windows

#### Rate Limit Rules

| Endpoint | Limit | Window | Purpose |
|----------|-------|---------|---------|
| Authentication | 5 requests | 15 minutes | Prevent brute force |
| API General | 100 requests | 1 minute | General API protection |
| Content Generation | 10 requests | 1 minute | Resource-intensive operations |
| Analytics | 200 requests | 1 minute | Dashboard queries |
| Admin Operations | 50 requests | 1 minute | Administrative actions |
| File Uploads | 5 requests | 1 minute | Upload bandwidth protection |

#### Methods

##### `checkLimit(identifier, endpoint): Promise<RateLimitResult>`
Checks if request is within rate limits.

**Parameters:**
- `identifier: string` - User ID or IP address
- `endpoint: string` - API endpoint path

**Returns:**
```typescript
{
  allowed: boolean,           // Request permitted
  limit: number,             // Maximum requests allowed
  remaining: number,         // Requests remaining in window
  resetTime: number,         // Window reset timestamp
  retryAfter?: number        // Seconds until next allowed request
}
```

**Example:**
```typescript
const result = await rateLimiter.checkLimit('user:123', '/api/content/generate');
if (!result.allowed) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    retryAfter: result.retryAfter
  });
}
```

##### `addRule(endpoint, limit, windowMs): void`
Adds custom rate limiting rule for endpoint.

**Parameters:**
- `endpoint: string` - API endpoint pattern
- `limit: number` - Maximum requests allowed
- `windowMs: number` - Time window in milliseconds

##### `getStats(identifier?): RateLimitStats`
Returns rate limiting statistics.

**Returns:**
```typescript
{
  totalRequests: number,
  blockedRequests: number,
  activeWindows: number,
  cleanupCount: number
}
```

---

### Performance Monitor API

Real-time performance monitoring with automated alerting and trend analysis.

#### Class: `PerformanceMonitor`

**Purpose**: Comprehensive system performance monitoring with real-time metrics collection and automated alerting.

#### Methods

##### `getCurrentMetrics(): SystemMetrics`
Returns current system performance metrics.

**Returns:**
```typescript
{
  responseTime: number,      // Average response time (ms)
  memoryUsage: number,       // Memory usage percentage
  cacheHitRatio: number,     // Cache efficiency percentage
  requestsPerSecond: number, // Current request rate
  errorRate: number,         // Error percentage
  activeConnections: number, // Database connections
  systemLoad: number         // CPU usage percentage
}
```

##### `recordRequest(duration, endpoint, statusCode): void`
Records request performance data.

**Parameters:**
- `duration: number` - Request duration in milliseconds
- `endpoint: string` - API endpoint
- `statusCode: number` - HTTP response code

##### `getPerformanceReport(timeRange): PerformanceReport`
Generates comprehensive performance report.

**Parameters:**
- `timeRange: '1h' | '24h' | '7d' | '30d'` - Analysis period

**Returns:**
```typescript
{
  summary: {
    avgResponseTime: number,
    totalRequests: number,
    errorRate: number,
    cacheEfficiency: number
  },
  trends: {
    responseTimeData: number[],
    requestVolumeData: number[],
    errorRateData: number[]
  },
  alerts: Alert[],
  recommendations: string[]
}
```

---

## AI Services API

### AI Engine Service

Comprehensive AI-powered content generation and optimization services.

#### Class: `AIEngineService`

**Purpose**: Centralized AI operations for content generation, SEO analysis, and optimization recommendations.

#### Content Generation

##### `generateContent(request): Promise<ContentGenerationResponse>`
Generates AI-powered affiliate content.

**Parameters:**
```typescript
{
  keyword: string,                    // Primary keyword
  contentType: ContentType,           // Content format
  toneOfVoice: string,               // Writing style
  targetAudience: string,            // Audience description
  additionalContext?: string,         // Extra context
  brandVoice?: string,               // Brand guidelines
  seoFocus?: boolean,                // SEO optimization
  wordCount?: number                 // Target length
}
```

**Content Types:**
- `blog_post` - SEO-optimized blog articles
- `product_comparison` - Product comparison tables
- `review_article` - Product reviews with ratings
- `video_script` - Video content scripts
- `social_post` - Social media content
- `email_campaign` - Email marketing content

**Returns:**
```typescript
{
  contentId: string,
  status: 'pending' | 'completed' | 'error',
  content?: string,
  metadata?: {
    wordCount: number,
    readingTime: number,
    seoScore: number,
    keywords: string[]
  }
}
```

#### SEO Analysis

##### `analyzeSEO(request): Promise<SEOAnalysisResult>`
Performs comprehensive SEO analysis of content.

**Parameters:**
```typescript
{
  content: string,              // Content to analyze
  targetKeywords: string[],     // Keywords to optimize for
  title?: string,               // Page title
  metaDescription?: string      // Meta description
}
```

**Returns:**
```typescript
{
  overallScore: number,         // SEO score (0-100)
  keywordDensity: {
    [keyword: string]: number   // Keyword density percentages
  },
  recommendations: string[],    // Improvement suggestions
  readabilityScore: number,     // Content readability
  technicalIssues: string[],    // Technical SEO issues
  competitorAnalysis?: {
    averageScore: number,
    improvementAreas: string[]
  }
}
```

#### Link Optimization

##### `generateLinkSuggestions(request): Promise<LinkSuggestionResult>`
Generates contextual affiliate link suggestions.

**Parameters:**
```typescript
{
  contentId: number,
  content: string,
  targetKeywords: string[],
  context?: string
}
```

**Returns:**
```typescript
{
  suggestions: Array<{
    position: number,           // Character position in content
    text: string,              // Anchor text
    url: string,               // Affiliate URL
    relevanceScore: number,    // Relevance rating (0-1)
    category: string,          // Product category
    reasoning: string          // Why this link fits
  }>,
  totalSuggestions: number,
  optimizationTips: string[]
}
```

---

## Business Logic APIs

### Content Service

Manages all content creation, editing, and analytics operations.

#### Class: `ContentService`

##### `createContent(userId, request): Promise<Content>`
Creates new affiliate content with SEO optimization.

**Parameters:**
```typescript
{
  title: string,
  content: string,
  contentType: ContentType,
  siteId: number,
  targetKeywords?: string[],
  seoTitle?: string,
  seoDescription?: string,
  status?: 'draft' | 'published' | 'archived'
}
```

##### `getUserContent(userId, filters, page, limit): Promise<ContentList>`
Retrieves user's content with filtering and pagination.

**Parameters:**
- `filters`: Status, type, site, search query filters
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)

**Returns:**
```typescript
{
  items: Content[],
  totalCount: number,
  currentPage: number,
  totalPages: number,
  hasNext: boolean,
  hasPrevious: boolean
}
```

##### `getContentAnalytics(contentId, userId): Promise<ContentAnalytics>`
Returns comprehensive content performance analytics.

**Returns:**
```typescript
{
  views: number,
  uniqueViews: number,
  clicks: number,
  conversionRate: number,
  revenue: number,
  topReferrers: string[],
  performanceScore: number,
  seoMetrics: {
    organicTraffic: number,
    keywordRankings: Array<{
      keyword: string,
      position: number,
      changeFromLast: number
    }>
  }
}
```

---

### Analytics Service

Comprehensive performance tracking and business intelligence.

#### Class: `AnalyticsService`

##### `getDashboardMetrics(userId, period): Promise<PerformanceData>`
Returns dashboard metrics for specified time period.

**Parameters:**
- `period: '7d' | '30d' | '90d' | '1y'` - Analysis timeframe

**Returns:**
```typescript
{
  period: string,
  metrics: {
    totalViews: number,
    uniqueViews: number,
    totalClicks: number,
    conversionRate: number,
    revenue: number,
    topPerformingContent: Content[],
    topPerformingLinks: Link[]
  },
  trends: {
    viewsChange: number,        // Percentage change
    clicksChange: number,
    revenueChange: number
  },
  topKeywords: string[],
  deviceBreakdown: { [device: string]: number },
  trafficSources: { [source: string]: number }
}
```

##### `getRealTimeMetrics(userId): Promise<RealTimeMetrics>`
Returns live performance metrics.

**Returns:**
```typescript
{
  activeUsers: number,
  pageViews: number,
  clickEvents: number,
  revenue: number,
  topPages: Array<{
    page: string,
    views: number
  }>,
  recentActivity: Array<{
    timestamp: Date,
    type: 'view' | 'click' | 'conversion',
    content: string,
    value?: number
  }>
}
```

---

## Error Handling

### Standard Error Responses

All APIs return consistent error formats:

```typescript
{
  error: {
    code: string,           // Error code identifier
    message: string,        // Human-readable message
    details?: any,          // Additional error context
    timestamp: string,      // ISO timestamp
    requestId: string       // Request tracking ID
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 503 | AI service temporarily unavailable |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Authentication & Authorization

### JWT Token Format

```typescript
{
  sub: string,              // User ID
  email: string,            // User email
  role: string,             // User role
  tier: string,             // Subscription tier
  permissions: string[],    // Granted permissions
  iat: number,              // Issued at
  exp: number               // Expiration
}
```

### Required Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique_request_id>
```

---

## Rate Limiting Headers

All API responses include rate limiting information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60000
```

---

## Performance Benchmarks

### API Response Time Targets

| Endpoint Category | Target Response Time | Cache Hit Ratio |
|-------------------|---------------------|-----------------|
| Authentication | < 200ms | N/A |
| Content CRUD | < 500ms | 85% |
| Analytics Dashboard | < 300ms | 90% |
| AI Content Generation | < 30s | 70% |
| Search Operations | < 300ms | 80% |

### System Performance Metrics

- **Concurrent Users**: 1000+ supported
- **Request Throughput**: 500+ requests/second
- **Cache Efficiency**: 85%+ hit ratio
- **Memory Usage**: < 80% of allocated
- **Error Rate**: < 5% under normal load

This API documentation provides comprehensive guidance for integrating with the affiliate marketing platform's performance-optimized systems and business logic services.