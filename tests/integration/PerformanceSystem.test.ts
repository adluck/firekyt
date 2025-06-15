import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';
import { cacheManager } from '../../server/performance/CacheManager';
import { rateLimiter } from '../../server/performance/RateLimiter';
import { performanceMonitor } from '../../server/performance/PerformanceMonitor';

describe('Performance System Integration Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Create test users and get auth tokens
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123'
      });

    // Manually set admin role (in real scenario, this would be done through admin interface)
    adminToken = adminResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    cacheManager.clear();
  });

  beforeEach(() => {
    // Clear rate limits before each test
    rateLimiter.clearLimits('test-key');
  });

  describe('Cache Integration', () => {
    it('should cache API responses and improve performance', async () => {
      // First request - should be slower (cache miss)
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request - should be faster (cache hit)
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      expect(response1.body).toEqual(response2.body);
      expect(duration2).toBeLessThan(duration1 * 0.5); // Should be at least 50% faster
    });

    it('should invalidate cache when data changes', async () => {
      // Get initial data
      const response1 = await request(app)
        .get('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Create new site (should invalidate cache)
      await request(app)
        .post('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Site',
          url: 'https://test.com',
          description: 'Test site for cache invalidation'
        })
        .expect(201);

      // Get data again - should reflect changes
      const response2 = await request(app)
        .get('/api/sites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response2.body.length).toBe(response1.body.length + 1);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce API rate limits', async () => {
      const requests = [];
      
      // Make rapid requests to exceed limit
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.allSettled(requests);
      
      const successCount = responses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 200
      ).length;
      
      const rateLimitedCount = responses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 429
      ).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThan(requests.length);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should reset rate limits after window expires', async () => {
      // Create a custom rule with short window
      rateLimiter.addRule('test-short', {
        windowMs: 1000, // 1 second
        maxRequests: 2
      });

      const middleware = rateLimiter.createMiddleware('test-short');

      // Exceed limit
      await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      const response3 = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response3.status).toBe(429);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be able to make requests again
      const response4 = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response4.status).not.toBe(429);
    }, 3000);
  });

  describe('Performance Monitoring Integration', () => {
    it('should track response times', async () => {
      const initialMetrics = performanceMonitor.getCurrentMetrics();
      
      await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedMetrics = performanceMonitor.getCurrentMetrics();
      
      expect(updatedMetrics.timestamp).toBeGreaterThan(initialMetrics.timestamp);
    });

    it('should provide performance dashboard for admins', async () => {
      const response = await request(app)
        .get('/api/admin/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('currentMetrics');
      expect(response.body).toHaveProperty('systemHealth');
      expect(response.body).toHaveProperty('cache');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('alerts');
    });

    it('should deny performance dashboard access to non-admins', async () => {
      await request(app)
        .get('/api/admin/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Database Optimization Integration', () => {
    it('should handle large dataset queries efficiently', async () => {
      // Create multiple content items
      const contentPromises = [];
      for (let i = 0; i < 50; i++) {
        contentPromises.push(
          request(app)
            .post('/api/content')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              title: `Test Content ${i}`,
              content: `This is test content number ${i}`,
              contentType: 'blog_post',
              status: 'published'
            })
        );
      }

      await Promise.all(contentPromises);

      // Query with pagination
      const start = Date.now();
      const response = await request(app)
        .get('/api/content?page=1&limit=20&status=published')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;

      expect(response.body.items).toHaveLength(20);
      expect(response.body.totalPages).toBeGreaterThan(1);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should optimize search queries', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/content/search?q=test&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const duration = Date.now() - start;

      expect(Array.isArray(response.body)).toBe(true);
      expect(duration).toBeLessThan(500); // Search should be fast
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent users efficiently', async () => {
      const concurrentUsers = 20;
      const requestsPerUser = 5;
      
      const userPromises = [];
      
      for (let user = 0; user < concurrentUsers; user++) {
        const userRequests = [];
        
        for (let req = 0; req < requestsPerUser; req++) {
          userRequests.push(
            request(app)
              .get('/api/analytics/dashboard')
              .set('Authorization', `Bearer ${authToken}`)
          );
        }
        
        userPromises.push(Promise.all(userRequests));
      }

      const start = Date.now();
      const results = await Promise.allSettled(userPromises);
      const duration = Date.now() - start;

      const successfulBatches = results.filter(r => r.status === 'fulfilled').length;
      const totalRequests = concurrentUsers * requestsPerUser;
      
      expect(successfulBatches).toBeGreaterThan(concurrentUsers * 0.8); // 80% success rate
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    }, 15000);
  });

  describe('Error Handling and Recovery', () => {
    it('should gracefully handle cache failures', async () => {
      // Temporarily break cache
      const originalGet = cacheManager.get;
      cacheManager.get = async () => { throw new Error('Cache failure'); };

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();

      // Restore cache
      cacheManager.get = originalGet;
    });

    it('should continue operating during high error rates', async () => {
      // Make requests that will cause some errors
      const mixedRequests = [
        request(app).get('/api/nonexistent').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/invalid-endpoint').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/sites').set('Authorization', `Bearer ${authToken}`)
      ];

      const responses = await Promise.allSettled(mixedRequests);
      
      const successCount = responses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 200
      ).length;

      expect(successCount).toBeGreaterThan(0); // Some requests should succeed
    });
  });

  describe('Memory and Resource Management', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate significant load
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.allSettled(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      // Memory increase should be reasonable (less than 50%)
      expect(memoryIncreasePercent).toBeLessThan(50);
    });
  });

  describe('Analytics and Metrics Collection', () => {
    it('should collect performance metrics accurately', async () => {
      const beforeMetrics = performanceMonitor.getCurrentMetrics();
      
      // Make several requests
      await Promise.all([
        request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/sites').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/content').set('Authorization', `Bearer ${authToken}`)
      ]);

      const afterMetrics = performanceMonitor.getCurrentMetrics();
      
      expect(afterMetrics.requestsPerSecond).toBeGreaterThanOrEqual(beforeMetrics.requestsPerSecond);
      expect(typeof afterMetrics.responseTime).toBe('number');
      expect(typeof afterMetrics.memoryUsage).toBe('number');
    });
  });
});