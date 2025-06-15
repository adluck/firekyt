import Redis from 'ioredis';
import { promisify } from 'util';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

export class DistributedCacheManager {
  private redis: Redis;
  private localCache: Map<string, CacheItem>;
  private readonly maxLocalCacheSize: number = 1000;
  private readonly defaultTTL: number = 3600; // 1 hour

  constructor(config?: CacheConfig) {
    this.redis = new Redis({
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config?.password || process.env.REDIS_PASSWORD,
      db: config?.db || 0,
      keyPrefix: config?.keyPrefix || 'affiliate:',
      retryDelayOnFailover: config?.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config?.maxRetriesPerRequest || 3,
      lazyConnect: true,
      enableReadyCheck: true,
      maxLoadingTimeout: 5000
    });

    this.localCache = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.redis.on('ready', () => {
      console.log('Redis ready for operations');
    });
  }

  // Multi-layer cache get with fallback
  async get<T>(key: string, fallbackFn?: () => Promise<T>, ttl?: number): Promise<T | null> {
    try {
      // L1: Check local cache first
      const localItem = this.getFromLocal(key);
      if (localItem && !this.isExpired(localItem)) {
        return localItem.data;
      }

      // L2: Check Redis cache
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const parsed = JSON.parse(redisValue);
        this.setToLocal(key, parsed, ttl || this.defaultTTL);
        return parsed;
      }

      // L3: Execute fallback function if provided
      if (fallbackFn) {
        const data = await fallbackFn();
        if (data !== null && data !== undefined) {
          await this.set(key, data, ttl);
        }
        return data;
      }

      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      
      // Try fallback on Redis error
      if (fallbackFn) {
        return await fallbackFn();
      }
      
      return null;
    }
  }

  // Set data in both local and distributed cache
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      // Set in Redis with TTL
      await this.redis.setex(key, ttl, serialized);
      
      // Set in local cache
      this.setToLocal(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  // Batch operations for better performance
  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: { [key: string]: any }, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        pipeline.setex(key, ttl, serialized);
        this.setToLocal(key, value, ttl);
      });
      
      await pipeline.exec();
    } catch (error) {
      console.error('Cache mset error:', error);
      throw error;
    }
  }

  // Delete from both caches
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.localCache.delete(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  // Pattern-based deletion
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      // Clear matching local cache entries
      for (const [key] of this.localCache) {
        if (this.matchesPattern(key, pattern)) {
          this.localCache.delete(key);
        }
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    }
  }

  // Increment/Decrement operations for counters
  async incr(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  // Set operations for collections
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      console.error(`Cache sadd error for key ${key}:`, error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      console.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  // Hash operations for structured data
  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      await this.redis.hset(key, field, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache hset error for key ${key}, field ${field}:`, error);
    }
  }

  async hget(key: string, field: string): Promise<any> {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hgetall(key: string): Promise<{ [field: string]: any }> {
    try {
      const result = await this.redis.hgetall(key);
      const parsed: { [field: string]: any } = {};
      
      Object.entries(result).forEach(([field, value]) => {
        parsed[field] = JSON.parse(value);
      });
      
      return parsed;
    } catch (error) {
      console.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // Local cache management
  private getFromLocal(key: string): CacheItem | undefined {
    return this.localCache.get(key);
  }

  private setToLocal(key: string, value: any, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.localCache.size >= this.maxLocalCacheSize) {
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }

    this.localCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    });
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  // Cache warming for frequently accessed data
  async warmCache(warmingStrategies: Array<{ key: string; dataFn: () => Promise<any>; ttl?: number }>): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const strategy of warmingStrategies) {
      try {
        const data = await strategy.dataFn();
        const serialized = JSON.stringify(data);
        const ttl = strategy.ttl || this.defaultTTL;
        
        pipeline.setex(strategy.key, ttl, serialized);
        this.setToLocal(strategy.key, data, ttl);
      } catch (error) {
        console.error(`Cache warming error for key ${strategy.key}:`, error);
      }
    }
    
    await pipeline.exec();
  }

  // Cache statistics
  async getStats(): Promise<{
    localCacheSize: number;
    redisInfo: any;
    hitRate: number;
  }> {
    try {
      const redisInfo = await this.redis.info('stats');
      
      return {
        localCacheSize: this.localCache.size,
        redisInfo: this.parseRedisInfo(redisInfo),
        hitRate: this.calculateHitRate()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        localCacheSize: this.localCache.size,
        redisInfo: {},
        hitRate: 0
      };
    }
  }

  private parseRedisInfo(info: string): { [key: string]: string } {
    const parsed: { [key: string]: string } = {};
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    });
    return parsed;
  }

  private calculateHitRate(): number {
    // This would need to be implemented with proper metrics collection
    // For now, return a placeholder
    return 0.85; // 85% hit rate
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      this.localCache.clear();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}

// Specialized cache managers for different data types
export class UserCacheManager extends DistributedCacheManager {
  async getUserProfile(userId: number): Promise<any> {
    return this.get(`user:profile:${userId}`, async () => {
      // This would fetch from database
      return null; // Placeholder
    }, 1800); // 30 minutes
  }

  async setUserProfile(userId: number, profile: any): Promise<void> {
    await this.set(`user:profile:${userId}`, profile, 1800);
  }

  async getUserSessions(userId: number): Promise<string[]> {
    return this.smembers(`user:sessions:${userId}`);
  }

  async addUserSession(userId: number, sessionId: string): Promise<void> {
    await this.sadd(`user:sessions:${userId}`, sessionId);
  }
}

export class ContentCacheManager extends DistributedCacheManager {
  async getContentList(userId: number, page: number = 1, limit: number = 20): Promise<any[]> {
    const key = `content:list:${userId}:${page}:${limit}`;
    return this.get(key, async () => {
      // This would fetch from database
      return [];
    }, 600); // 10 minutes
  }

  async getContentItem(contentId: number): Promise<any> {
    return this.get(`content:item:${contentId}`, async () => {
      // This would fetch from database
      return null;
    }, 1800); // 30 minutes
  }

  async invalidateUserContent(userId: number): Promise<void> {
    await this.delPattern(`content:list:${userId}:*`);
  }

  async invalidateContent(contentId: number): Promise<void> {
    await this.del(`content:item:${contentId}`);
  }
}

export class AnalyticsCacheManager extends DistributedCacheManager {
  async getRealtimeMetrics(userId: number): Promise<any> {
    return this.get(`analytics:realtime:${userId}`, async () => {
      // This would calculate from recent events
      return {
        views: 0,
        clicks: 0,
        revenue: 0,
        ctr: 0
      };
    }, 300); // 5 minutes
  }

  async incrementMetric(userId: number, metric: string, amount: number = 1): Promise<void> {
    const key = `analytics:counter:${userId}:${metric}`;
    await this.incr(key, amount);
  }

  async getDashboardData(userId: number, period: string): Promise<any> {
    const key = `analytics:dashboard:${userId}:${period}`;
    return this.get(key, async () => {
      // This would aggregate analytics data
      return {
        overview: {},
        charts: {},
        topContent: []
      };
    }, 1800); // 30 minutes
  }
}

// Factory for creating cache managers
export class CacheManagerFactory {
  private static instances: Map<string, DistributedCacheManager> = new Map();

  static getInstance(type: 'user' | 'content' | 'analytics' | 'general', config?: CacheConfig): DistributedCacheManager {
    if (!this.instances.has(type)) {
      switch (type) {
        case 'user':
          this.instances.set(type, new UserCacheManager(config));
          break;
        case 'content':
          this.instances.set(type, new ContentCacheManager(config));
          break;
        case 'analytics':
          this.instances.set(type, new AnalyticsCacheManager(config));
          break;
        default:
          this.instances.set(type, new DistributedCacheManager(config));
      }
    }
    return this.instances.get(type)!;
  }

  static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.instances.values()).map(cache => cache.disconnect());
    await Promise.all(disconnectPromises);
    this.instances.clear();
  }
}

export default DistributedCacheManager;