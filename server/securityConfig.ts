import express from 'express';
import session from 'express-session';
import { securityManager } from './SecurityManager';
import { setupErrorHandlingMiddleware } from './errorHandlingMiddleware';
import { inputSanitizationMiddleware, csrfProtectionMiddleware, sqlInjectionProtectionMiddleware } from './SecurityManager';
import { logger } from './Logger';
import { alertingSystem } from './AlertingSystem';

export function configureApplicationSecurity(app: express.Application): void {
  // Initialize security manager and validate secrets
  try {
    securityManager.validateRequiredSecrets();
    logger.info('Security configuration initialized successfully');
  } catch (error) {
    logger.critical('Security configuration failed', error as Error);
    process.exit(1);
  }

  // Configure security headers
  app.use(securityManager.configureSecurityHeaders());

  // Configure session security
  app.use(session({
    secret: process.env.SESSION_SECRET || securityManager.generateSecureToken(),
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
      sameSite: 'strict'
    },
    genid: () => securityManager.generateSecureSessionId()
  }));

  // Setup comprehensive error handling and security middleware
  setupErrorHandlingMiddleware(app);

  // Apply input sanitization to all routes
  app.use(inputSanitizationMiddleware);

  // Apply SQL injection protection
  app.use(sqlInjectionProtectionMiddleware);

  // Apply CSRF protection to state-changing operations
  app.use(csrfProtectionMiddleware);

  // Rate limiting for different endpoint categories
  app.use('/api/auth', securityManager.createRateLimit(15 * 60 * 1000, 5)); // 5 per 15 minutes
  app.use('/api/content/generate', securityManager.createRateLimit(60 * 60 * 1000, 20)); // 20 per hour
  app.use('/api/upload', securityManager.createRateLimit(60 * 60 * 1000, 10)); // 10 per hour
  app.use('/api', securityManager.createRateLimit(15 * 60 * 1000, 100)); // 100 per 15 minutes

  // CSRF token endpoint
  app.get('/api/csrf-token', (req, res) => {
    const token = securityManager.generateCSRFToken();
    req.session!.csrfToken = token;
    res.json({ csrfToken: token });
  });

  // Security monitoring endpoint
  app.get('/api/security/status', (req, res) => {
    const securityStatus = {
      timestamp: new Date().toISOString(),
      activeAlerts: alertingSystem.getActiveAlerts().length,
      securityEvents: {
        rateLimitViolations: alertingSystem.getActiveAlerts().filter(a => a.type === 'RATE_LIMIT_EXCEEDED').length,
        authenticationFailures: alertingSystem.getActiveAlerts().filter(a => a.type === 'AUTHENTICATION_FAILED').length,
        securityBreaches: alertingSystem.getActiveAlerts().filter(a => a.type === 'SECURITY_BREACH').length
      },
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: req.socket.server.connections || 0
      }
    };

    res.json(securityStatus);
  });

  // Security headers validation endpoint
  app.get('/api/security/headers', (req, res) => {
    const headers = {
      'content-security-policy': res.getHeader('content-security-policy'),
      'x-frame-options': res.getHeader('x-frame-options'),
      'x-content-type-options': res.getHeader('x-content-type-options'),
      'strict-transport-security': res.getHeader('strict-transport-security'),
      'referrer-policy': res.getHeader('referrer-policy')
    };

    res.json({
      headers,
      secure: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString()
    });
  });

  logger.info('Application security configuration completed');
}

// Security audit logging middleware
export function securityAuditMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const startTime = Date.now();
  
  // Log security-relevant requests
  const securityRelevantPaths = ['/api/auth/', '/api/admin/', '/api/user/', '/api/payment/'];
  const isSecurityRelevant = securityRelevantPaths.some(path => req.path.startsWith(path));

  if (isSecurityRelevant) {
    logger.info('Security-relevant request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      userId: (req as any).user?.id
    });
  }

  // Override response methods to log security events
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Security: Access denied', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        duration
      });
      
      alertingSystem.recordMetric('security_access_denied', 1);
    }

    // Log suspicious activity
    if (res.statusCode === 429) {
      logger.warn('Security: Rate limit exceeded', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        duration
      });
      
      alertingSystem.recordMetric('security_rate_limit_exceeded', 1);
    }

    return originalJson.call(this, data);
  };

  next();
}

// IP geolocation and reputation checking
export function ipSecurityMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const clientIP = req.ip;
  
  // Check for suspicious IPs (this would integrate with threat intelligence APIs)
  const suspiciousIPs = process.env.BLOCKED_IPS?.split(',') || [];
  
  if (suspiciousIPs.includes(clientIP)) {
    logger.warn('Security: Blocked suspicious IP', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    alertingSystem.createAlert(
      'SECURITY_BREACH' as any,
      'Suspicious IP Blocked',
      `Blocked request from suspicious IP: ${clientIP}`,
      { ip: clientIP, path: req.path },
      'WARNING' as any
    );
    
    return res.status(403).json({
      error: {
        message: 'Access denied',
        code: 'IP_BLOCKED'
      }
    });
  }

  // Log requests from new IPs
  const knownIPs = new Set(process.env.KNOWN_IPS?.split(',') || []);
  if (!knownIPs.has(clientIP)) {
    logger.info('Security: New IP detected', {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
  }

  next();
}

// Bot detection middleware
export function botDetectionMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const userAgent = req.get('User-Agent') || '';
  
  // Common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];

  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot) {
    logger.info('Security: Bot detected', {
      userAgent,
      ip: req.ip,
      path: req.path
    });
    
    // Allow legitimate bots to access public endpoints
    const publicPaths = ['/api/health', '/api/status', '/robots.txt', '/sitemap.xml'];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    
    if (!isPublicPath) {
      alertingSystem.recordMetric('security_bot_blocked', 1);
      
      return res.status(403).json({
        error: {
          message: 'Automated requests not allowed',
          code: 'BOT_DETECTED'
        }
      });
    }
  }

  next();
}

// Content security policy nonce generation
export function cspNonceMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const nonce = securityManager.generateSecureToken(16);
  (req as any).nonce = nonce;
  
  // Add nonce to CSP header
  const cspHeader = res.getHeader('Content-Security-Policy') as string;
  if (cspHeader) {
    const updatedCSP = cspHeader.replace(
      "script-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`
    );
    res.setHeader('Content-Security-Policy', updatedCSP);
  }

  next();
}

// Export security configuration
export const securityConfig = {
  configureApplicationSecurity,
  securityAuditMiddleware,
  ipSecurityMiddleware,
  botDetectionMiddleware,
  cspNonceMiddleware
};