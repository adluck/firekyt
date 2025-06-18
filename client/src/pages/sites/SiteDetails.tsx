import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { 
  Globe, 
  FileText, 
  TrendingUp, 
  MousePointer, 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Tag
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Site, Content } from "@shared/schema";

interface SiteDetailsProps {
  siteId: string;
}

export default function SiteDetails({ siteId }: SiteDetailsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch site details
  const { data: site, isLoading: siteLoading } = useQuery<Site>({
    queryKey: [`/api/sites/${siteId}`],
  });

  // Fetch site content
  const { data: contentData, isLoading: contentLoading, error: contentError } = useQuery<Content[]>({
    queryKey: ['/api/content', { siteId }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/content?siteId=${siteId}`);
      const data = await response.json();
      console.log('Content API response:', data);
      console.log('Content length:', data?.length);
      console.log('Content array:', Array.isArray(data));
      return data as Content[];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  const content = contentData || [];

  // Debug content state
  console.log('Current content state:', content);
  console.log('Content loading:', contentLoading);
  console.log('Content error:', contentError);

  // Fetch site analytics
  const { data: analytics } = useQuery<{
    views: number;
    viewsChange: number;
    clickRate: number;
    clickRateChange: number;
    revenue: number;
    revenueChange: number;
    contentCount: number;
    publishedCount: number;
  }>({
    queryKey: [`/api/analytics/site/${siteId}`],
    enabled: !!site,
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      await apiRequest("DELETE", `/api/content/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content', { siteId }] });
      toast({
        title: "Content deleted",
        description: "The content has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteContent = (contentId: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Real analytics data - for new sites, show zero values instead of fake data
  const analyticsData = [
    { date: "Jan", value: 0 },
    { date: "Feb", value: 0 },
    { date: "Mar", value: 0 },
    { date: "Apr", value: 0 },
    { date: "May", value: 0 },
    { date: "Jun", value: 0 },
  ];

  if (siteLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Site not found</h3>
          <p className="text-muted-foreground mb-4">
            The site you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/sites">
            <Button>Back to Sites</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const publishedContent = content.filter(c => c.status === 'published');
  const draftContent = content.filter(c => c.status === 'draft');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{site.name}</h1>
            {site.domain && (
              <a 
                href={`https://${site.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          
          {site.description && (
            <p className="text-muted-foreground max-w-2xl">{site.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {site.domain && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {site.domain}
              </div>
            )}
            {site.niche && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {site.niche}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {formatDate(site.createdAt.toString())}
            </div>
          </div>
          
          {site.targetKeywords && site.targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {site.targetKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link href={`/content?siteId=${site.id}`}>
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </Link>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Articles"
          value={content.length}
          description={`${publishedContent.length} published`}
          icon={FileText}
        />
        
        <DashboardCard
          title="Monthly Views"
          value={analytics?.views ? analytics.views.toLocaleString() : "0"}
          description={analytics?.viewsChange ? `${analytics.viewsChange > 0 ? '+' : ''}${analytics.viewsChange}% from last month` : "No data yet"}
          icon={TrendingUp}
          trend={analytics?.viewsChange ? { value: `${analytics.viewsChange > 0 ? '+' : ''}${analytics.viewsChange}%`, positive: analytics.viewsChange > 0 } : undefined}
        />
        
        <DashboardCard
          title="Click Rate"
          value={analytics?.clickRate ? `${analytics.clickRate}%` : "0%"}
          description="Affiliate link clicks"
          icon={MousePointer}
          trend={analytics?.clickRateChange ? { value: `${analytics.clickRateChange > 0 ? '+' : ''}${analytics.clickRateChange}%`, positive: analytics.clickRateChange > 0 } : undefined}
        />
        
        <DashboardCard
          title="Revenue"
          value={analytics?.revenue ? `$${analytics.revenue}` : "$0"}
          description="This month"
          icon={DollarSign}
          trend={analytics?.revenueChange ? { value: `${analytics.revenueChange > 0 ? '+' : ''}${analytics.revenueChange}%`, positive: analytics.revenueChange > 0 } : undefined}
        />
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
          <div className="p-4 bg-gray-100 rounded mb-4">
            <strong>Debug Info:</strong><br/>
            Loading: {contentLoading ? 'true' : 'false'}<br/>
            Content Length: {content?.length || 0}<br/>
            Content Type: {typeof content}<br/>
            Is Array: {Array.isArray(content) ? 'true' : 'false'}<br/>
            Error: {contentError ? String(contentError) : 'none'}
          </div>
          
          {contentLoading ? (
            <div className="text-center py-12">Loading content...</div>
          ) : !content || content.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start creating AI-powered content for this site
                </p>
                <Link href={`/content?siteId=${site.id}`}>
                  <Button className="btn-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Article
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <Card key={item.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Type: {item.contentType.replace('_', ' ')}</span>
                          <span>Created: {formatDate(item.createdAt.toString())}</span>
                          {item.publishedAt && (
                            <span>Published: {formatDate(item.publishedAt.toString())}</span>
                          )}
                        </div>
                        
                        {item.targetKeywords && item.targetKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.targetKeywords.slice(0, 3).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {item.targetKeywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.targetKeywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setLocation(`/content/editor/${item.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteContent(item.id, item.title)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              title="Traffic Trend"
              data={analyticsData}
              dataKey="value"
              color="var(--primary-orange)"
            />
            
            <AnalyticsChart
              title="Revenue Trend"
              data={analyticsData.map(item => ({ ...item, value: item.value * 0.1 }))}
              dataKey="value"
              color="var(--primary-pink)"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{analytics?.views?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Page Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics?.clickRate?.toFixed(1) || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">Click Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${analytics?.revenue?.toFixed(0) || '0'}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0%</div>
                  <div className="text-sm text-muted-foreground">SEO Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Brand Voice</label>
                  <p className="text-sm text-muted-foreground">
                    {site.brandVoice || 'Not set'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Primary Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {site.targetKeywords?.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                      </Badge>
                    )) || <p className="text-sm text-muted-foreground">No keywords set</p>}
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Site Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
