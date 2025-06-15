import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface MetricData {
  timestamp: number;
  value: number;
  labels?: { [key: string]: string };
}

interface PerformanceMetrics {
  requests: {
    total: number;
    successful: number;
    errors: number;
    avgResponseTime: number;
  };
  database: {
    activeConnections: number;
    queryCount: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    operations: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private readonly maxDataPoints = 1000;
  private performanceData: PerformanceMetrics;

  constructor() {
    this.performanceData = {
      requests: { total: 0, successful: 0, errors: 0, avgResponseTime: 0 },
      database: { activeConnections: 0, queryCount: 0, avgQueryTime: 0, slowQueries: 0 },
      cache: { hitRate: 0, missRate: 0, operations: 0 },
      system: { memoryUsage: 0, cpuUsage: 0, uptime: process.uptime() }
    };
    
    this.startSystemMetricsCollection();
  }

  // Record a metric value
  recordMetric(name: string, value: number, labels: { [key: string]: string } = {}): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const dataPoints = this.metrics.get(name)!;
    dataPoints.push({
      timestamp: Date.now(),
      value,
      labels
    });

    // Keep only the most recent data points
    if (dataPoints.length > this.maxDataPoints) {
      dataPoints.shift();
    }
  }

  // Get metric data for a time range
  getMetrics(name: string, startTime?: number, endTime?: number): MetricData[] {
    const dataPoints = this.metrics.get(name) || [];
    
    if (!startTime && !endTime) {
      return dataPoints;
    }

    return dataPoints.filter(point => {
      if (startTime && point.timestamp < startTime) return false;
      if (endTime && point.timestamp > endTime) return false;
      return true;
    });
  }

  // Calculate aggregated metrics
  getAggregatedMetrics(name: string, period: number = 300000): { // 5 minutes default
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
    p99: number;
  } {
    const now = Date.now();
    const dataPoints = this.getMetrics(name, now - period, now);
    
    if (dataPoints.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, p95: 0, p99: 0 };
    }

    const values = dataPoints.map(point => point.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)]
    };
  }

  // Get current performance snapshot
  getPerformanceSnapshot(): PerformanceMetrics {
    this.updateSystemMetrics();
    return { ...this.performanceData };
  }

  // Update request metrics
  updateRequestMetrics(isSuccessful: boolean, responseTime: number): void {
    this.performanceData.requests.total++;
    
    if (isSuccessful) {
      this.performanceData.requests.successful++;
    } else {
      this.performanceData.requests.errors++;
    }

    // Update average response time (exponential moving average)
    const alpha = 0.1;
    this.performanceData.requests.avgResponseTime = 
      (alpha * responseTime) + ((1 - alpha) * this.performanceData.requests.avgResponseTime);

    this.recordMetric('http_requests_total', 1, { status: isSuccessful ? 'success' : 'error' });
    this.recordMetric('http_request_duration', responseTime);
  }

  // Update database metrics
  updateDatabaseMetrics(queryTime: number, isSlowQuery: boolean = false): void {
    this.performanceData.database.queryCount++;
    
    if (isSlowQuery) {
      this.performanceData.database.slowQueries++;
    }

    // Update average query time
    const alpha = 0.1;
    this.performanceData.database.avgQueryTime = 
      (alpha * queryTime) + ((1 - alpha) * this.performanceData.database.avgQueryTime);

    this.recordMetric('db_query_duration', queryTime);
    this.recordMetric('db_slow_queries', isSlowQuery ? 1 : 0);
  }

  // Update cache metrics
  updateCacheMetrics(isHit: boolean): void {
    this.performanceData.cache.operations++;
    
    if (isHit) {
      this.performanceData.cache.hitRate = 
        (this.performanceData.cache.hitRate * (this.performanceData.cache.operations - 1) + 1) / 
        this.performanceData.cache.operations;
    } else {
      this.performanceData.cache.missRate = 
        (this.performanceData.cache.missRate * (this.performanceData.cache.operations - 1) + 1) / 
        this.performanceData.cache.operations;
    }

    this.recordMetric('cache_operations', 1, { result: isHit ? 'hit' : 'miss' });
  }

  // Start collecting system metrics
  private startSystemMetricsCollection(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 10000); // Every 10 seconds
  }

  // Update system metrics
  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.performanceData.system.memoryUsage = memUsage.rss;
    this.performanceData.system.uptime = process.uptime();

    this.recordMetric('memory_usage', memUsage.rss);
    this.recordMetric('heap_used', memUsage.heapUsed);
    this.recordMetric('heap_total', memUsage.heapTotal);
    this.recordMetric('uptime', process.uptime());
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    let output = '';
    
    for (const [metricName, dataPoints] of this.metrics) {
      if (dataPoints.length === 0) continue;
      
      const latestPoint = dataPoints[dataPoints.length - 1];
      const aggregated = this.getAggregatedMetrics(metricName);
      
      output += `# HELP ${metricName} Application metric\n`;
      output += `# TYPE ${metricName} gauge\n`;
      output += `${metricName} ${latestPoint.value} ${latestPoint.timestamp}\n`;
      output += `${metricName}_avg ${aggregated.avg} ${latestPoint.timestamp}\n`;
      output += `${metricName}_p95 ${aggregated.p95} ${latestPoint.timestamp}\n`;
      output += `${metricName}_p99 ${aggregated.p99} ${latestPoint.timestamp}\n`;
      output += '\n';
    }
    
    return output;
  }
}

