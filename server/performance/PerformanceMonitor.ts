import { cacheManager } from './CacheManager';
import { rateLimiter } from './RateLimiter';
import { databaseOptimizer } from './DatabaseOptimizer';
import { queryOptimizer } from './QueryOptimizer';

interface PerformanceMetrics {
  timestamp: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  cacheHitRatio: number;
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  severity: 'warning' | 'critical';
}

/**
 * Real-time Performance Monitor for High-Traffic Scenarios
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private responseTimes: number[] = [];
  private startTime = Date.now();

  private alertThresholds: AlertThreshold[] = [
    { metric: 'responseTime', threshold: 1000, severity: 'warning' },
    { metric: 'responseTime', threshold: 3000, severity: 'critical' },
    { metric: 'memoryUsage', threshold: 80, severity: 'warning' },
    { metric: 'memoryUsage', threshold: 95, severity: 'critical' },
    { metric: 'errorRate', threshold: 5, severity: 'warning' },
    { metric: 'errorRate', threshold: 10, severity: 'critical' },
    { metric: 'cacheHitRatio', threshold: 70, severity: 'warning' },
  ];

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record request performance
   */
  recordRequest(endpoint: string, responseTime: number, statusCode: number): void {
    const key = `${endpoint}_${Math.floor(Date.now() / 60000)}`; // Per-minute buckets
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    if (statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
    
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate requests per second (last minute)
    const currentMinute = Math.floor(now / 60000);
    const lastMinuteKey = `_${currentMinute}`;
    const requestsThisMinute = Array.from(this.requestCounts.entries())
      .filter(([key]) => key.endsWith(lastMinuteKey))
      .reduce((sum, [, count]) => sum + count, 0);
    
    // Calculate error rate
    const errorsThisMinute = Array.from(this.errorCounts.entries())
      .filter(([key]) => key.endsWith(lastMinuteKey))
      .reduce((sum, [, count]) => sum + count, 0);
    
    const errorRate = requestsThisMinute > 0 ? (errorsThisMinute / requestsThisMinute) * 100 : 0;
    
    // Calculate average response time
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;
    
    // Get cache statistics
    const cacheStats = cacheManager.getStats();
    
    return {
      timestamp: now,
      responseTime: avgResponseTime,
      memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      activeConnections: 0, // Will be updated by connection pool
      requestsPerSecond: requestsThisMinute / 60,
      errorRate,
      cacheHitRatio: cacheStats.hitRatio,
    };
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(): Promise<any> {
    const currentMetrics = this.getCurrentMetrics();
    const cacheStats = cacheManager.getStats();
    const rateLimitStats = rateLimiter.getStats();
    const dbMetrics = await databaseOptimizer.getPerformanceMetrics();
    const slowQueries = await databaseOptimizer.getSlowQueries();
    
    return {
      currentMetrics,
      systemHealth: {
        uptime: Date.now() - this.startTime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      cache: {
        stats: cacheStats,
        memoryStats: cacheManager.getMemoryStats(),
      },
      rateLimiting: rateLimitStats,
      database: {
        metrics: dbMetrics,
        slowQueries: slowQueries.slice(0, 5),
      },
      alerts: this.checkAlerts(currentMetrics),
      trends: this.getMetricsTrends(),
    };
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): Array<{ metric: string; value: number; threshold: number; severity: string }> {
    const alerts = [];
    
    for (const threshold of this.alertThresholds) {
      const value = (metrics as any)[threshold.metric];
      
      if (value > threshold.threshold) {
        alerts.push({
          metric: threshold.metric,
          value,
          threshold: threshold.threshold,
          severity: threshold.severity,
        });
      }
    }
    
    return alerts;
  }

  /**
   * Get performance trends over time
   */
  private getMetricsTrends(): any {
    const recentMetrics = this.metrics.slice(-60); // Last 60 data points
    
    if (recentMetrics.length < 2) {
      return { trend: 'stable', change: 0 };
    }
    
    const latest = recentMetrics[recentMetrics.length - 1];
    const previous = recentMetrics[recentMetrics.length - 2];
    
    return {
      responseTime: {
        current: latest.responseTime,
        change: ((latest.responseTime - previous.responseTime) / previous.responseTime) * 100,
      },
      memoryUsage: {
        current: latest.memoryUsage,
        change: ((latest.memoryUsage - previous.memoryUsage) / previous.memoryUsage) * 100,
      },
      requestsPerSecond: {
        current: latest.requestsPerSecond,
        change: ((latest.requestsPerSecond - previous.requestsPerSecond) / previous.requestsPerSecond) * 100,
      },
    };
  }

  /**
   * Start monitoring and optimization routines
   */
  private startMonitoring(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      const metrics = this.getCurrentMetrics();
      this.metrics.push(metrics);
      
      // Keep only last 24 hours of metrics
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
      
      // Check for alerts
      const alerts = this.checkAlerts(metrics);
      if (alerts.length > 0) {
        console.warn('Performance alerts:', alerts);
      }
    }, 30000);

    // Cleanup old data every 5 minutes
    setInterval(() => {
      this.cleanupOldData();
      cacheManager.optimize();
      rateLimiter.cleanup();
    }, 5 * 60 * 1000);

    // Database optimization every hour
    setInterval(async () => {
      try {
        await databaseOptimizer.updateStatistics();
        console.log('Database statistics updated');
      } catch (error) {
        console.error('Database optimization failed:', error);
      }
    }, 60 * 60 * 1000);

    // Comprehensive maintenance every 6 hours
    setInterval(async () => {
      try {
        await databaseOptimizer.performMaintenance();
        console.log('Database maintenance completed');
      } catch (error) {
        console.error('Database maintenance failed:', error);
      }
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Clean up old tracking data
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
    const cutoffMinute = Math.floor(cutoff / 60000);
    
    // Clean request counts
    for (const [key] of this.requestCounts.entries()) {
      const keyMinute = parseInt(key.split('_').pop() || '0');
      if (keyMinute < cutoffMinute) {
        this.requestCounts.delete(key);
      }
    }
    
    // Clean error counts
    for (const [key] of this.errorCounts.entries()) {
      const keyMinute = parseInt(key.split('_').pop() || '0');
      if (keyMinute < cutoffMinute) {
        this.errorCounts.delete(key);
      }
    }
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const metrics = this.getCurrentMetrics();
    const recommendations = [];
    
    if (metrics.responseTime > 1000) {
      recommendations.push('High response times detected. Consider enabling query caching or optimizing database queries.');
    }
    
    if (metrics.memoryUsage > 80) {
      recommendations.push('High memory usage. Consider clearing old cache entries or increasing server memory.');
    }
    
    if (metrics.errorRate > 5) {
      recommendations.push('High error rate detected. Check application logs and database connectivity.');
    }
    
    if (metrics.cacheHitRatio < 70) {
      recommendations.push('Low cache hit ratio. Review caching strategy and TTL settings.');
    }
    
    return recommendations;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();