import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MousePointer,
  Plus,
  Crown,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Eye,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/components/subscription/SubscriptionProvider";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { subscription, getUsage, getLimit } = useSubscription();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ["/api/activity/recent"],
  });

  // Analytics data queries
  const { data: contentPerformance, isLoading: isContentLoading } = useQuery({
    queryKey: ['/api/analytics/content-performance'],
  });

  const { data: affiliatePerformance, isLoading: isAffiliateLoading } = useQuery({
    queryKey: ['/api/analytics/affiliate-performance'],
  });

  const { data: seoRankings, isLoading: isSeoLoading } = useQuery({
    queryKey: ['/api/analytics/seo-rankings'],
  });

  const { data: revenueAnalytics, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['/api/analytics/revenue'],
  });

  console.log('📊 Frontend received dashboard data:', (dashboardData as any)?.overview);
  console.log('📊 Frontend totalViews value:', (dashboardData as any)?.overview?.totalViews);
  console.log('📊 Frontend totalClicks value:', (dashboardData as any)?.overview?.totalClicks);
  console.log('📊 Affiliate performance data:', affiliatePerformance);

  // SEO ranking distribution data
  const rankingDistributionData = (seoRankings as any)?.summary ? [
    { name: 'Top 10', value: (seoRankings as any).summary.top10 || 0, color: '#10b981' },
    { name: 'Top 20', value: (seoRankings as any).summary.top20 || 0, color: '#3b82f6' },
    { name: 'Top 50', value: (seoRankings as any).summary.top50 || 0, color: '#f59e0b' },
    { name: 'Below 50', value: (seoRankings as any).summary.below50 || 0, color: '#ef4444' }
  ].filter(item => item.value > 0) : [];

  // Revenue by status data
  const revenueStatusData = (revenueAnalytics as any)?.summary ? [
    { name: 'Confirmed', value: (revenueAnalytics as any).summary.confirmed || 0, color: '#10b981' },
    { name: 'Pending', value: (revenueAnalytics as any).summary.pending || 0, color: '#f59e0b' },
    { name: 'Cancelled', value: (revenueAnalytics as any).summary.cancelled || 0, color: '#ef4444' }
  ].filter(item => item.value > 0) : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overview = (dashboardData as any)?.overview || {};
  const hasActivity = overview.totalSites > 0 || overview.totalContent > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.username}!
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/sites">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Site
            </Button>
          </Link>
          <Link href="/content">
            <Button className="btn-gradient">
              <FileText className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <DashboardCard
          title="Sites"
          value={overview.totalSites || 0}
          description="Active sites"
          icon={Globe}
          trend={{ 
            value: `${overview.totalSites} total`, 
            positive: overview.totalSites > 0 
          }}
        />
        
        <DashboardCard
          title="Content"
          value={overview.totalContent || 0}
          description="Published articles"
          icon={FileText}
          trend={{ 
            value: `${overview.totalContent} created`, 
            positive: overview.totalContent > 0 
          }}
        />
        
        <DashboardCard
          title="Revenue"
          value={`$${overview.totalRevenue || 0}`}
          description="Affiliate earnings"
          icon={DollarSign}
          trend={{ 
            value: overview.totalRevenue > 0 ? `$${overview.totalRevenue}` : "$0", 
            positive: overview.totalRevenue > 0
          }}
        />
        
        <DashboardCard
          title="Conversion Rate"
          value={overview.conversionRate || "0%"}
          description="Click to conversion"
          icon={TrendingUp}
          trend={{ 
            value: overview.totalClicks > 0 ? `${overview.totalClicks} clicks` : "0 clicks", 
            positive: overview.totalClicks > 0 
          }}
        />
      </div>

      {/* Usage and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Content Generation</span>
                <span>{getUsage('content_generation')}/{getLimit('content_generation') === -1 ? '∞' : getLimit('content_generation')}</span>
              </div>
              <Progress 
                value={getLimit('content_generation') === -1 ? 0 : (getUsage('content_generation') / getLimit('content_generation')) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Calls</span>
                <span>{getUsage('api_calls')}/{getLimit('api_calls') === -1 ? '∞' : getLimit('api_calls')}</span>
              </div>
              <Progress 
                value={getLimit('api_calls') === -1 ? 0 : (getUsage('api_calls') / getLimit('api_calls')) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Sites</span>
                <span>{overview.totalSites}/{getLimit('sites') === -1 ? '∞' : getLimit('sites')}</span>
              </div>
              <Progress 
                value={getLimit('sites') === -1 ? 0 : (overview.totalSites / getLimit('sites')) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityData?.activities?.length > 0 ? (
              <div className="space-y-3">
                {activityData.activities.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.activityType === 'content_created' && <FileText className="h-4 w-4 text-blue-600" />}
                      {activity.activityType === 'site_created' && <Globe className="h-4 w-4 text-green-600" />}
                      {activity.activityType === 'content_published' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                      {activity.activityType === 'platform_connected' && <Users className="h-4 w-4 text-orange-600" />}
                      {activity.activityType === 'link_created' && <MousePointer className="h-4 w-4 text-pink-600" />}
                      {!['content_created', 'site_created', 'content_published', 'platform_connected', 'link_created'].includes(activity.activityType) && <Clock className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start creating content to see your activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasActivity ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Revenue tracking active</p>
                  <p className="text-sm">Current revenue: ${overview.totalRevenue || 0}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Traffic tracking active</p>
                  <p className="text-sm">Total clicks: {overview.totalClicks || 0}</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No revenue data yet</p>
                  <p className="text-sm">Start creating content and adding affiliate links to track your earnings</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No traffic data yet</p>
                  <p className="text-sm">Create and publish content to start tracking your site traffic</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isActivityLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                  <div className="h-4 w-4 bg-muted rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-muted rounded mb-1" />
                    <div className="h-3 w-32 bg-muted rounded" />
                  </div>
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(activityData as any)?.activities?.length > 0 ? (
                (activityData as any).activities.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.activityType === 'content_created' && <FileText className="h-4 w-4 text-blue-600" />}
                      {activity.activityType === 'site_created' && <Globe className="h-4 w-4 text-green-600" />}
                      {activity.activityType === 'content_published' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                      {activity.activityType === 'platform_connected' && <Users className="h-4 w-4 text-orange-600" />}
                      {activity.activityType === 'link_created' && <MousePointer className="h-4 w-4 text-pink-600" />}
                      {!['content_created', 'site_created', 'content_published', 'platform_connected', 'link_created'].includes(activity.activityType) && <Clock className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate Links</TabsTrigger>
          <TabsTrigger value="seo">SEO Rankings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Content Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isContentLoading ? (
                  <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (contentPerformance as any)?.daily ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={(contentPerformance as any).daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
                      <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
                      <Line type="monotone" dataKey="conversions" stroke="#ffc658" name="Conversions" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">No content performance data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentPerformance ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                        <p className="text-2xl font-bold">{formatNumber((contentPerformance as any)?.summary?.totalViews || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                        <p className="text-2xl font-bold">{formatNumber((contentPerformance as any)?.summary?.totalClicks || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Bounce Rate</p>
                        <p className="text-2xl font-bold">{formatPercentage((contentPerformance as any)?.summary?.avgBounceRate || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time on Page</p>
                        <p className="text-2xl font-bold">{Math.round((contentPerformance as any)?.summary?.avgTimeOnPage || 0)}s</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">Loading content summary...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="affiliate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Affiliate Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAffiliateLoading ? (
                  <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (affiliatePerformance as any)?.daily ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={(affiliatePerformance as any).daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="clicks" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="conversions" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">No affiliate performance data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing URLs</CardTitle>
              </CardHeader>
              <CardContent>
                {(affiliatePerformance as any)?.topLinks && (affiliatePerformance as any).topLinks.length > 0 ? (
                  <div className="space-y-3">
                    {(affiliatePerformance as any).topLinks.slice(0, 5).map((link: any, index: number) => (
                      <div key={link.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {link.clicks} clicks • {link.conversions} conversions • {link.conversionRate} CTR
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {formatCurrency(link.revenue)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No affiliate link data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Ranking Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSeoLoading ? (
                  <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : rankingDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={rankingDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {rankingDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">No SEO ranking data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {seoRankings ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tracked Keywords</p>
                      <p className="text-2xl font-bold">{formatNumber((seoRankings as any)?.summary?.trackedKeywords || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Position</p>
                      <p className="text-2xl font-bold">{((seoRankings as any)?.summary?.avgPosition || 0).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Improvements</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber((seoRankings as any)?.summary?.improvements || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Declines</p>
                      <p className="text-2xl font-bold text-red-600">{formatNumber((seoRankings as any)?.summary?.declines || 0)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Loading SEO summary...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isRevenueLoading ? (
                  <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (revenueAnalytics as any)?.daily ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(revenueAnalytics as any).daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="commission" fill="#8884d8" name="Commission" />
                      <Bar dataKey="transactions" fill="#82ca9d" name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">No revenue data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Revenue by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={revenueStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {revenueStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground">No revenue status data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
