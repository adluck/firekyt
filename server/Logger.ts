import { Request } from 'express';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  userId?: number;
  requestId?: string;
  sessionId?: string;
  service?: string;
  operation?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
  duration?: number;
  stack?: string;
}

export class Logger {
  private static instance: Logger;
  private context: LogContext = {};

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setContext(context: Partial<LogContext>): Logger {
    this.context = { ...this.context, ...context };
    return this;
  }

  clearContext(): Logger {
    this.context = {};
    return this;
  }

  child(context: Partial<LogContext>): Logger {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  critical(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, metadata, error);
  }

  // Performance logging
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(`${operation} completed`, { duration });
    };
  }

  // Database operation logging
  logDatabaseQuery(query: string, params?: any[], duration?: number): void {
    this.debug('Database query executed', {
      query: this.sanitizeQuery(query),
      paramCount: params?.length || 0,
      duration
    });
  }

  logDatabaseError(query: string, error: Error, params?: any[]): void {
    this.error('Database query failed', error, {
      query: this.sanitizeQuery(query),
      paramCount: params?.length || 0
    });
  }

  // API request/response logging
  logAPIRequest(req: Request): void {
    this.info('API request received', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentLength: req.get('Content-Length')
    });
  }

  logAPIResponse(statusCode: number, duration: number, responseSize?: number): void {
    this.info('API response sent', {
      statusCode,
      duration,
      responseSize
    });
  }

  // Service operation logging
  logServiceOperation(service: string, operation: string, params?: Record<string, any>): void {
    this.info(`${service} operation started`, {
      service,
      operation,
      params: this.sanitizeParams(params)
    });
  }

  logServiceSuccess(service: string, operation: string, result?: any, duration?: number): void {
    this.info(`${service} operation completed`, {
      service,
      operation,
      success: true,
      duration,
      resultType: result ? typeof result : undefined
    });
  }

  logServiceError(service: string, operation: string, error: Error, params?: Record<string, any>): void {
    this.error(`${service} operation failed`, error, {
      service,
      operation,
      params: this.sanitizeParams(params)
    });
  }

  // Authentication logging
  logAuthAttempt(email: string, ip: string, userAgent: string): void {
    this.info('Authentication attempt', {
      email: this.maskEmail(email),
      ip,
      userAgent
    });
  }

  logAuthSuccess(userId: number, email: string): void {
    this.info('Authentication successful', {
      userId,
      email: this.maskEmail(email)
    });
  }

  logAuthFailure(email: string, reason: string, ip: string): void {
    this.warn('Authentication failed', {
      email: this.maskEmail(email),
      reason,
      ip
    });
  }

  logPasswordReset(email: string, ip: string): void {
    this.info('Password reset requested', {
      email: this.maskEmail(email),
      ip
    });
  }

  // Business operation logging
  logContentCreation(userId: number, contentType: string, contentId: number): void {
    this.info('Content created', {
      userId,
      contentType,
      contentId
    });
  }

  logAIRequest(userId: number, requestType: string, tokensUsed?: number): void {
    this.info('AI request processed', {
      userId,
      requestType,
      tokensUsed
    });
  }

  logSubscriptionChange(userId: number, fromTier: string, toTier: string): void {
    this.info('Subscription tier changed', {
      userId,
      fromTier,
      toTier
    });
  }

  logPaymentEvent(userId: number, event: string, amount?: number, currency?: string): void {
    this.info(`Payment ${event}`, {
      userId,
      event,
      amount,
      currency
    });
  }

  // Security logging
  logSecurityEvent(event: string, userId?: number, ip?: string, details?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      userId,
      ip,
      event,
      ...details
    });
  }

  logRateLimitExceeded(ip: string, endpoint: string, limit: number): void {
    this.warn('Rate limit exceeded', {
      ip,
      endpoint,
      limit
    });
  }

  logSuspiciousActivity(userId: number, activity: string, details: Record<string, any>): void {
    this.warn('Suspicious activity detected', {
      userId,
      activity,
      ...details
    });
  }

  // Cache logging
  logCacheHit(key: string, ttl?: number): void {
    this.debug('Cache hit', { key, ttl });
  }

  logCacheMiss(key: string): void {
    this.debug('Cache miss', { key });
  }

  logCacheSet(key: string, ttl: number, size?: number): void {
    this.debug('Cache set', { key, ttl, size });
  }

  // Private helper methods
  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: {
        ...this.context,
        metadata
      },
      error,
      stack: error?.stack
    };

    this.writeLog(logEntry);
  }

  private writeLog(entry: LogEntry): void {
    const logData = {
      '@timestamp': entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      service: 'affiliate-marketing-platform',
      environment: process.env.NODE_ENV || 'development',
      ...entry.context
    };

    if (entry.error) {
      logData.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      };
    }

    // Console output with color coding
    const coloredOutput = this.colorizeOutput(entry.level, JSON.stringify(logData, null, 2));
    console.log(coloredOutput);

    // In production, also send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logData);
    }
  }

  private colorizeOutput(level: LogLevel, message: string): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m' // Magenta
    };

    const reset = '\x1b[0m';
    return `${colors[level]}${message}${reset}`;
  }

  private sendToExternalLogger(logData: any): void {
    // Implementation for external logging services like ELK, DataDog, etc.
    // This would typically send logs via HTTP to a logging aggregation service
    
    // Example webhook endpoint (would be configured via environment variables)
    if (process.env.LOG_WEBHOOK_URL) {
      fetch(process.env.LOG_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_WEBHOOK_TOKEN}`
        },
        body: JSON.stringify(logData)
      }).catch(error => {
        console.error('Failed to send log to external service:', error);
      });
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from SQL queries
    return query.replace(/password\s*=\s*'[^']*'/gi, "password='***'")
                .replace(/token\s*=\s*'[^']*'/gi, "token='***'");
  }

  private sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return params;

    const sanitized = { ...params };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return `${localPart}@${domain}`;
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }
}

// Request context middleware
export function requestContextMiddleware(req: Request, res: any, next: any): void {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  
  // Set request context for this request
  const logger = Logger.getInstance();
  logger.setContext({
    requestId,
    userId: req.user?.id,
    sessionId: req.sessionID
  });

  next();
}

// Performance monitoring middleware
export function performanceLoggingMiddleware(req: Request, res: any, next: any): void {
  const startTime = Date.now();
  const logger = Logger.getInstance();
  
  logger.logAPIRequest(req);

  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    const responseSize = Buffer.byteLength(body || '', 'utf8');
    
    logger.logAPIResponse(res.statusCode, duration, responseSize);
    
    return originalSend.call(this, body);
  };

  next();
}

// Export singleton instance
export const logger = Logger.getInstance();