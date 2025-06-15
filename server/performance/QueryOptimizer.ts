import { sql, eq, desc, asc, count, sum, avg, and, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { content, analytics, sites, users, contentPerformance, affiliateClicks } from "@shared/schema";
import { cacheManager } from "./CacheManager";

/**
 * Query Optimizer for High-Performance Database Operations
 * Implements optimized queries with caching and batch operations
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  
  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Optimized pagination with proper indexing
   */
  async getPaginatedContent(userId: number, page: number = 1, limit: number = 20, filters?: {
    status?: string;
    siteId?: number;
    contentType?: string;
  }) {
    const cacheKey = `content_paginated_${userId}_${page}_${limit}_${JSON.stringify(filters)}`;
    
    return await cacheManager.getOrSet(cacheKey, async () => {
      const offset = (page - 1) * limit;
      
      // Build dynamic WHERE conditions
      const conditions = [eq(content.userId, userId)];
      
      if (filters?.status) {
        conditions.push(eq(content.status, filters.status));
      }
      if (filters?.siteId) {
        conditions.push(eq(content.siteId, filters.siteId));
      }
      if (filters?.contentType) {
        conditions.push(eq(content.contentType, filters.contentType));
      }

      // Execute optimized query with proper indexing
      const [items, totalCount] = await Promise.all([
        db.select()
          .from(content)
          .where(and(...conditions))
          .orderBy(desc(content.updatedAt))
          .limit(limit)
          .offset(offset),
        
        db.select({ count: count() })
          .from(content)
          .where(and(...conditions))
      ]);

      return {
        items,
        totalCount: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
        currentPage: page,
        hasNextPage: page < Math.ceil(totalCount[0].count / limit),
        hasPreviousPage: page > 1
      };
    }, 900); // 15-minute cache
  }

  /**
   * Optimized analytics aggregation with time-based grouping
   */
  async getAnalyticsAggregation(userId: number, period: string = '30d') {
    const cacheKey = `analytics_agg_${userId}_${period}`;
    
    return await cacheManager.getOrSet(cacheKey, async () => {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Optimized aggregation query
      const result = await db.select({
        totalViews: sum(analytics.views),
        totalClicks: sum(analytics.clicks),
        uniqueViews: count(analytics.id),
        avgEngagement: avg(analytics.sessionDuration)
      })
      .from(analytics)
      .where(and(
        eq(analytics.userId, userId),
        gte(analytics.createdAt, startDate)
      ));

      return result[0] || {
        totalViews: 0,
        totalClicks: 0,
        uniqueViews: 0,
        avgEngagement: 0
      };
    }, 300); // 5-minute cache for analytics
  }

  /**
   * Batch insert operations for high-volume data
   */
  async batchInsertAnalytics(analyticsData: Array<{
    userId: number;
    contentId?: number;
    views: number;
    clicks: number;
    sessionDuration?: number;
    source?: string;
  }>) {
    if (analyticsData.length === 0) return;

    // Use UPSERT for high-performance batch operations
    const values = analyticsData.map(data => ({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.insert(analytics).values(values);
    
    // Invalidate related caches
    const userIds = [...new Set(analyticsData.map(d => d.userId))];
    for (const userId of userIds) {
      await cacheManager.invalidatePattern(`analytics_*_${userId}_*`);
    }
  }

  /**
   * Optimized content performance tracking
   */
  async updateContentPerformance(contentId: number, performanceData: {
    views?: number;
    clicks?: number;
    revenue?: number;
    conversionRate?: number;
  }) {
    const today = new Date().toISOString().split('T')[0];
    
    // Use UPSERT pattern for performance tracking
    await db.insert(contentPerformance)
      .values({
        contentId,
        date: new Date(today),
        views: performanceData.views || 0,
        clicks: performanceData.clicks || 0,
        revenue: performanceData.revenue || 0,
        conversionRate: performanceData.conversionRate || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [contentPerformance.contentId, contentPerformance.date],
        set: {
          views: sql`${contentPerformance.views} + ${performanceData.views || 0}`,
          clicks: sql`${contentPerformance.clicks} + ${performanceData.clicks || 0}`,
          revenue: sql`${contentPerformance.revenue} + ${performanceData.revenue || 0}`,
          updatedAt: new Date()
        }
      });

    // Invalidate related caches
    await cacheManager.invalidate(`content_performance_${contentId}`);
  }

  /**
   * Optimized user content summary
   */
  async getUserContentSummary(userId: number) {
    const cacheKey = `user_content_summary_${userId}`;
    
    return await cacheManager.getOrSet(cacheKey, async () => {
      const [contentStats, siteStats] = await Promise.all([
        // Content statistics
        db.select({
          totalContent: count(),
          publishedContent: count(sql`CASE WHEN ${content.status} = 'published' THEN 1 END`),
          draftContent: count(sql`CASE WHEN ${content.status} = 'draft' THEN 1 END`)
        })
        .from(content)
        .where(eq(content.userId, userId)),
        
        // Site statistics
        db.select({
          totalSites: count(),
          activeSites: count(sql`CASE WHEN ${sites.isActive} = true THEN 1 END`)
        })
        .from(sites)
        .where(eq(sites.userId, userId))
      ]);

      return {
        content: contentStats[0],
        sites: siteStats[0]
      };
    }, 1800); // 30-minute cache
  }

  /**
   * Optimized trending content query
   */
  async getTrendingContent(userId: number, timeframe: string = '7d', limit: number = 10) {
    const cacheKey = `trending_content_${userId}_${timeframe}_${limit}`;
    
    return await cacheManager.getOrSet(cacheKey, async () => {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Complex trending query with performance optimization
      return await db.select({
        id: content.id,
        title: content.title,
        views: sum(contentPerformance.views),
        clicks: sum(contentPerformance.clicks),
        revenue: sum(contentPerformance.revenue),
        score: sql<number>`(
          ${sum(contentPerformance.views)} * 0.3 + 
          ${sum(contentPerformance.clicks)} * 0.5 + 
          ${sum(contentPerformance.revenue)} * 0.2
        )`
      })
      .from(content)
      .leftJoin(contentPerformance, eq(content.id, contentPerformance.contentId))
      .where(and(
        eq(content.userId, userId),
        eq(content.status, 'published'),
        gte(contentPerformance.date, startDate)
      ))
      .groupBy(content.id, content.title)
      .orderBy(desc(sql`score`))
      .limit(limit);
    }, 600); // 10-minute cache
  }

  /**
   * Bulk operations for usage tracking
   */
  async batchUpdateUsage(usageUpdates: Array<{
    userId: number;
    feature: string;
    increment: number;
  }>) {
    if (usageUpdates.length === 0) return;

    // Group updates by user and feature for efficiency
    const groupedUpdates = usageUpdates.reduce((acc, update) => {
      const key = `${update.userId}_${update.feature}`;
      if (!acc[key]) {
        acc[key] = {
          userId: update.userId,
          feature: update.feature,
          totalIncrement: 0
        };
      }
      acc[key].totalIncrement += update.increment;
      return acc;
    }, {} as Record<string, { userId: number; feature: string; totalIncrement: number }>);

    // Execute batch updates
    for (const update of Object.values(groupedUpdates)) {
      await db.execute(sql`
        INSERT INTO usage (user_id, feature, count, period_start, period_end, created_at, updated_at)
        VALUES (${update.userId}, ${update.feature}, ${update.totalIncrement}, 
                date_trunc('month', CURRENT_DATE), 
                date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day',
                NOW(), NOW())
        ON CONFLICT (user_id, feature, period_start)
        DO UPDATE SET 
          count = usage.count + ${update.totalIncrement},
          updated_at = NOW()
      `);
    }

    // Invalidate usage caches
    const userIds = [...new Set(Object.values(groupedUpdates).map(u => u.userId))];
    for (const userId of userIds) {
      await cacheManager.invalidatePattern(`usage_*_${userId}_*`);
    }
  }

  /**
   * Optimized search with full-text indexing
   */
  async searchContent(userId: number, query: string, filters?: {
    contentType?: string;
    status?: string;
    dateRange?: { start: Date; end: Date };
  }, limit: number = 20) {
    const cacheKey = `search_${userId}_${query}_${JSON.stringify(filters)}_${limit}`;
    
    return await cacheManager.getOrSet(cacheKey, async () => {
      const conditions = [eq(content.userId, userId)];
      
      // Add search conditions
      if (query) {
        conditions.push(sql`(
          ${content.title} ILIKE ${`%${query}%`} OR 
          ${content.content} ILIKE ${`%${query}%`}
        )`);
      }
      
      if (filters?.contentType) {
        conditions.push(eq(content.contentType, filters.contentType));
      }
      
      if (filters?.status) {
        conditions.push(eq(content.status, filters.status));
      }
      
      if (filters?.dateRange) {
        conditions.push(
          and(
            gte(content.createdAt, filters.dateRange.start),
            lte(content.createdAt, filters.dateRange.end)
          )
        );
      }

      return await db.select()
        .from(content)
        .where(and(...conditions))
        .orderBy(desc(content.updatedAt))
        .limit(limit);
    }, 600); // 10-minute cache for search results
  }
}

export const queryOptimizer = QueryOptimizer.getInstance();