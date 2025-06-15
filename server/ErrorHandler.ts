import { Request, Response, NextFunction } from 'express';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Business Logic
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  
  // External Services
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: number;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      context: this.context,
      stack: this.stack
    };
  }
}

// Specific Error Classes
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, ErrorSeverity.LOW, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, ErrorSeverity.MEDIUM, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, ErrorCode.FORBIDDEN, 403, ErrorSeverity.MEDIUM, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, ErrorCode.RESOURCE_NOT_FOUND, 404, ErrorSeverity.LOW, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DUPLICATE_RESOURCE, 409, ErrorSeverity.MEDIUM, true, context);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 422, ErrorSeverity.MEDIUM, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(`${service} service error: ${message}`, ErrorCode.EXTERNAL_API_ERROR, 502, ErrorSeverity.HIGH, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, ErrorSeverity.HIGH, false, context);
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, window: string, context?: Record<string, any>) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, ErrorCode.RATE_LIMIT_EXCEEDED, 429, ErrorSeverity.MEDIUM, true, context);
  }
}

// Error Handler Middleware
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'ValidationError') {
    appError = new ValidationError(error.message);
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else {
    // Unknown error - treat as internal server error
    appError = new AppError(
      'Internal server error',
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      ErrorSeverity.CRITICAL,
      false
    );
  }

  // Add request context
  appError.requestId = req.headers['x-request-id'] as string || generateRequestId();
  appError.userId = req.user?.id;

  // Log error
  logError(appError, req);

  // Send error response
  const errorResponse = {
    error: {
      message: appError.message,
      code: appError.code,
      requestId: appError.requestId,
      timestamp: appError.timestamp
    }
  };

  // Add additional context in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      ...errorResponse.error,
      stack: appError.stack,
      context: appError.context
    };
  }

  res.status(appError.statusCode).json(errorResponse);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error logging
function logError(error: AppError, req: Request) {
  const logData = {
    timestamp: error.timestamp,
    level: mapSeverityToLogLevel(error.severity),
    message: error.message,
    error: error.toJSON(),
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  };

  // Log based on severity
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      console.error('CRITICAL ERROR:', JSON.stringify(logData, null, 2));
      break;
    case ErrorSeverity.HIGH:
      console.error('HIGH SEVERITY ERROR:', JSON.stringify(logData, null, 2));
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('MEDIUM SEVERITY ERROR:', JSON.stringify(logData, null, 2));
      break;
    case ErrorSeverity.LOW:
      console.info('LOW SEVERITY ERROR:', JSON.stringify(logData, null, 2));
      break;
  }
}

function mapSeverityToLogLevel(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 'error';
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'error';
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Global uncaught exception handler
export function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (error: Error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
    process.exit(1);
  });
}