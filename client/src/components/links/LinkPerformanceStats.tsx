import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, MousePointer, DollarSign, Activity } from 'lucide-react';

interface LinkPerformanceStatsProps {
  linkId: number;
  days?: number;
}

interface PerformanceStats {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  clickThroughRate: number;
  conversionRate: number;
  averageCommission: number;
  recentActivity: Array<{
    eventType: string;
    timestamp: string;
    revenue?: number;
    sessionId?: string;
  }>;
}

export default function LinkPerformanceStats({ linkId, days = 30 }: LinkPerformanceStatsProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/links', linkId, 'stats', days],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/links/${linkId}/stats?days=${days}`);
      return response.json() as Promise<PerformanceStats>;
    },
    enabled: !!linkId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Link Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted h-16 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Link Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load performance stats</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Link Performance (Last {days} days)
        </CardTitle>
        <CardDescription>
          Track clicks, conversions, and revenue for this intelligent link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.totalViews}</span>
            </div>
            <div className="text-sm text-muted-foreground">Views</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MousePointer className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.totalClicks}</span>
            </div>
            <div className="text-sm text-muted-foreground">Clicks</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{stats.totalConversions}</span>
            </div>
            <div className="text-sm text-muted-foreground">Conversions</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">${stats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground">Revenue</div>
          </div>
        </div>

        {/* Performance Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {stats.clickThroughRate.toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Click-Through Rate</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-lg font-semibold text-green-700 dark:text-green-300">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Conversion Rate</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
              ${stats.averageCommission.toFixed(2)}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Avg Commission</div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Recent Activity</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        activity.eventType === 'conversion' ? 'default' :
                        activity.eventType === 'click' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {activity.eventType}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {activity.revenue && (
                    <span className="font-medium text-green-600">
                      +${Number(activity.revenue).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}