// Performance monitoring middleware
export function createPerformanceMiddleware(metricsCollector: MetricsCollector) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    
    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      const isSuccessful = res.statusCode < 400;
      
      metricsCollector.updateRequestMetrics(isSuccessful, responseTime);
      
      // Record specific endpoint metrics
      const route = req.route?.path || req.path;
      metricsCollector.recordMetric('endpoint_response_time', responseTime, {
        method: req.method,
        route: route,
        status: res.statusCode.toString()
      });
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
}

// Database query monitoring wrapper
export function createDatabaseMonitor(metricsCollector: MetricsCollector) {
  return {
    async query<T>(queryFn: () => Promise<T>, queryName: string = 'unknown'): Promise<T> {
      const startTime = performance.now();
      
      try {
        const result = await queryFn();
        const queryTime = performance.now() - startTime;
        const isSlowQuery = queryTime > 1000; // Consider queries > 1s as slow
        
        metricsCollector.updateDatabaseMetrics(queryTime, isSlowQuery);
        metricsCollector.recordMetric('db_query_time', queryTime, { query: queryName });
        
        return result;
      } catch (error) {
        const queryTime = performance.now() - startTime;
        metricsCollector.recordMetric('db_query_errors', 1, { query: queryName });
        throw error;
      }
    }
  };
}

// Cache monitoring wrapper
export function createCacheMonitor(metricsCollector: MetricsCollector) {
  return {
    recordCacheOperation(isHit: boolean, operation: string = 'get'): void {
      metricsCollector.updateCacheMetrics(isHit);
      metricsCollector.recordMetric('cache_operation', 1, {
        operation,
        result: isHit ? 'hit' : 'miss'
      });
    }
  };
}

// Health check endpoint
export function createHealthCheck(metricsCollector: MetricsCollector) {
  return (req: Request, res: Response) => {
    const metrics = metricsCollector.getPerformanceSnapshot();
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    // Calculate health score based on various metrics
    let healthScore = 100;
    
    // Reduce score based on error rate
    const errorRate = metrics.requests.total > 0 ? 
      (metrics.requests.errors / metrics.requests.total) * 100 : 0;
    healthScore -= errorRate * 2;
    
    // Reduce score based on average response time
    if (metrics.requests.avgResponseTime > 1000) {
      healthScore -= 20;
    } else if (metrics.requests.avgResponseTime > 500) {
      healthScore -= 10;
    }
    
    // Reduce score based on memory usage
    const memUsagePercent = (memUsage.rss / (1024 * 1024 * 1024)) * 100; // Convert to GB
    if (memUsagePercent > 80) {
      healthScore -= 15;
    } else if (memUsagePercent > 60) {
      healthScore -= 5;
    }
    
    const isHealthy = healthScore > 70;
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      score: Math.max(0, healthScore),
      uptime: uptime,
      timestamp: new Date().toISOString(),
      metrics: {
        requests: {
          total: metrics.requests.total,
          errorRate: errorRate.toFixed(2) + '%',
          avgResponseTime: metrics.requests.avgResponseTime.toFixed(2) + 'ms'
        },
        database: {
          avgQueryTime: metrics.database.avgQueryTime.toFixed(2) + 'ms',
          slowQueries: metrics.database.slowQueries
        },
        cache: {
          hitRate: (metrics.cache.hitRate * 100).toFixed(2) + '%'
        },
        system: {
          memoryUsage: (memUsage.rss / 1024 / 1024).toFixed(2) + 'MB',
          heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB'
        }
      }
    };
    
    res.status(isHealthy ? 200 : 503).json(healthData);
  };
}

