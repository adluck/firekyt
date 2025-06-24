import React, { useEffect } from "react";
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
  Tag,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackPageView } from '@/utils/analytics';
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

  // Fetch content for this site
  const { data: content = [], isLoading: contentLoading } = useQuery<Content[]>({
    queryKey: [`/api/content?siteId=${siteId}`],
  });

  // Fetch analytics for this site
  const { data: analytics } = useQuery({
    queryKey: [`/api/analytics/site/${siteId}`],
  });

  // Content is already filtered by site from the API
  const allContent = Array.isArray(content) ? content : [];
  const siteContent = allContent;
  const publishedContent = siteContent.filter(c => c?.status === 'published');
  const draftContent = siteContent.filter(c => c?.status === 'draft');

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: (contentId: number) => apiRequest("DELETE", `/api/content/${contentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content`] });
      toast({
        title: "Content deleted",
        description: "Content has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Track page view when viewing site details
  useEffect(() => {
    if (site?.id) {
      trackPageView({
        siteId: parseInt(siteId),
        pageUrl: window.location.href,
        userId: 1 // Current user ID
      });
      console.log('📊 Site view tracked for site:', site.id);
    }
  }, [site?.id, siteId]);

  // Use real analytics data from API
  const analyticsData = analytics ? [
    { date: 'Jan', value: 0 },
    { date: 'Feb', value: 0 },
    { date: 'Mar', value: 0 },
    { date: 'Apr', value: 0 },
    { date: 'May', value: 0 },
    { date: 'Jun', value: analytics.views || 0 },
  ] : [];

  if (siteLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Site not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">The site you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation('/sites')} className="mt-4">
          Back to Sites
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{site.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            {site.domain && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <a href={site.domain} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  {site.domain}
                </a>
                <ExternalLink className="h-3 w-3" />
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {format(new Date(site.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
          {site.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">{site.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => setLocation(`/content/generator?siteId=${siteId}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/sites/${siteId}/settings`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Site
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Content"
          value={siteContent.length.toString()}
          icon={FileText}
          trend={{ value: siteContent.length > 0 ? `+${siteContent.length}` : "0", positive: siteContent.length > 0 }}
        />
        <DashboardCard
          title="Published"
          value={publishedContent.length.toString()}
          icon={TrendingUp}
          trend={{ value: publishedContent.length > 0 ? `+${publishedContent.length}` : "0", positive: publishedContent.length > 0 }}
        />
        <DashboardCard
          title="Drafts"
          value={draftContent.length.toString()}
          icon={Edit}
          trend={{ value: draftContent.length > 0 ? `+${draftContent.length}` : "0", positive: draftContent.length > 0 }}
        />
        <DashboardCard
          title="Monthly Views"
          value={analytics?.views?.toString() || "0"}
          icon={MousePointer}
          trend={{ value: analytics?.viewsChange?.toString() || "0", positive: true }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
          {contentLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          ) : siteContent.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No content yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Start creating content for your site to see it here.</p>
              <Button onClick={() => setLocation(`/content/generator?siteId=${siteId}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Content
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Published Content */}
              {publishedContent.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Published Content</h3>
                  {publishedContent.map((item) => (
                    <Card key={item.id} className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.title}</h4>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Published
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(item.createdAt), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                {item.contentType}
                              </span>
                              {item.targetKeywords && (
                                <span className="flex items-center gap-1">
                                  <Search className="h-4 w-4" />
                                  {item.targetKeywords.slice(0, 2).join(', ')}
                                  {item.targetKeywords.length > 2 && ` +${item.targetKeywords.length - 2}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/content/editor/${item.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteContentMutation.mutate(item.id)}
                              disabled={deleteContentMutation.isPending}
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

              {/* Draft Content */}
              {draftContent.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Draft Content</h3>
                  {draftContent.map((item) => (
                    <Card key={item.id} className="card-hover">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.title}</h4>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                Draft
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(item.createdAt), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                {item.contentType}
                              </span>
                              {item.targetKeywords && (
                                <span className="flex items-center gap-1">
                                  <Search className="h-4 w-4" />
                                  {item.targetKeywords.slice(0, 2).join(', ')}
                                  {item.targetKeywords.length > 2 && ` +${item.targetKeywords.length - 2}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLocation(`/content/editor/${item.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteContentMutation.mutate(item.id)}
                              disabled={deleteContentMutation.isPending}
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
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              title="Traffic Trend"
              data={analytics ? [
                { date: 'Current', value: analytics.views || 0 }
              ] : []}
              dataKey="value"
              color="var(--primary-orange)"
            />
            
            <AnalyticsChart
              title="Revenue Trend"
              data={analytics ? [
                { date: 'Current', value: analytics.revenue || 0 }
              ] : []}
              dataKey="value"
              color="var(--primary-pink)"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics?.clickRate || "0%"}
                  </div>
                  <div className="text-sm text-muted-foreground">Click Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ${analytics?.revenue?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics?.conversions || "0"}
                  </div>
                  <div className="text-sm text-muted-foreground">Conversions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}