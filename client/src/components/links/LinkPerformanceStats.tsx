import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, Eye, MousePointer, DollarSign, Activity, ChevronDown, ChevronUp, ExternalLink, Globe, FileText } from 'lucide-react';

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
  linkDetails: {
    id: number;
    title: string;
    originalUrl: string;
    shortenedUrl?: string;
    description?: string;
    keywords: string[];
    targetKeywords: string[];
    priority: number;
    isActive: boolean;
    sites: Array<{
      siteName: string;
      siteUrl: string;
      contentTitle?: string;
      contentId?: number;
    }>;
  };
  recentActivity: Array<{
    eventType: string;
    timestamp: string;
    revenue?: number;
    sessionId?: string;
    referrer?: string;
    contentTitle?: string;
  }>;
}

export default function LinkPerformanceStats({ linkId, days = 30 }: LinkPerformanceStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>
                  {stats.linkDetails?.title || `Link Performance (Last ${days} days)`}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {/* Quick Stats Preview */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{stats.totalViews}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointer className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{stats.totalClicks}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">${stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <Badge variant="outline">
                    {stats.clickThroughRate.toFixed(1)}% CTR
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {stats.linkDetails?.description && (
              <CardDescription className="text-left">
                {stats.linkDetails.description}
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Link Details Section */}
            {stats.linkDetails && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Link Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Target URL:</span>
                    <a 
                      href={stats.linkDetails.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate max-w-md"
                    >
                      {stats.linkDetails.originalUrl}
                    </a>
                  </div>
                  {stats.linkDetails.shortenedUrl && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tracking URL:</span>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {stats.linkDetails.shortenedUrl}
                      </code>
                    </div>
                  )}
                  {stats.linkDetails.keywords && stats.linkDetails.keywords.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium">Keywords:</span>
                      <div className="flex flex-wrap gap-1">
                        {stats.linkDetails.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content & Sites Section */}
            {stats.linkDetails?.sites && stats.linkDetails.sites.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Published Content & Sites
                </h4>
                <div className="space-y-3">
                  {stats.linkDetails.sites.map((site, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{site.siteName}</div>
                          {site.contentTitle && (
                            <div className="text-xs text-muted-foreground">
                              Content: {site.contentTitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <a 
                        href={site.siteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Visit Site <ExternalLink className="h-3 w-3 inline ml-1" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
                <div className="text-sm text-muted-foreground">Views</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MousePointer className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.totalClicks}</div>
                <div className="text-sm text-muted-foreground">Clicks</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalConversions}</div>
                <div className="text-sm text-muted-foreground">Conversions</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">${stats.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
            </div>

            {/* Performance Rates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold">{stats.clickThroughRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Click-Through Rate</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold">{stats.conversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-lg font-semibold">${stats.averageCommission.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Avg Commission</div>
              </div>
            </div>

            {/* Recent Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Recent Activity</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stats.recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.eventType}
                        </Badge>
                        {activity.contentTitle && (
                          <span className="text-muted-foreground">{activity.contentTitle}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.revenue && (
                          <span className="text-green-600">+${activity.revenue.toFixed(2)}</span>
                        )}
                        <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}