// Rate limiting with monitoring
export function createRateLimitMonitor(metricsCollector: MetricsCollector) {
  const rateLimitData = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 1000; // Max requests per window
    
    const clientData = rateLimitData.get(clientId) || { count: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + windowMs;
    }
    
    clientData.count++;
    rateLimitData.set(clientId, clientData);
    
    // Record rate limiting metrics
    metricsCollector.recordMetric('rate_limit_requests', 1, { client: clientId });
    
    if (clientData.count > maxRequests) {
      metricsCollector.recordMetric('rate_limit_exceeded', 1, { client: clientId });
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
      'X-RateLimit-Reset': Math.ceil(clientData.resetTime / 1000).toString()
    });
    
    next();
  };
}

// Alert system
export class AlertManager {
  private alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    resolved: boolean;
  }> = [];

  constructor(private metricsCollector: MetricsCollector) {
    this.startAlertChecking();
  }

  private startAlertChecking(): void {
    setInterval(() => {
      this.checkAlerts();
    }, 30000); // Check every 30 seconds
  }

  private checkAlerts(): void {
    const metrics = this.metricsCollector.getPerformanceSnapshot();
    
    // High error rate alert
    if (metrics.requests.total > 100) {
      const errorRate = (metrics.requests.errors / metrics.requests.total) * 100;
      if (errorRate > 10) {
        this.createAlert('high-error-rate', 'critical', 
          `High error rate detected: ${errorRate.toFixed(2)}%`);
      }
    }
    
    // Slow response time alert
    if (metrics.requests.avgResponseTime > 2000) {
      this.createAlert('slow-response', 'high',
        `Slow average response time: ${metrics.requests.avgResponseTime.toFixed(2)}ms`);
    }
    
    // Database slow queries alert
    if (metrics.database.slowQueries > 10) {
      this.createAlert('slow-queries', 'medium',
        `High number of slow database queries: ${metrics.database.slowQueries}`);
    }
    
    // Low cache hit rate alert
    if (metrics.cache.operations > 100 && metrics.cache.hitRate < 0.5) {
      this.createAlert('low-cache-hit', 'medium',
        `Low cache hit rate: ${(metrics.cache.hitRate * 100).toFixed(2)}%`);
    }
    
    // High memory usage alert
    const memUsageGB = metrics.system.memoryUsage / (1024 * 1024 * 1024);
    if (memUsageGB > 8) {
      this.createAlert('high-memory', 'high',
        `High memory usage: ${memUsageGB.toFixed(2)}GB`);
    }
  }

  private createAlert(id: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string): void {
    // Check if alert already exists and is not resolved
    const existingAlert = this.alerts.find(alert => alert.id === id && !alert.resolved);
    if (existingAlert) {
      return;
    }

    const alert = {
      id,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false
    };

    this.alerts.push(alert);
    console.warn(`ALERT [${severity.toUpperCase()}]: ${message}`);
    
    // Here you would typically send the alert to external systems
    // like Slack, PagerDuty, email, etc.
  }

  getActiveAlerts(): typeof this.alerts {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(id: string): void {
    const alert = this.alerts.find(alert => alert.id === id && !alert.resolved);
    if (alert) {
      alert.resolved = true;
      console.info(`Alert resolved: ${alert.message}`);
    }
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();
export const alertManager = new AlertManager(metricsCollector);