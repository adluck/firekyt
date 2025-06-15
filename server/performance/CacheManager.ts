import NodeCache from 'node-cache';

/**
 * High-Performance Cache Manager
 * Implements multi-layer caching with TTL, LRU eviction, and memory optimization
 */
export class CacheManager {
  private static instance: CacheManager;
  
  // Multi-layer cache system
  private memoryCache: NodeCache;
  private queryCache: NodeCache;
  private sessionCache: NodeCache;
  private analyticsCache: NodeCache;
  
  // Cache statistics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  private constructor() {
    // Memory cache for frequently accessed data (1 hour TTL)
    this.memoryCache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 300,
      maxKeys: 10000,
      deleteOnExpire: true,
      useClones: false
    });

    // Query result cache (15 minutes TTL)
    this.queryCache = new NodeCache({
      stdTTL: 900,
      checkperiod: 120,
      maxKeys: 5000,
      deleteOnExpire: true,
      useClones: false
    });

    // Session data cache (30 minutes TTL)
    this.sessionCache = new NodeCache({
      stdTTL: 1800,
      checkperiod: 180,
      maxKeys: 50000,
      deleteOnExpire: true,
      useClones: false
    });

    // Analytics cache for aggregated data (5 minutes TTL)
    this.analyticsCache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      maxKeys: 1000,
      deleteOnExpire: true,
      useClones: false
    });

    this.setupEventListeners();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get data from appropriate cache layer
   */
  get(key: string, layer: 'memory' | 'query' | 'session' | 'analytics' = 'memory'): any {
    const cache = this.getCache(layer);
    const result = cache.get(key);
    
    if (result !== undefined) {
      this.stats.hits++;
      return result;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set data in appropriate cache layer
   */
  set(key: string, value: any, ttl?: number, layer: 'memory' | 'query' | 'session' | 'analytics' = 'memory'): boolean {
    const cache = this.getCache(layer);
    const success = cache.set(key, value, ttl);
    
    if (success) {
      this.stats.sets++;
    }
    
    return success;
  }

  /**
   * Delete from cache
   */
  del(key: string, layer: 'memory' | 'query' | 'session' | 'analytics' = 'memory'): number {
    const cache = this.getCache(layer);
    const deleted = cache.del(key);
    this.stats.deletes += deleted;
    return deleted;
  }

  /**
   * Clear cache layer or specific pattern
   */
  clear(layer?: 'memory' | 'query' | 'session' | 'analytics', pattern?: string): void {
    if (layer) {
      const cache = this.getCache(layer);
      if (pattern) {
        const keys = cache.keys().filter(key => key.includes(pattern));
        cache.del(keys);
      } else {
        cache.flushAll();
      }
    } else {
      // Clear all caches
      this.memoryCache.flushAll();
      this.queryCache.flushAll();
      this.sessionCache.flushAll();
      this.analyticsCache.flushAll();
    }
  }

  /**
   * Cache with automatic invalidation on data updates
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    layer: 'memory' | 'query' | 'session' | 'analytics' = 'memory'
  ): Promise<T> {
    const cached = this.get(key, layer);
    if (cached !== null) {
      return cached;
    }

    const result = await fetcher();
    this.set(key, result, ttl, layer);
    return result;
  }

  /**
   * Batch operations for high-volume scenarios
   */
  mget(keys: string[], layer: 'memory' | 'query' | 'session' | 'analytics' = 'memory'): Record<string, any> {
    const cache = this.getCache(layer);
    const result: Record<string, any> = {};
    
    keys.forEach(key => {
      const value = cache.get(key);
      if (value !== undefined) {
        result[key] = value;
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }
    });
    
    return result;
  }

  mset(data: Record<string, any>, ttl?: number, layer: 'memory' | 'query' | 'session' | 'analytics' = 'memory'): void {
    const cache = this.getCache(layer);
    
    Object.entries(data).forEach(([key, value]) => {
      if (cache.set(key, value, ttl)) {
        this.stats.sets++;
      }
    });
  }

  /**
   * Cache invalidation patterns
   */
  invalidatePattern(pattern: string, layer?: 'memory' | 'query' | 'session' | 'analytics'): void {
    const caches = layer ? [this.getCache(layer)] : [this.memoryCache, this.queryCache, this.sessionCache, this.analyticsCache];
    
    caches.forEach(cache => {
      const keys = cache.keys().filter(key => key.includes(pattern));
      cache.del(keys);
    });
  }

  /**
   * User-specific cache invalidation
   */
  invalidateUserCache(userId: number): void {
    this.invalidatePattern(`user_${userId}`);
    this.invalidatePattern(`userId_${userId}`);
  }

  /**
   * Site-specific cache invalidation
   */
  invalidateSiteCache(siteId: number): void {
    this.invalidatePattern(`site_${siteId}`);
    this.invalidatePattern(`siteId_${siteId}`);
  }

  /**
   * Get cache statistics
   */
  getStats(): typeof this.stats & { hitRatio: number; totalOperations: number } {
    const totalOperations = this.stats.hits + this.stats.misses;
    const hitRatio = totalOperations > 0 ? (this.stats.hits / totalOperations) * 100 : 0;
    
    return {
      ...this.stats,
      hitRatio: Math.round(hitRatio * 100) / 100,
      totalOperations,
    };
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): Record<string, any> {
    return {
      memory: {
        keys: this.memoryCache.keys().length,
        stats: this.memoryCache.getStats(),
      },
      query: {
        keys: this.queryCache.keys().length,
        stats: this.queryCache.getStats(),
      },
      session: {
        keys: this.sessionCache.keys().length,
        stats: this.sessionCache.getStats(),
      },
      analytics: {
        keys: this.analyticsCache.keys().length,
        stats: this.analyticsCache.getStats(),
      },
    };
  }

  /**
   * Optimize cache performance
   */
  optimize(): void {
    // Clear expired keys manually
    [this.memoryCache, this.queryCache, this.sessionCache, this.analyticsCache].forEach(cache => {
      cache.keys().forEach(key => {
        cache.get(key); // This triggers TTL check
      });
    });

    // Reset statistics periodically
    if (this.stats.hits + this.stats.misses > 100000) {
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
      };
    }
  }

  private getCache(layer: string): NodeCache {
    switch (layer) {
      case 'memory': return this.memoryCache;
      case 'query': return this.queryCache;
      case 'session': return this.sessionCache;
      case 'analytics': return this.analyticsCache;
      default: return this.memoryCache;
    }
  }

  private setupEventListeners(): void {
    [this.memoryCache, this.queryCache, this.sessionCache, this.analyticsCache].forEach(cache => {
      cache.on('expired', () => {
        this.stats.evictions++;
      });
      
      cache.on('del', () => {
        this.stats.deletes++;
      });
    });
  }
}

export const cacheManager = CacheManager.getInstance();