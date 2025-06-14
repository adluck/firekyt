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
  Crown
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
  const chartData = [
    { date: "Jan", value: 1200 },
    { date: "Feb", value: 1900 },
    { date: "Mar", value: 3000 },
    { date: "Apr", value: 2780 },
    { date: "May", value: 3890 },
    { date: "Jun", value: 4390 },
  ];

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

      {/* Subscription Status */}
      {user && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">
                    {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} Plan
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.subscriptionStatus === 'active' ? 'Active subscription' : 'Inactive subscription'}
                  </div>
                </div>
              </div>
              
              {user.subscriptionTier === 'free' && (
                <Link href="/pricing">
                  <Button size="sm" className="btn-gradient">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Sites"
          value={overview.totalSites || 0}
          description="Active affiliate sites"
          icon={Globe}
          trend={{ value: "+2 this month", positive: true }}
        />
        
        <DashboardCard
          title="Content Pieces"
          value={overview.totalContent || 0}
          description="Published articles"
          icon={FileText}
          trend={{ value: "+12 this month", positive: true }}
        />
        
        <DashboardCard
          title="Total Revenue"
          value={`$${overview.totalRevenue || 0}`}
          description="Affiliate earnings"
          icon={DollarSign}
          trend={{ value: "+5.2%", positive: true }}
        />
        
        <DashboardCard
          title="Conversion Rate"
          value={`${overview.conversionRate || 0}%`}
          description="Click to conversion"
          icon={TrendingUp}
          trend={{ value: "+0.3%", positive: true }}
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>New article published on Tech Reviews</span>
                <Badge variant="secondary" className="ml-auto">2h ago</Badge>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>AI content generated for Best Laptops</span>
                <Badge variant="secondary" className="ml-auto">5h ago</Badge>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>New affiliate link added</span>
                <Badge variant="secondary" className="ml-auto">1d ago</Badge>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Site "Gaming Gear" created</span>
                <Badge variant="secondary" className="ml-auto">3d ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Revenue Trend"
          data={chartData}
          dataKey="value"
          color="var(--primary-orange)"
        />
        
        <AnalyticsChart
          title="Traffic Overview"
          data={chartData.map(item => ({ ...item, value: item.value * 10 }))}
          dataKey="value"
          color="var(--primary-pink)"
        />
      </div>
    </div>
  );
}
