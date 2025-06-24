import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Target, BarChart3, PieChart, LineChart, Calendar } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface DashboardData {
  overview: {
    totalSites: number;
    totalContent: number;
    totalRevenue: number;
    totalViews: number;
    uniqueViews: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: string;
    clickThroughRate: string;
    avgRevenuePerClick: string;
    revenueGrowth: string;
    publishedContent?: number;
    draftContent?: number;
    monthlyViews?: number;
  };
  contentPerformance: {
    topContent: Array<{
      contentId: number;
      views: number;
      clicks: number;
      bounceRate: string;
      conversionRate: string;
    }>;
    totalPieces: number;
    avgViews: number;
    avgBounceRate: number;
  };
  seoPerformance: {
    trackedKeywords: number;
    avgPosition: string;
    topTenRankings: number;
    improvements: number;
    declines: number;
  };
  revenue: {
    total: number;
    pending: number;
    confirmed: number;
    paid: number;
    thisMonth: number;
  };
  usage: Record<string, number>;
  limits: Record<string, number>;
}

interface ContentPerformanceData {
  daily: Array<{
    date: string;
    views: number;
    clicks: number;
    conversions: number;
  }>;
  summary: {
    totalViews: number;
    totalClicks: number;
    avgBounceRate: number;
    avgTimeOnPage: number;
  };
}

interface AffiliatePerformanceData {
  daily: Array<{
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  byUrl: Array<{
    url: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  summary: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: string;
  };
}

interface SeoRankingsData {
  trends: Array<{
    keyword: string;
    positions: Array<{
      date: string;
      position: number;
      previousPosition?: number;
    }>;
    currentPosition: number;
    bestPosition: number;
    worstPosition: number;
  }>;
  distribution: {
    topThree: number;
    topTen: number;
    topFifty: number;
    beyond: number;
  };
  summary: {
    trackedKeywords: number;
    avgPosition: number;
    improvements: number;
    declines: number;
  };
}

interface RevenueData {
  daily: Array<{
    date: string;
    amount: number;
    commission: number;
    transactions: number;
  }>;
  byStatus: {
    pending: number;
    confirmed: number;
    paid: number;
    cancelled: number;
  };
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    avgCommission: number;
    avgCommissionRate: number;
  };
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState("30");

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard", period],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/dashboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      console.log('📊 Frontend received dashboard data:', data.overview);
      console.log('📊 Frontend totalViews value:', data.overview?.totalViews);
      console.log('📊 Frontend totalClicks value:', data.overview?.totalClicks);
      return data;
    },
  });

  const { data: contentPerformance, isLoading: isContentLoading } = useQuery<ContentPerformanceData>({
    queryKey: ["/api/analytics/content-performance", period],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/content-performance?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch content performance");
      return response.json();
    },
  });

  const { data: affiliatePerformance, isLoading: isAffiliateLoading } = useQuery<AffiliatePerformanceData>({
    queryKey: ["/api/analytics/affiliate-performance", period],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/affiliate-performance?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch affiliate performance");
      return response.json();
    },
  });

  const { data: seoRankings, isLoading: isSeoLoading } = useQuery<SeoRankingsData>({
    queryKey: ["/api/analytics/seo-rankings", period],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/seo-rankings?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch SEO rankings");
      return response.json();
    },
  });

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery<RevenueData>({
    queryKey: ["/api/analytics/revenue", period],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/revenue?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch revenue data");
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(2)}%`;
  };

  if (isDashboardLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const rankingDistributionData = seoRankings ? [
    { name: "Top 3", value: seoRankings.distribution.topThree, color: "#22c55e" },
    { name: "Top 10", value: seoRankings.distribution.topTen, color: "#3b82f6" },
    { name: "Top 50", value: seoRankings.distribution.topFifty, color: "#f59e0b" },
    { name: "Beyond 50", value: seoRankings.distribution.beyond, color: "#ef4444" },
  ] : [];

  const revenueStatusData = revenueData ? [
    { name: "Pending", value: revenueData.byStatus.pending, color: "#f59e0b" },
    { name: "Confirmed", value: revenueData.byStatus.confirmed, color: "#3b82f6" },
    { name: "Paid", value: revenueData.byStatus.paid, color: "#22c55e" },
    { name: "Cancelled", value: revenueData.byStatus.cancelled, color: "#ef4444" },
  ] : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData ? formatCurrency(dashboardData.overview.totalRevenue) : "$0"}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {dashboardData && parseFloat(dashboardData.overview.revenueGrowth) > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              {dashboardData ? formatPercentage(dashboardData.overview.revenueGrowth) : "0%"} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData ? formatNumber(dashboardData.overview.totalViews) : "0"}
              {dashboardData && console.log('Debug totalViews:', dashboardData.overview.totalViews)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData ? formatNumber(dashboardData.overview.uniqueViews) : "0"} unique views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData ? formatPercentage(dashboardData.overview.clickThroughRate) : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData ? formatNumber(dashboardData.overview.totalClicks) : "0"} total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData ? formatPercentage(dashboardData.overview.conversionRate) : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData ? formatNumber(dashboardData.overview.totalConversions) : "0"} conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Limits */}
      {dashboardData && (
        <Card>
          <CardHeader>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>Your current usage against subscription limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(dashboardData.limits).map(([feature, limit]) => {
                const usage = dashboardData.usage[feature] || 0;
                const percentage = limit > 0 ? (usage / limit) * 100 : 0;
                return (
                  <div key={feature} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{feature.replace('_', ' ')}</span>
                      <span>{usage}/{limit === -1 ? '∞' : limit}</span>
                    </div>
                    <Progress value={limit === -1 ? 0 : percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                ) : contentPerformance?.daily ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={contentPerformance.daily}>
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
                        <p className="text-2xl font-bold">{formatNumber(contentPerformance.summary.totalViews)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                        <p className="text-2xl font-bold">{formatNumber(contentPerformance.summary.totalClicks)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Bounce Rate</p>
                        <p className="text-2xl font-bold">{formatPercentage(contentPerformance.summary.avgBounceRate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time on Page</p>
                        <p className="text-2xl font-bold">{Math.round(contentPerformance.summary.avgTimeOnPage)}s</p>
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
                ) : affiliatePerformance?.daily ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={affiliatePerformance.daily}>
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
                {affiliatePerformance?.byUrl ? (
                  <div className="space-y-3">
                    {affiliatePerformance.byUrl.slice(0, 5).map((url, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{url.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {url.clicks} clicks • {url.conversions} conversions
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {formatCurrency(url.revenue)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No affiliate URL data available</p>
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
                      <p className="text-2xl font-bold">{seoRankings.summary.trackedKeywords}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Position</p>
                      <p className="text-2xl font-bold">{seoRankings.summary.avgPosition.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Improvements</p>
                      <p className="text-2xl font-bold text-green-600">{seoRankings.summary.improvements}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Declines</p>
                      <p className="text-2xl font-bold text-red-600">{seoRankings.summary.declines}</p>
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
                ) : revenueData?.daily ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.daily}>
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