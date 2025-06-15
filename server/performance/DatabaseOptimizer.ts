import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * Database Optimizer for High-Performance Operations
 * Implements indexing, query optimization, and maintenance routines
 */
export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  
  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Create performance indexes for high-traffic queries
   */
  async createPerformanceIndexes(): Promise<void> {
    const indexes = [
      // User-based queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
      
      // Site queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_user_id ON sites(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sites_user_active ON sites(user_id, is_active)',
      
      // Content queries (most frequent)
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_id ON content(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_site_id ON content(site_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_status ON content(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_status ON content(user_id, status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_updated_at ON content(updated_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_published_at ON content(published_at)',
      
      // Analytics queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_id ON analytics(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_date ON analytics(user_id, created_at)',
      
      // Usage tracking
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_user_feature ON usage(user_id, feature)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_period ON usage(period_start, period_end)',
      
      // Content performance
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_performance_content_id ON content_performance(content_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_performance_date ON content_performance(date)',
      
      // Affiliate clicks
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_clicks_user_id ON affiliate_clicks(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at)',
      
      // SEO rankings
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_rankings_user_id ON seo_rankings(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seo_rankings_keyword ON seo_rankings(keyword)',
      
      // Revenue tracking
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_tracking_user_id ON revenue_tracking(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_tracking_date ON revenue_tracking(transaction_date)',
      
      // Composite indexes for complex queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_site_status ON content(user_id, site_id, status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_date_range ON analytics(user_id, created_at DESC)',
    ];

    for (const indexSql of indexes) {
      try {
        await db.execute(sql.raw(indexSql));
        console.log(`Created index: ${indexSql.split(' ')[6]}`);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error(`Failed to create index: ${indexSql}`, error);
        }
      }
    }
  }

  /**
   * Optimize database with VACUUM and ANALYZE
   */
  async optimizeDatabase(): Promise<void> {
    const tables = [
      'users', 'sites', 'content', 'analytics', 'usage',
      'content_performance', 'affiliate_clicks', 'seo_rankings',
      'revenue_tracking', 'products', 'seo_analyses'
    ];

    for (const table of tables) {
      try {
        // Analyze table statistics
        await db.execute(sql.raw(`ANALYZE ${table}`));
        
        // Vacuum to reclaim space (non-blocking)
        await db.execute(sql.raw(`VACUUM (ANALYZE) ${table}`));
        
        console.log(`Optimized table: ${table}`);
      } catch (error) {
        console.error(`Failed to optimize table ${table}:`, error);
      }
    }
  }

  /**
   * Partition large tables by date for better performance
   */
  async createTablePartitions(): Promise<void> {
    const partitionCommands = [
      // Partition analytics by month
      `CREATE TABLE IF NOT EXISTS analytics_y2025m01 PARTITION OF analytics 
       FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')`,
      
      `CREATE TABLE IF NOT EXISTS analytics_y2025m02 PARTITION OF analytics 
       FOR VALUES FROM ('2025-02-01') TO ('2025-03-01')`,
       
      `CREATE TABLE IF NOT EXISTS analytics_y2025m03 PARTITION OF analytics 
       FOR VALUES FROM ('2025-03-01') TO ('2025-04-01')`,
       
      // Partition content_performance by month
      `CREATE TABLE IF NOT EXISTS content_performance_y2025m01 PARTITION OF content_performance 
       FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')`,
       
      `CREATE TABLE IF NOT EXISTS content_performance_y2025m02 PARTITION OF content_performance 
       FOR VALUES FROM ('2025-02-01') TO ('2025-03-01')`,
    ];

    for (const command of partitionCommands) {
      try {
        await db.execute(sql.raw(command));
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error('Partition creation failed:', error);
        }
      }
    }
  }

  /**
   * Get query performance statistics
   */
  async getQueryStats(): Promise<any> {
    try {
      const result = await db.execute(sql.raw(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        ORDER BY total_time DESC 
        LIMIT 20
      `));
      
      return result.rows;
    } catch (error) {
      console.log('pg_stat_statements not available');
      return [];
    }
  }

  /**
   * Monitor database performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    const metrics = await Promise.all([
      // Database size
      db.execute(sql.raw(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `)),
      
      // Connection count
      db.execute(sql.raw(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `)),
      
      // Cache hit ratio
      db.execute(sql.raw(`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
      `)),
      
      // Table sizes
      db.execute(sql.raw(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `)),
      
      // Index usage
      db.execute(sql.raw(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
        LIMIT 10
      `))
    ]);

    return {
      databaseSize: metrics[0].rows[0],
      activeConnections: metrics[1].rows[0],
      cacheHitRatio: metrics[2].rows[0],
      tableSizes: metrics[3].rows,
      indexUsage: metrics[4].rows,
    };
  }

  /**
   * Clean up old data to maintain performance
   */
  async cleanupOldData(): Promise<void> {
    const cleanupQueries = [
      // Delete analytics older than 2 years
      `DELETE FROM analytics WHERE created_at < NOW() - INTERVAL '2 years'`,
      
      // Delete old content performance data (1 year)
      `DELETE FROM content_performance WHERE date < NOW() - INTERVAL '1 year'`,
      
      // Delete old affiliate clicks (1 year)
      `DELETE FROM affiliate_clicks WHERE created_at < NOW() - INTERVAL '1 year'`,
      
      // Delete old usage data (1 year)
      `DELETE FROM usage WHERE period_start < NOW() - INTERVAL '1 year'`,
    ];

    for (const query of cleanupQueries) {
      try {
        const result = await db.execute(sql.raw(query));
        console.log(`Cleanup completed: ${query.split(' ')[2]} - ${(result as any).rowCount} rows deleted`);
      } catch (error) {
        console.error(`Cleanup failed for: ${query}`, error);
      }
    }
  }

  /**
   * Update table statistics for better query planning
   */
  async updateStatistics(): Promise<void> {
    try {
      await db.execute(sql.raw('ANALYZE'));
      console.log('Database statistics updated');
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  /**
   * Get slow query report
   */
  async getSlowQueries(): Promise<any[]> {
    try {
      const result = await db.execute(sql.raw(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time,
          stddev_time
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC 
        LIMIT 10
      `));
      
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  /**
   * Run comprehensive database maintenance
   */
  async performMaintenance(): Promise<void> {
    console.log('Starting database maintenance...');
    
    await this.createPerformanceIndexes();
    await this.updateStatistics();
    await this.optimizeDatabase();
    await this.cleanupOldData();
    
    console.log('Database maintenance completed');
  }
}

export const databaseOptimizer = DatabaseOptimizer.getInstance();