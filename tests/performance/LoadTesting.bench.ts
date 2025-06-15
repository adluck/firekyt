import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';
import { cacheManager } from '../../server/performance/CacheManager';
import { performanceMonitor } from '../../server/performance/PerformanceMonitor';

describe('Performance Benchmarks', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = loginResponse.body.token;
  });

  describe('Cache Performance Benchmarks', () => {
    it('should demonstrate significant cache performance improvement', async () => {
      const endpoint = '/api/analytics/dashboard';
      const iterations = 10;
      
      // Clear cache to ensure cold start
      cacheManager.clear();
      
      // Measure uncached performance (cold)
      const coldTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        cacheManager.clear(); // Clear between each request
        const start = Date.now();
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        coldTimes.push(Date.now() - start);
      }
      
      // Measure cached performance (warm)
      const warmTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        warmTimes.push(Date.now() - start);
      }
      
      const avgColdTime = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length;
      const avgWarmTime = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;
      const improvement = ((avgColdTime - avgWarmTime) / avgColdTime) * 100;
      
      console.log(`Cache Performance Results:
        Average Cold Time: ${avgColdTime.toFixed(2)}ms
        Average Warm Time: ${avgWarmTime.toFixed(2)}ms
        Performance Improvement: ${improvement.toFixed(1)}%
      `);
      
      expect(improvement).toBeGreaterThan(50); // At least 50% improvement
      expect(avgWarmTime).toBeLessThan(avgColdTime * 0.5);
    });

    it('should maintain cache hit ratio above 85%', async () => {
      cacheManager.clear();
      
      // Generate cache traffic
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      await Promise.all(requests);
      
      const stats = cacheManager.getStats();
      console.log(`Cache Statistics:
        Hit Ratio: ${stats.hitRatio.toFixed(1)}%
        Total Hits: ${stats.hits}
        Total Misses: ${stats.misses}
      `);
      
      expect(stats.hitRatio).toBeGreaterThan(85);
    });
  });

  describe('Concurrent User Load Testing', () => {
    it('should handle 100 concurrent users with acceptable response times', async () => {
      const concurrentUsers = 100;
      const requestsPerUser = 3;
      const maxAcceptableResponseTime = 2000; // 2 seconds
      
      const userBatches = [];
      for (let user = 0; user < concurrentUsers; user++) {
        const userRequests = [];
        for (let req = 0; req < requestsPerUser; req++) {
          userRequests.push(
            request(app)
              .get('/api/analytics/dashboard')
              .set('Authorization', `Bearer ${authToken}`)
          );
        }
        userBatches.push(Promise.all(userRequests));
      }
      
      const start = Date.now();
      const results = await Promise.allSettled(userBatches);
      const totalDuration = Date.now() - start;
      
      const successfulUsers = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successfulUsers / concurrentUsers) * 100;
      const avgResponseTime = totalDuration / (concurrentUsers * requestsPerUser);
      
      console.log(`Concurrent Load Test Results:
        Concurrent Users: ${concurrentUsers}
        Success Rate: ${successRate.toFixed(1)}%
        Total Duration: ${totalDuration}ms
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
      `);
      
      expect(successRate).toBeGreaterThan(95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(maxAcceptableResponseTime);
    }, 30000);

    it('should maintain stable memory usage under sustained load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Sustained load for 30 seconds
      const duration = 30000;
      const interval = 100; // Request every 100ms
      const startTime = Date.now();
      
      const memorySnapshots: number[] = [];
      
      while (Date.now() - startTime < duration) {
        await request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${authToken}`);
        
        memorySnapshots.push(process.memoryUsage().heapUsed);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      const finalMemory = process.memoryUsage();
      const maxMemoryUsed = Math.max(...memorySnapshots);
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryGrowthPercent = (memoryGrowth / initialMemory.heapUsed) * 100;
      
      console.log(`Memory Usage Results:
        Initial Memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Final Memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Max Memory: ${(maxMemoryUsed / 1024 / 1024).toFixed(2)} MB
        Memory Growth: ${memoryGrowthPercent.toFixed(2)}%
      `);
      
      expect(memoryGrowthPercent).toBeLessThan(30); // Less than 30% memory growth
    }, 35000);
  });

  describe('Database Query Performance', () => {
    it('should execute pagination queries efficiently', async () => {
      const pageSizes = [10, 20, 50, 100];
      const maxQueryTime = 500; // 500ms
      
      for (const pageSize of pageSizes) {
        const start = Date.now();
        const response = await request(app)
          .get(`/api/content?page=1&limit=${pageSize}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        const queryTime = Date.now() - start;
        
        console.log(`Pagination Query (limit=${pageSize}): ${queryTime}ms`);
        
        expect(queryTime).toBeLessThan(maxQueryTime);
        expect(response.body.items.length).toBeLessThanOrEqual(pageSize);
      }
    });

    it('should handle search queries with acceptable performance', async () => {
      const searchTerms = ['test', 'content', 'affiliate', 'marketing'];
      const maxSearchTime = 300; // 300ms
      
      for (const term of searchTerms) {
        const start = Date.now();
        await request(app)
          .get(`/api/content/search?q=${term}&limit=20`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        const searchTime = Date.now() - start;
        
        console.log(`Search Query ('${term}'): ${searchTime}ms`);
        expect(searchTime).toBeLessThan(maxSearchTime);
      }
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without significant overhead', async () => {
      const requestCount = 200;
      const requests = [];
      
      const start = Date.now();
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      const responses = await Promise.allSettled(requests);
      const duration = Date.now() - start;
      
      const successCount = responses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 200
      ).length;
      const rateLimitedCount = responses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 429
      ).length;
      
      const avgResponseTime = duration / requestCount;
      
      console.log(`Rate Limiting Results:
        Total Requests: ${requestCount}
        Successful: ${successCount}
        Rate Limited: ${rateLimitedCount}
        Average Response Time: ${avgResponseTime.toFixed(2)}ms
      `);
      
      expect(rateLimitedCount).toBeGreaterThan(0); // Some should be rate limited
      expect(avgResponseTime).toBeLessThan(100); // Rate limiting shouldn't add much overhead
    });
  });

  describe('System Resource Monitoring', () => {
    it('should track performance metrics accurately', async () => {
      const beforeMetrics = performanceMonitor.getCurrentMetrics();
      
      // Generate load to measure
      await Promise.all([
        request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/sites').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/content').set('Authorization', `Bearer ${authToken}`),
      ]);
      
      const afterMetrics = performanceMonitor.getCurrentMetrics();
      
      console.log(`Performance Metrics:
        Response Time: ${afterMetrics.responseTime.toFixed(2)}ms
        Memory Usage: ${afterMetrics.memoryUsage.toFixed(1)}%
        Cache Hit Ratio: ${afterMetrics.cacheHitRatio.toFixed(1)}%
        Requests/Second: ${afterMetrics.requestsPerSecond.toFixed(2)}
        Error Rate: ${afterMetrics.errorRate.toFixed(2)}%
      `);
      
      expect(afterMetrics.responseTime).toBeLessThan(1000);
      expect(afterMetrics.memoryUsage).toBeLessThan(90);
      expect(afterMetrics.cacheHitRatio).toBeGreaterThan(70);
      expect(afterMetrics.errorRate).toBeLessThan(5);
    });
  });

  describe('Scalability Stress Tests', () => {
    it('should handle burst traffic gracefully', async () => {
      // Simulate burst traffic pattern
      const burstSize = 50;
      const burstCount = 5;
      const burstInterval = 1000; // 1 second between bursts
      
      const results = [];
      
      for (let burst = 0; burst < burstCount; burst++) {
        const burstRequests = [];
        const burstStart = Date.now();
        
        for (let i = 0; i < burstSize; i++) {
          burstRequests.push(
            request(app)
              .get('/api/analytics/dashboard')
              .set('Authorization', `Bearer ${authToken}`)
          );
        }
        
        const burstResponses = await Promise.allSettled(burstRequests);
        const burstDuration = Date.now() - burstStart;
        
        const successCount = burstResponses.filter(r => 
          r.status === 'fulfilled' && (r.value as any).status === 200
        ).length;
        
        results.push({
          burst: burst + 1,
          duration: burstDuration,
          successRate: (successCount / burstSize) * 100
        });
        
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }
      
      console.log('Burst Traffic Results:');
      results.forEach(result => {
        console.log(`  Burst ${result.burst}: ${result.duration}ms, ${result.successRate.toFixed(1)}% success rate`);
      });
      
      const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
      expect(avgSuccessRate).toBeGreaterThan(80); // 80% average success rate
    }, 15000);
  });

  describe('Performance Regression Tests', () => {
    it('should maintain response time standards', async () => {
      const endpoints = [
        '/api/analytics/dashboard',
        '/api/sites',
        '/api/content',
        '/api/content/search?q=test'
      ];
      
      const performanceStandards = {
        '/api/analytics/dashboard': 500,
        '/api/sites': 300,
        '/api/content': 400,
        '/api/content/search?q=test': 300
      };
      
      for (const endpoint of endpoints) {
        const measurements = [];
        
        // Take multiple measurements
        for (let i = 0; i < 10; i++) {
          const start = Date.now();
          await request(app)
            .get(endpoint)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
          measurements.push(Date.now() - start);
        }
        
        const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const maxTime = Math.max(...measurements);
        const standard = performanceStandards[endpoint as keyof typeof performanceStandards];
        
        console.log(`${endpoint}:
          Average: ${avgTime.toFixed(2)}ms
          Maximum: ${maxTime}ms
          Standard: ${standard}ms
        `);
        
        expect(avgTime).toBeLessThan(standard);
      }
    });
  });
});