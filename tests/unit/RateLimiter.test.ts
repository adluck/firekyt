import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '../../server/performance/RateLimiter';
import type { Request, Response, NextFunction } from 'express';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    rateLimiter = RateLimiter.getInstance();
    
    mockReq = {
      ip: '192.168.1.1',
      path: '/api/test',
      user: { id: 1 },
      route: { path: '/api/test' }
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear rate limits
    rateLimiter.clearLimits('test-key');
  });

  describe('Rate Limit Rules', () => {
    it('should create middleware for existing rules', () => {
      const middleware = rateLimiter.createMiddleware('api');
      expect(typeof middleware).toBe('function');
    });

    it('should pass through for non-existent rules', () => {
      const middleware = rateLimiter.createMiddleware('non-existent');
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should add custom rules', () => {
      rateLimiter.addRule('custom', {
        windowMs: 60000,
        maxRequests: 10
      });

      const middleware = rateLimiter.createMiddleware('custom');
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Rate Limiting Logic', () => {
    it('should allow requests under the limit', () => {
      rateLimiter.addRule('test', {
        windowMs: 60000,
        maxRequests: 5
      });

      const middleware = rateLimiter.createMiddleware('test');
      
      // Make 3 requests - should all pass
      for (let i = 0; i < 3; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block requests over the limit', () => {
      rateLimiter.addRule('test-limit', {
        windowMs: 60000,
        maxRequests: 2
      });

      const middleware = rateLimiter.createMiddleware('test-limit');
      
      // Make 3 requests - third should be blocked
      for (let i = 0; i < 3; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded'
        })
      );
    });

    it('should set proper rate limit headers', () => {
      rateLimiter.addRule('header-test', {
        windowMs: 60000,
        maxRequests: 10
      });

      const middleware = rateLimiter.createMiddleware('header-test');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': expect.any(String),
          'X-RateLimit-Reset': expect.any(String),
          'X-RateLimit-Window': '60000'
        })
      );
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should implement sliding window correctly', async () => {
      rateLimiter.addRule('sliding', {
        windowMs: 1000, // 1 second
        maxRequests: 2
      });

      const middleware = rateLimiter.createMiddleware('sliding');
      
      // Make 2 requests immediately
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Third request should be blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Wait for window to slide
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be able to make requests again
      vi.clearAllMocks();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Key Generation', () => {
    it('should generate different keys for different IPs', () => {
      const req1 = { ...mockReq, ip: '192.168.1.1' };
      const req2 = { ...mockReq, ip: '192.168.1.2' };

      rateLimiter.addRule('ip-test', {
        windowMs: 60000,
        maxRequests: 1
      });

      const middleware = rateLimiter.createMiddleware('ip-test');
      
      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      // Both should pass since different IPs
      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should use custom key generator if provided', () => {
      rateLimiter.addRule('custom-key', {
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req) => `custom:${req.body?.email || 'anonymous'}`
      });

      const middleware = rateLimiter.createMiddleware('custom-key');
      
      const req1 = { ...mockReq, body: { email: 'user1@test.com' } };
      const req2 = { ...mockReq, body: { email: 'user2@test.com' } };

      middleware(req1 as Request, mockRes as Response, mockNext);
      middleware(req2 as Request, mockRes as Response, mockNext);

      // Both should pass since different emails
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide rate limiting statistics', () => {
      rateLimiter.addRule('stats-test', {
        windowMs: 60000,
        maxRequests: 5
      });

      const middleware = rateLimiter.createMiddleware('stats-test');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const stats = rateLimiter.getStats();
      
      expect(stats).toHaveProperty('totalKeys');
      expect(stats).toHaveProperty('rules');
      expect(stats).toHaveProperty('topOffenders');
      expect(Array.isArray(stats.rules)).toBe(true);
      expect(Array.isArray(stats.topOffenders)).toBe(true);
    });

    it('should track top offenders', () => {
      rateLimiter.addRule('offender-test', {
        windowMs: 60000,
        maxRequests: 1
      });

      const middleware = rateLimiter.createMiddleware('offender-test');
      
      // Make multiple requests to exceed limit
      for (let i = 0; i < 5; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      const stats = rateLimiter.getStats();
      expect(stats.topOffenders.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired windows', () => {
      rateLimiter.addRule('cleanup-test', {
        windowMs: 100, // Very short window
        maxRequests: 5
      });

      const middleware = rateLimiter.createMiddleware('cleanup-test');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      const initialStats = rateLimiter.getStats();
      const initialKeys = initialStats.totalKeys;

      // Wait for expiration and cleanup
      setTimeout(() => {
        rateLimiter.cleanup();
        const finalStats = rateLimiter.getStats();
        expect(finalStats.totalKeys).toBeLessThanOrEqual(initialKeys);
      }, 200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with missing IP', () => {
      const reqWithoutIP = { ...mockReq };
      delete reqWithoutIP.ip;

      rateLimiter.addRule('no-ip-test', {
        windowMs: 60000,
        maxRequests: 5
      });

      const middleware = rateLimiter.createMiddleware('no-ip-test');
      middleware(reqWithoutIP as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle concurrent requests correctly', async () => {
      rateLimiter.addRule('concurrent-test', {
        windowMs: 60000,
        maxRequests: 3
      });

      const middleware = rateLimiter.createMiddleware('concurrent-test');
      
      // Make concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(new Promise(resolve => {
          middleware(mockReq as Request, mockRes as Response, () => resolve('allowed'));
        }));
      }

      await Promise.all(promises);

      // Should have some blocked requests
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });
});