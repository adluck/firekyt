import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Database, 
  Server, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap
} from "lucide-react";

interface PerformanceMetrics {
  timestamp: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  cacheHitRatio: number;
}

interface PerformanceData {
  currentMetrics: PerformanceMetrics;
  systemHealth: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
  cache: {
    stats: {
      hits: number;
      misses: number;
      hitRatio: number;
      totalKeys: number;
    };
    memoryStats: {
      memoryUsage: number;
      keyCount: number;
      avgKeySize: number;
    };
  };
  rateLimiting: {
    totalKeys: number;
    rules: string[];
    topOffenders: Array<{ key: string; hits: number }>;
  };
  database: {
    metrics: {
      databaseSize: { database_size: string };
      activeConnections: { active_connections: string };
      cacheHitRatio: { cache_hit_ratio: number };
      tableSizes: Array<{ tablename: string; size: string }>;
      indexUsage: Array<{ indexname: string; idx_scan: number }>;
    };
    slowQueries: Array<{
      query: string;
      calls: number;
      total_time: number;
      mean_time: number;
    }>;
  };
  alerts: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: string;
  }>;
  trends: {
    responseTime: { current: number; change: number };
    memoryUsage: { current: number; change: number };
    requestsPerSecond: { current: number; change: number };
  };
}

function formatUptime(uptime: number): string {
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function getTrendIcon(change: number) {
  if (change > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (change < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
  return <BarChart3 className="h-4 w-4 text-gray-500" />;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'warning': return 'default';
    default: return 'secondary';
  }
}

export default function PerformanceDashboard() {
  const { data: performanceData, isLoading, error } = useQuery<PerformanceData>({
    queryKey: ['/api/admin/performance'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load performance data. Please ensure you have admin access.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!performanceData) return null;

  const { currentMetrics, systemHealth, cache, rateLimiting, database, alerts, trends } = performanceData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Performance Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Live Monitoring
            </span>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert key={index} variant={getSeverityColor(alert.severity) as any}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.metric}</strong>: {alert.value.toFixed(2)} exceeds threshold of {alert.threshold} ({alert.severity})
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{currentMetrics.responseTime.toFixed(0)}ms</div>
                {getTrendIcon(trends.responseTime.change)}
              </div>
              <p className="text-xs text-muted-foreground">
                {trends.responseTime.change > 0 ? '+' : ''}{trends.responseTime.change.toFixed(1)}% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.memoryUsage.toFixed(1)}%</div>
              <Progress value={currentMetrics.memoryUsage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(systemHealth.memory.heapUsed)} / {formatBytes(systemHealth.memory.heapTotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests/sec</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{currentMetrics.requestsPerSecond.toFixed(1)}</div>
                {getTrendIcon(trends.requestsPerSecond.change)}
              </div>
              <p className="text-xs text-muted-foreground">
                Error rate: {currentMetrics.errorRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics.cacheHitRatio.toFixed(1)}%</div>
              <Progress value={currentMetrics.cacheHitRatio} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {cache.stats.totalKeys} keys cached
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Tabs defaultValue="system" className="space-y-4">
          <TabsList>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="cache">Cache Performance</TabsTrigger>
            <TabsTrigger value="database">Database Metrics</TabsTrigger>
            <TabsTrigger value="security">Rate Limiting</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium">{formatUptime(systemHealth.uptime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CPU Usage</span>
                    <span className="text-sm font-medium">{((systemHealth.cpu.user + systemHealth.cpu.system) / 1000000).toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Connections</span>
                    <span className="text-sm font-medium">{currentMetrics.activeConnections}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Request Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Response Time</span>
                    <span className="text-sm font-medium">{currentMetrics.responseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="text-sm font-medium">{currentMetrics.errorRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Throughput</span>
                    <span className="text-sm font-medium">{currentMetrics.requestsPerSecond.toFixed(1)} req/s</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Health Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant={currentMetrics.responseTime < 500 ? "default" : "destructive"}>
                      Response Time: {currentMetrics.responseTime < 500 ? "Good" : "Poor"}
                    </Badge>
                    <Badge variant={currentMetrics.memoryUsage < 80 ? "default" : "destructive"}>
                      Memory: {currentMetrics.memoryUsage < 80 ? "Normal" : "High"}
                    </Badge>
                    <Badge variant={currentMetrics.errorRate < 5 ? "default" : "destructive"}>
                      Errors: {currentMetrics.errorRate < 5 ? "Low" : "High"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hit Ratio</span>
                    <span className="text-sm font-medium">{cache.stats.hitRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Hits</span>
                    <span className="text-sm font-medium">{cache.stats.hits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Misses</span>
                    <span className="text-sm font-medium">{cache.stats.misses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Keys</span>
                    <span className="text-sm font-medium">{cache.stats.totalKeys.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cache Memory</span>
                    <span className="text-sm font-medium">{cache.memoryStats.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={cache.memoryStats.memoryUsage} />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Key Count</span>
                    <span className="text-sm font-medium">{cache.memoryStats.keyCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Key Size</span>
                    <span className="text-sm font-medium">{formatBytes(cache.memoryStats.avgKeySize)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database Size</span>
                    <span className="text-sm font-medium">{database.metrics.databaseSize.database_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Connections</span>
                    <span className="text-sm font-medium">{database.metrics.activeConnections.active_connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cache Hit Ratio</span>
                    <span className="text-sm font-medium">{database.metrics.cacheHitRatio.cache_hit_ratio?.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Table Sizes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {database.metrics.tableSizes.slice(0, 8).map((table, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{table.tablename}</span>
                        <span className="font-medium">{table.size}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {database.slowQueries.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Slow Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {database.slowQueries.map((query, index) => (
                        <div key={index} className="border rounded p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Time: {query.mean_time.toFixed(2)}ms</span>
                            <span className="text-muted-foreground">Calls: {query.calls}</span>
                          </div>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
                            {query.query.length > 100 ? `${query.query.substring(0, 100)}...` : query.query}
                          </code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rate Limiting Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Limits</span>
                    <span className="text-sm font-medium">{rateLimiting.totalKeys}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rule Categories</span>
                    <span className="text-sm font-medium">{rateLimiting.rules.length}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Active Rules:</span>
                    <div className="flex flex-wrap gap-1">
                      {rateLimiting.rules.map((rule, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Rate Limited IPs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {rateLimiting.topOffenders.slice(0, 10).map((offender, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-mono text-xs">
                          {offender.key.length > 30 ? `${offender.key.substring(0, 30)}...` : offender.key}
                        </span>
                        <span className="font-medium">{offender.hits} hits</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}