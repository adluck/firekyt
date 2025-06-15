import { Pool } from 'pg';

/**
 * Database Connection Pool Manager
 * Optimizes database connections for high-traffic scenarios
 */
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private pool: Pool;
  private connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    totalQueries: 0,
    avgQueryTime: 0,
    slowQueries: 0,
  };

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 50, // Maximum pool size
      min: 5,  // Minimum pool size
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Timeout for getting connection
      acquireTimeoutMillis: 60000, // Maximum time to wait for connection
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    this.setupPoolEvents();
    this.startMonitoring();
  }

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  async query(text: string, params?: any[]): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const queryTime = Date.now() - startTime;
      
      this.updateQueryStats(queryTime);
      
      if (queryTime > 1000) { // Log slow queries (>1s)
        console.warn(`Slow query detected: ${queryTime}ms - ${text.substring(0, 100)}...`);
        this.connectionStats.slowQueries++;
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getStats() {
    return {
      ...this.connectionStats,
      poolInfo: {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      }
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private setupPoolEvents(): void {
    this.pool.on('connect', (client) => {
      this.connectionStats.totalConnections++;
      console.log('New database connection established');
    });

    this.pool.on('remove', (client) => {
      console.log('Database connection removed');
    });

    this.pool.on('error', (err, client) => {
      console.error('Database pool error:', err);
    });
  }

  private updateQueryStats(queryTime: number): void {
    this.connectionStats.totalQueries++;
    
    // Calculate rolling average
    const weight = 0.1; // Weight for new values
    this.connectionStats.avgQueryTime = 
      (this.connectionStats.avgQueryTime * (1 - weight)) + (queryTime * weight);
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.connectionStats.activeConnections = this.pool.totalCount - this.pool.idleCount;
      this.connectionStats.idleConnections = this.pool.idleCount;
      this.connectionStats.waitingClients = this.pool.waitingCount;

      // Log stats if there are performance issues
      if (this.connectionStats.waitingClients > 5 || this.connectionStats.avgQueryTime > 500) {
        console.warn('Database performance warning:', this.getStats());
      }
    }, 30000); // Check every 30 seconds
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const connectionPool = ConnectionPoolManager.getInstance();