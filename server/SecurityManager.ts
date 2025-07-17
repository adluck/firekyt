import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { logger } from './Logger';
import { alertingSystem } from './AlertingSystem';
import { ValidationError, AuthenticationError, AuthorizationError } from './ErrorHandler';

export class SecurityManager {
  private static instance: SecurityManager;
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  private constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    if (!process.env.ENCRYPTION_KEY) {
      logger.warn('No ENCRYPTION_KEY found in environment variables. Generated temporary key.');
    }
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Secure API Key Management
  validateRequiredSecrets(): void {
    const requiredSecrets = [
      'JWT_SECRET',
      'GEMINI_API_KEY',
      'STRIPE_SECRET_KEY',
      'DATABASE_URL'
    ];

    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    
    if (missingSecrets.length > 0) {
      const message = `Missing required environment variables: ${missingSecrets.join(', ')}`;
      logger.critical(message);
      throw new Error(message);
    }

    logger.info('All required secrets validated');
  }

  encryptSensitiveData(data: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decryptSensitiveData(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Input Validation and Sanitization
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      logger.warn('Invalid email format attempted', { email: email.substring(0, 3) + '***' });
    }
    
    return isValid;
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // CSRF Protection
  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    );
  }

  // Rate Limiting
  createRateLimit(windowMs: number = 15 * 60 * 1000, max: number = 100) {
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        });
        
        alertingSystem.recordMetric('rate_limit_violations', 1);
        
        res.status(429).json({
          error: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
          }
        });
      },
      skip: (req: Request) => {
        // Skip rate limiting for health checks and completely skip in development
        if (process.env.NODE_ENV === 'development') {
          return true;
        }
        return req.path === '/health' || req.path === '/api/health';
      }
    });
  }

  // SQL Injection Prevention
  validateSQLInput(input: string): boolean {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(-{2}|\/\*|\*\/)/,
      /(;|\||&)/,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i
    ];

    const isMalicious = sqlInjectionPatterns.some(pattern => pattern.test(input));
    
    if (isMalicious) {
      logger.warn('Potential SQL injection attempt detected', {
        input: input.substring(0, 50) + '...'
      });
      alertingSystem.recordMetric('sql_injection_attempts', 1);
    }
    
    return !isMalicious;
  }

  // Secure Headers Configuration
  configureSecurityHeaders() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Very permissive CSP for development to allow Vite HMR and React DevTools
      return helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
            connectSrc: ["'self'", "ws:", "wss:", "https://fonts.gstatic.com", "https://api.stripe.com", "https://generativelanguage.googleapis.com", "*"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: false // Disable HSTS in development
      });
    } else {
      // Production CSP
      return helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      });
    }
  }

  // Session Security
  generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // API Key Security
  generateAPIKey(): string {
    const prefix = 'ak_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }

  validateAPIKeyFormat(apiKey: string): boolean {
    const apiKeyRegex = /^ak_[a-f0-9]{64}$/;
    return apiKeyRegex.test(apiKey);
  }

  // Data Masking for Logs
  maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      // Mask email addresses
      data = data.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, 
        (match, local, domain) => `${local.substring(0, 2)}***@${domain}`);
      
      // Mask credit card numbers
      data = data.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****');
      
      // Mask API keys
      data = data.replace(/\b[a-zA-Z0-9]{32,}\b/g, '***masked***');
    }
    
    return data;
  }

  // Secure Random Generation
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Time-based One-Time Password (TOTP) for 2FA
  generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base32');
  }

  // IP Address Validation
  isValidIPAddress(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Secure File Upload Validation
  validateFileUpload(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('File type not allowed');
    }
    
    if (file.size > maxFileSize) {
      errors.push('File size exceeds maximum allowed size');
    }
    
    // Check for malicious file extensions
    const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.js', '.jar'];
    const hasmaliciousExtension = maliciousExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasmaliciousExtension) {
      errors.push('File extension not allowed');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Security Middleware Functions
export function inputSanitizationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const security = SecurityManager.getInstance();
  
  if (req.body) {
    req.body = security.sanitizeInput(req.body);
  }
  
  if (req.query) {
    req.query = security.sanitizeInput(req.query);
  }
  
  if (req.params) {
    req.params = security.sanitizeInput(req.params);
  }
  
  next();
}

export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const security = SecurityManager.getInstance();
    const token = req.headers['x-csrf-token'] as string;
    const sessionToken = req.session?.csrfToken;
    
    if (!security.validateCSRFToken(token, sessionToken)) {
      logger.warn('CSRF token validation failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      alertingSystem.recordMetric('csrf_violations', 1);
      
      return res.status(403).json({
        error: {
          message: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        }
      });
    }
  }
  
  next();
}

export function sqlInjectionProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const security = SecurityManager.getInstance();
  
  const checkForSQLInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return security.validateSQLInput(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.every(item => checkForSQLInjection(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).every(value => checkForSQLInjection(value));
    }
    
    return true;
  };
  
  const isRequestSafe = [req.body, req.query, req.params]
    .every(data => data ? checkForSQLInjection(data) : true);
  
  if (!isRequestSafe) {
    return res.status(400).json({
      error: {
        message: 'Invalid input detected',
        code: 'INVALID_INPUT'
      }
    });
  }
  
  next();
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();