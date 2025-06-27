import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/components/subscription/SubscriptionProvider";

export default function Dashboard() {
  const { user } = useAuth();
  const { subscription, getUsage, getLimit } = useSubscription();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: activityData } = useQuery({
    queryKey: ["/api/activity/recent"],
  });

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

  const overview = dashboardData?.overview || {};
  const hasActivity = overview.totalSites > 0 || overview.totalContent > 0;
  
  // Use real tracking data for charts
  const revenueData = hasActivity ? [
    { date: "Current", value: overview.totalRevenue || 0 }
  ] : [];
  
  const trafficData = hasActivity ? [
    { date: "Current", value: overview.totalClicks || 0 }
  ] : [];

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

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasActivity ? (
          <>
            <AnalyticsChart
              title="Revenue Trend"
              data={revenueData}
              dataKey="value"
              color="var(--primary-orange)"
            />
            
            <AnalyticsChart
              title="Traffic Overview"
              data={trafficData}
              dataKey="value"
              color="var(--primary-pink)"
            />
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
    </div>
  );
}
