import { Request, Response, NextFunction } from 'express';
import { logger } from './Logger';
import { errorHandler, asyncHandler, setupGlobalErrorHandlers } from './ErrorHandler';
import { requestContextMiddleware, performanceLoggingMiddleware } from './Logger';
import { alertingSystem } from './AlertingSystem';

// Initialize global error handlers
setupGlobalErrorHandlers();

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

// Rate limiting middleware with alerting
export function rateLimitMiddleware(windowMs: number = 900000, max: number = 100) {
  const requests = new Map<string, Array<{ timestamp: number; count: number }>>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting completely in development
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }
    
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key)!;
    
    // Clean old requests
    const validRequests = userRequests.filter(r => r.timestamp > windowStart);
    const requestCount = validRequests.reduce((sum, r) => sum + r.count, 0);
    
    if (requestCount >= max) {
      alertingSystem.recordMetric('rate_limit_exceeded', 1);
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        endpoint: req.path,
        requestCount,
        limit: max
      });
      
      res.status(429).json({
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
      return;
    }
    
    // Add current request
    validRequests.push({ timestamp: now, count: 1 });
    requests.set(key, validRequests);
    
    next();
  };
}

// Security headers middleware
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

// Health check middleware
export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health' || req.path === '/api/health') {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(healthStatus);
    return;
  }
  
  next();
}

// Metrics collection middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Track request
  alertingSystem.recordMetric('http_requests_total', 1);
  alertingSystem.recordMetric(`http_requests_${req.method.toLowerCase()}`, 1);
  
  // Override res.json to capture response metrics
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Track response metrics
    alertingSystem.trackResponseTime(req.path, duration);
    alertingSystem.recordMetric('http_responses_total', 1);
    alertingSystem.recordMetric(`http_responses_${res.statusCode}xx`, 1);
    
    // Track errors
    if (res.statusCode >= 400) {
      alertingSystem.recordMetric('http_errors_total', 1);
      if (res.statusCode >= 500) {
        alertingSystem.recordMetric('http_errors_5xx', 1);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

// Authentication error handling
export function authErrorMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Override to add authentication context to errors
  const originalNext = next;
  next = (error?: any) => {
    if (error) {
      if (error.name === 'UnauthorizedError' || error.message?.includes('jwt')) {
        logger.warn('Authentication failed', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        
        alertingSystem.recordMetric('auth_failures', 1);
      }
    }
    originalNext(error);
  };
  
  next();
}

// Database error handling middleware
export function databaseErrorMiddleware(error: Error, req: Request, res: Response, next: NextFunction): void {
  if (error.message?.includes('database') || error.message?.includes('connection')) {
    logger.error('Database error detected', error, {
      query: req.body?.query,
      params: req.params
    });
    
    alertingSystem.recordMetric('database_errors', 1);
    alertingSystem.createAlert(
      'DATABASE_CONNECTION_FAILED' as any,
      'Database Connection Error',
      `Database error: ${error.message}`,
      { error: error.message },
      'CRITICAL' as any
    );
  }
  
  next(error);
}

// Export all middleware as a single setup function
export function setupErrorHandlingMiddleware(app: any): void {
  // Pre-route middleware
  app.use(requestIdMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(healthCheckMiddleware);
  app.use(requestContextMiddleware);
  app.use(performanceLoggingMiddleware);
  app.use(metricsMiddleware);
  app.use(authErrorMiddleware);
  app.use(rateLimitMiddleware());
  
  // Post-route middleware (error handlers)
  app.use(databaseErrorMiddleware);
  app.use(errorHandler);
}