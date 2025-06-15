import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from '../../server/performance/CacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = CacheManager.getInstance();
    // Clear cache before each test
    cacheManager.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values from memory cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cacheManager.set(key, value, 3600, 'memory');
      const result = await cacheManager.get(key, 'memory');

      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent', 'memory');
      expect(result).toBeNull();
    });

    it('should handle cache expiration', async () => {
      const key = 'expiring-key';
      const value = { data: 'test' };

      await cacheManager.set(key, value, 1, 'memory'); // 1 second TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await cacheManager.get(key, 'memory');
      expect(result).toBeNull();
    });

    it('should delete cached values', async () => {
      const key = 'delete-test';
      const value = { data: 'test' };

      await cacheManager.set(key, value, 3600, 'memory');
      await cacheManager.delete(key, 'memory');
      
      const result = await cacheManager.get(key, 'memory');
      expect(result).toBeNull();
    });
  });

  describe('getOrSet functionality', () => {
    it('should fetch from cache if available', async () => {
      const key = 'cached-key';
      const cachedValue = { data: 'cached' };
      const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' });

      await cacheManager.set(key, cachedValue, 3600, 'memory');
      const result = await cacheManager.getOrSet(key, fetchFn, 3600, 'memory');

      expect(result).toEqual(cachedValue);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not available', async () => {
      const key = 'fresh-key';
      const freshValue = { data: 'fresh' };
      const fetchFn = vi.fn().mockResolvedValue(freshValue);

      const result = await cacheManager.getOrSet(key, fetchFn, 3600, 'memory');

      expect(result).toEqual(freshValue);
      expect(fetchFn).toHaveBeenCalledOnce();
      
      // Verify it was cached
      const cachedResult = await cacheManager.get(key, 'memory');
      expect(cachedResult).toEqual(freshValue);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hit and miss statistics', async () => {
      const key = 'stats-test';
      const value = { data: 'test' };

      // Set value
      await cacheManager.set(key, value, 3600, 'memory');
      
      // Hit
      await cacheManager.get(key, 'memory');
      
      // Miss
      await cacheManager.get('non-existent', 'memory');

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBe(50);
    });

    it('should provide memory usage statistics', () => {
      const memoryStats = cacheManager.getMemoryStats();
      
      expect(memoryStats).toHaveProperty('memoryUsage');
      expect(memoryStats).toHaveProperty('keyCount');
      expect(memoryStats).toHaveProperty('avgKeySize');
      expect(typeof memoryStats.memoryUsage).toBe('number');
    });
  });

  describe('Pattern-based operations', () => {
    it('should invalidate keys matching pattern', async () => {
      await cacheManager.set('user:1:profile', { name: 'John' }, 3600, 'memory');
      await cacheManager.set('user:1:settings', { theme: 'dark' }, 3600, 'memory');
      await cacheManager.set('user:2:profile', { name: 'Jane' }, 3600, 'memory');

      await cacheManager.invalidatePattern('user:1:*');

      expect(await cacheManager.get('user:1:profile', 'memory')).toBeNull();
      expect(await cacheManager.get('user:1:settings', 'memory')).toBeNull();
      expect(await cacheManager.get('user:2:profile', 'memory')).not.toBeNull();
    });
  });

  describe('Cache Layer Management', () => {
    it('should handle different cache layers', async () => {
      const key = 'layer-test';
      const memoryValue = { source: 'memory' };
      const queryValue = { source: 'query' };

      await cacheManager.set(key, memoryValue, 3600, 'memory');
      await cacheManager.set(key, queryValue, 3600, 'query');

      const memoryResult = await cacheManager.get(key, 'memory');
      const queryResult = await cacheManager.get(key, 'query');

      expect(memoryResult).toEqual(memoryValue);
      expect(queryResult).toEqual(queryValue);
    });
  });

  describe('Cache Optimization', () => {
    it('should optimize cache when memory usage is high', async () => {
      const optimizeSpy = vi.spyOn(cacheManager, 'optimize');
      
      // Fill cache to trigger optimization
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`key-${i}`, { data: `value-${i}` }, 3600, 'memory');
      }

      cacheManager.optimize();
      
      expect(optimizeSpy).toHaveBeenCalled();
    });
  });
});