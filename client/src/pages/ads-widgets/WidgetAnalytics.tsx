import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Eye, MousePointer, TrendingUp, Calendar, Monitor, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface AdWidget {
  id: number;
  name: string;
  size: string;
  theme: any;
  rotationInterval: number;
  ads: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    views: number;
    clicks: number;
    ctr: number;
  };
}

interface WidgetAnalytics {
  id: number;
  widgetId: number;
  eventType: string;
  adIndex: number | null;
  referrer: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export default function WidgetAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedWidget, setSelectedWidget] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("7d");

  // Get widget ID from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const widgetId = urlParams.get('widget');
    if (widgetId) {
      setSelectedWidget(widgetId);
    }
  }, []);

  const { data: widgetsData, isLoading: widgetsLoading } = useQuery({
    queryKey: ["/api/widgets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/widgets");
      return response.json();
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/widgets", selectedWidget, "analytics", timeRange],
    queryFn: async () => {
      if (!selectedWidget) return null;
      const response = await apiRequest("GET", `/api/widgets/${selectedWidget}/analytics?timeRange=${timeRange}`);
      return response.json();
    },
    enabled: !!selectedWidget,
  });

  const { data: widgetData } = useQuery({
    queryKey: ["/api/widgets", selectedWidget],
    queryFn: async () => {
      if (!selectedWidget) return null;
      const response = await apiRequest("GET", `/api/widgets/${selectedWidget}`);
      return response.json();
    },
    enabled: !!selectedWidget,
  });

  const widgets = widgetsData?.widgets || [];
  const analytics = analyticsData?.analytics || [];
  const widget = widgetData?.widget;

  // Calculate analytics summary
  const viewEvents = analytics.filter((a: WidgetAnalytics) => a.eventType === 'view');
  const clickEvents = analytics.filter((a: WidgetAnalytics) => a.eventType === 'click');
  const totalViews = viewEvents.length;
  const totalClicks = clickEvents.length;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

  // Group by date for trend analysis
  const viewsByDate = viewEvents.reduce((acc: any, event: WidgetAnalytics) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const clicksByDate = clickEvents.reduce((acc: any, event: WidgetAnalytics) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Ad performance breakdown
  const adPerformance = widget?.ads.map((ad: any, index: number) => {
    const adViews = viewEvents.filter((e: WidgetAnalytics) => e.adIndex === index).length;
    const adClicks = clickEvents.filter((e: WidgetAnalytics) => e.adIndex === index).length;
    const adCtr = adViews > 0 ? ((adClicks / adViews) * 100).toFixed(2) : "0.00";
    
    return {
      index,
      title: ad.title || `Ad ${index + 1}`,
      views: adViews,
      clicks: adClicks,
      ctr: adCtr,
    };
  }) || [];

  if (widgetsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/ads-widgets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Widgets
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Widget Analytics</h1>
            <p className="text-muted-foreground">Track performance and engagement for your ad widgets</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedWidget} onValueChange={setSelectedWidget}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select a widget to analyze" />
          </SelectTrigger>
          <SelectContent>
            {widgets.map((widget: AdWidget) => (
              <SelectItem key={widget.id} value={widget.id.toString()}>
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>{widget.name}</span>
                  <Badge variant={widget.isActive ? "default" : "secondary"} className="ml-2">
                    {widget.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!selectedWidget ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Widget</h3>
            <p className="text-muted-foreground text-center">
              Choose a widget from the dropdown above to view its analytics and performance metrics.
            </p>
          </CardContent>
        </Card>
      ) : analyticsLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
                <p className="text-xs text-muted-foreground">
                  Widget impressions in {timeRange}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClicks}</div>
                <p className="text-xs text-muted-foreground">
                  Affiliate link clicks in {timeRange}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ctr}%</div>
                <p className="text-xs text-muted-foreground">
                  Conversion rate for {timeRange}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ads">Ad Performance</TabsTrigger>
              <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Information</CardTitle>
                  <CardDescription>Basic details about this widget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {widget && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Widget Name</p>
                        <p className="text-sm text-muted-foreground">{widget.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Size</p>
                        <p className="text-sm text-muted-foreground">{widget.size}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Number of Ads</p>
                        <p className="text-sm text-muted-foreground">{widget.ads.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Rotation Interval</p>
                        <p className="text-sm text-muted-foreground">{widget.rotationInterval} seconds</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge variant={widget.isActive ? "default" : "secondary"}>
                          {widget.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(widget.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Ad Performance</CardTitle>
                  <CardDescription>See how each ad in your widget is performing</CardDescription>
                </CardHeader>
                <CardContent>
                  {adPerformance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No ad performance data available for the selected time range.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {adPerformance.map((ad) => (
                        <div key={ad.index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{ad.title}</h4>
                            <Badge variant="outline">Ad {ad.index + 1}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Views</p>
                              <p className="font-semibold">{ad.views}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Clicks</p>
                              <p className="font-semibold">{ad.clicks}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">CTR</p>
                              <p className="font-semibold">{ad.ctr}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your widget traffic is coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No traffic data available for the selected time range.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const referrerData = analytics
                          .filter((a: WidgetAnalytics) => a.referrer)
                          .reduce((acc: any, event: WidgetAnalytics) => {
                            const referrer = event.referrer || 'Direct';
                            acc[referrer] = (acc[referrer] || 0) + 1;
                            return acc;
                          }, {});
                        
                        return Object.entries(referrerData)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 10)
                          .map(([referrer, count]) => (
                            <div key={referrer} className="flex items-center justify-between py-2">
                              <span className="text-sm">{referrer}</span>
                              <Badge variant="outline">{count as number} visits</Badge>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}