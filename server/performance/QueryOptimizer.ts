import { sql } from "drizzle-orm";
import { db } from "../db";
import { users, sites, content, analytics, usage } from "@shared/schema";

/**
 * Database Query Optimizer
 * Implements advanced query optimization patterns for high-traffic scenarios
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryCache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Optimized user content query with pagination and filtering
   */
  async getUserContentOptimized(
    userId: number, 
    options: {
      limit?: number;
      offset?: number;
      siteId?: number;
      status?: string;
      contentType?: string;
      search?: string;
    } = {}
  ) {
    const cacheKey = `user_content_${userId}_${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const {
      limit = 20,
      offset = 0,
      siteId,
      status,
      contentType,
      search
    } = options;

    let query = db
      .select({
        id: content.id,
        title: content.title,
        contentType: content.contentType,
        status: content.status,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        siteId: content.siteId,
        siteName: sites.name,
      })
      .from(content)
      .leftJoin(sites, sql`${content.siteId} = ${sites.id}`)
      .where(sql`${content.userId} = ${userId}`)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${content.updatedAt} DESC`);

    // Add conditional filters
    if (siteId) {
      query = query.where(sql`${content.siteId} = ${siteId}`);
    }
    if (status) {
      query = query.where(sql`${content.status} = ${status}`);
    }
    if (contentType) {
      query = query.where(sql`${content.contentType} = ${contentType}`);
    }
    if (search) {
      query = query.where(
        sql`(${content.title} ILIKE ${'%' + search + '%'} OR ${content.content} ILIKE ${'%' + search + '%'})`
      );
    }

    const result = await query.execute();
    this.setCached(cacheKey, result);
    return result;
  }

  /**
   * Optimized analytics aggregation with time-based partitioning
   */
  async getAnalyticsAggregated(
    userId: number,
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) {
    const cacheKey = `analytics_${userId}_${startDate.getTime()}_${endDate.getTime()}_${granularity}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const dateFormat = this.getDateFormat(granularity);
    
    const result = await db
      .select({
        period: sql`DATE_TRUNC(${dateFormat}, ${analytics.createdAt})`,
        totalViews: sql`SUM(${analytics.pageViews})::int`,
        totalClicks: sql`SUM(${analytics.clicks})::int`,
        uniqueVisitors: sql`COUNT(DISTINCT ${analytics.sessionId})::int`,
        bounceRate: sql`AVG(CASE WHEN ${analytics.bounceRate} IS NOT NULL THEN ${analytics.bounceRate}::float ELSE 0 END)`,
        avgSessionDuration: sql`AVG(CASE WHEN ${analytics.sessionDuration} IS NOT NULL THEN ${analytics.sessionDuration}::float ELSE 0 END)`,
      })
      .from(analytics)
      .where(
        sql`${analytics.userId} = ${userId} AND ${analytics.createdAt} >= ${startDate} AND ${analytics.createdAt} <= ${endDate}`
      )
      .groupBy(sql`DATE_TRUNC(${dateFormat}, ${analytics.createdAt})`)
      .orderBy(sql`DATE_TRUNC(${dateFormat}, ${analytics.createdAt}) ASC`)
      .execute();

    this.setCached(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes
    return result;
  }

  /**
   * Batch usage tracking for high-volume scenarios
   */
  async batchUpdateUsage(usageUpdates: Array<{
    userId: number;
    feature: string;
    count: number;
    periodStart: Date;
    periodEnd: Date;
  }>) {
    // Use UPSERT for efficient batch operations
    const upsertQueries = usageUpdates.map(update => 
      db
        .insert(usage)
        .values(update)
        .onConflictDoUpdate({
          target: [usage.userId, usage.feature, usage.periodStart],
          set: {
            count: sql`${usage.count} + ${update.count}`,
            updatedAt: new Date(),
          }
        })
    );

    return Promise.all(upsertQueries);
  }

  private getCached(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCached(key: string, result: any, ttl?: number): void {
    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'hour': return 'hour';
      case 'day': return 'day';
      case 'week': return 'week';
      case 'month': return 'month';
      default: return 'day';
    }
  }
}

export const queryOptimizer = QueryOptimizer.getInstance();