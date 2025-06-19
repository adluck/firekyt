import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Share2, 
  Plus, 
  Settings, 
  Eye, 
  BarChart3, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  Globe
} from "lucide-react";
import { 
  SiWordpress, 
  SiMedium, 
  SiShopify, 
  SiLinkedin, 
  SiPinterest, 
  SiInstagram,
  SiGhost
} from "react-icons/si";

const platformIcons = {
  wordpress: SiWordpress,
  ghost: SiGhost,
  custom: Globe,
  medium: SiMedium,
  shopify: SiShopify,
  linkedin: SiLinkedin,
  pinterest: SiPinterest,
  instagram: SiInstagram,
};

const connectionSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  accessToken: z.string().min(1, "Access token is required"),
  platformUsername: z.string().optional(),
  platformUserId: z.string().optional(),
  blogUrl: z.string().optional(),
  apiEndpoint: z.string().optional(),
}).refine((data) => {
  // Require blog URL for WordPress, Ghost, and Custom platforms
  if (['wordpress', 'ghost', 'custom'].includes(data.platform)) {
    return data.blogUrl && data.blogUrl.length > 0;
  }
  return true;
}, {
  message: "Blog URL is required for this platform",
  path: ["blogUrl"],
});

const scheduleSchema = z.object({
  contentId: z.string(),
  platformConnectionId: z.string(),
  scheduledAt: z.string(),
  publishSettings: z.object({
    title: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export default function PublishingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);

  // Fetch platform connections
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/publishing/connections"],
  });
  const connections = connectionsData?.connections || [];

  // Fetch scheduled publications
  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ["/api/publishing/scheduled"],
  });
  const scheduledPublications = scheduledData?.scheduled || [];

  // Fetch publication history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/publishing/history"],
  });
  const publicationHistory = historyData?.history || [];

  // Fetch user content for scheduling
  const { data: userContent = [] } = useQuery({
    queryKey: ["/api/content"],
  });

  // Add platform connection mutation
  const addConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/publishing/connections', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing/connections"] });
      connectionForm.reset();
      setShowConnectionDialog(false);
      toast({ 
        title: "Platform connected successfully",
        description: data.message || `Connected to ${data.connection?.platform || 'platform'}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to connect platform", 
        description: error?.message || "Failed to connect platform",
        variant: "destructive" 
      });
    },
  });

  // Schedule publication mutation
  const schedulePublicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/publishing/schedule', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing/scheduled"] });
      setShowScheduleDialog(false);
      scheduleForm.reset();
      toast({ title: "Content scheduled successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to schedule content", 
        description: error?.message || "Failed to schedule content",
        variant: "destructive" 
      });
    },
  });

  // Publish now mutation
  const publishNowMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/publishing/publish-now', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ 
        title: "Content published successfully",
        description: `Published to ${data.publication?.platform || 'platform'}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to publish content", 
        description: error?.message || "Failed to publish content",
        variant: "destructive" 
      });
    },
  });



  // Cancel scheduled publication mutation
  const cancelPublicationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/publishing/scheduled/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing/scheduled"] });
      toast({ title: "Scheduled publication cancelled" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to cancel publication", 
        description: error?.message || "Failed to cancel scheduled publication",
        variant: "destructive" 
      });
    },
  });

  const connectionForm = useForm<z.infer<typeof connectionSchema>>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      platform: "",
      accessToken: "",
      platformUsername: "",
      platformUserId: "",
      blogUrl: "",
      apiEndpoint: "",
    },
  });

  const scheduleForm = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      contentId: "",
      platformConnectionId: "",
      scheduledAt: "",
      publishSettings: {
        title: "",
        excerpt: "",
        tags: [],
      },
    },
  });

  const onAddConnection = (values: z.infer<typeof connectionSchema>) => {
    addConnectionMutation.mutate(values);
  };

  const onSchedulePublication = (values: z.infer<typeof scheduleSchema>) => {
    schedulePublicationMutation.mutate({
      ...values,
      contentId: parseInt(values.contentId),
      platformConnectionId: parseInt(values.platformConnectionId),
    });
  };

  const handlePublishNow = (contentId: number, connectionId: number) => {
    publishNowMutation.mutate({
      contentId,
      platformConnectionId: connectionId,
      publishSettings: {},
    });
  };

  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform as keyof typeof platformIcons];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Share2 className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Publishing Dashboard</h1>
          <p className="text-muted-foreground">Manage your content publishing across multiple platforms</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Connect Platform
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect New Platform</DialogTitle>
                <DialogDescription>
                  Add a new social media or publishing platform to your account
                </DialogDescription>
              </DialogHeader>
              <Form {...connectionForm}>
                <form onSubmit={connectionForm.handleSubmit(onAddConnection)} className="space-y-4">
                  <FormField
                    control={connectionForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wordpress">WordPress</SelectItem>
                            <SelectItem value="ghost">Ghost CMS</SelectItem>
                            <SelectItem value="custom">Custom Blog/API</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="shopify">Shopify</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="pinterest">Pinterest</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Show blog URL field for custom blogs and Ghost */}
                  {(connectionForm.watch("platform") === "custom" || connectionForm.watch("platform") === "ghost" || connectionForm.watch("platform") === "wordpress") && (
                    <FormField
                      control={connectionForm.control}
                      name="blogUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {connectionForm.watch("platform") === "wordpress" ? "WordPress Site URL" : 
                             connectionForm.watch("platform") === "ghost" ? "Ghost Site URL" : 
                             "Blog URL"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={
                                connectionForm.watch("platform") === "wordpress" ? "https://yoursite.com" :
                                connectionForm.watch("platform") === "ghost" ? "https://yoursite.com" :
                                "https://yourblog.com"
                              } 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={connectionForm.control}
                    name="accessToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {connectionForm.watch("platform") === "wordpress" ? "Application Password or API Key" :
                           connectionForm.watch("platform") === "ghost" ? "Admin API Key" :
                           connectionForm.watch("platform") === "custom" ? "API Access Token" :
                           "Access Token"}
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={
                            connectionForm.watch("platform") === "wordpress" ? "WordPress app password" :
                            connectionForm.watch("platform") === "ghost" ? "Ghost admin API key" :
                            connectionForm.watch("platform") === "custom" ? "Your blog's API token" :
                            "Enter access token"
                          } {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Show API endpoint field for custom blogs */}
                  {connectionForm.watch("platform") === "custom" && (
                    <FormField
                      control={connectionForm.control}
                      name="apiEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Endpoint (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="/api/posts or /api/v1/posts" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={connectionForm.control}
                    name="platformUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {connectionForm.watch("platform") === "wordpress" ? "Username (for app password)" : "Username (Optional)"}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={
                            connectionForm.watch("platform") === "wordpress" ? "WordPress username" : "Platform username"
                          } {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={addConnectionMutation.isPending}>
                    {addConnectionMutation.isPending ? "Connecting..." : "Connect Platform"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Publication</DialogTitle>
                <DialogDescription>
                  Schedule your content to be published at the optimal time
                </DialogDescription>
              </DialogHeader>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(onSchedulePublication)} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="contentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content to publish" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userContent.map((content: any) => (
                              <SelectItem key={content.id} value={content.id.toString()}>
                                {content.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="platformConnectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {connections.map((connection: any) => (
                              <SelectItem key={connection.id} value={connection.id.toString()}>
                                <div className="flex items-center gap-2">
                                  {getPlatformIcon(connection.platform)}
                                  {connection.platform} - {connection.platformUsername}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={schedulePublicationMutation.isPending}>
                    {schedulePublicationMutation.isPending ? "Scheduling..." : "Schedule Publication"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Publish Now Dialog */}
          <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Publish Content Now</DialogTitle>
                <DialogDescription>
                  Select content to publish immediately to {selectedConnection?.platform}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Content</label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {(userContent as any[])?.map((content: any) => (
                      <div
                        key={content.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedContent?.id === content.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedContent(content)}
                      >
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {content.contentType} • {content.status}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(content.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedContent && selectedConnection) {
                        handlePublishNow(selectedContent.id, selectedConnection.id);
                        setShowPublishDialog(false);
                      }
                    }}
                    disabled={!selectedContent || publishNowMutation.isPending}
                  >
                    {publishNowMutation.isPending ? "Publishing..." : "Publish Now"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Platform Connections</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          <TabsTrigger value="history">Publication History</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectionsLoading ? (
              <p>Loading connections...</p>
            ) : connections.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Platform Connections</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Connect your social media and publishing platforms to start publishing content
                  </p>
                  <Button onClick={() => setShowConnectionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Your First Platform
                  </Button>
                </CardContent>
              </Card>
            ) : (
              connections.map((connection: any) => (
                <Card key={connection.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getPlatformIcon(connection.platform)}
                      {connection.platform}
                    </CardTitle>
                    <Badge variant={connection.status === 'connected' ? "default" : "secondary"}>
                      {connection.status === 'connected' ? "Connected" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Username: {connection.username || "Not provided"}
                      </p>
                      {connection.blogUrl && (
                        <p className="text-sm text-muted-foreground">
                          Blog: {connection.blogUrl}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Connected: {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedContent(userContent[0]);
                            setShowScheduleDialog(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => {
                            setSelectedConnection(connection);
                            setShowPublishDialog(true);
                          }}
                          disabled={publishNowMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {publishNowMutation.isPending ? "Publishing..." : "Publish Now"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="space-y-4">
            {scheduledLoading ? (
              <p>Loading scheduled publications...</p>
            ) : scheduledPublications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Scheduled Publications</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Schedule your content to be published at the optimal times
                  </p>
                  <Button onClick={() => setShowScheduleDialog(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Your First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              scheduledPublications.map((publication: any) => (
                <Card key={publication.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(publication.status)}
                        Scheduled for {new Date(publication.scheduledAt).toLocaleString()}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(publication.status)}>
                          {publication.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelPublicationMutation.mutate(publication.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">Content: {publication.contentTitle}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {getPlatformIcon(publication.platform)}
                        Publishing to {publication.platform}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {historyLoading ? (
              <p>Loading publication history...</p>
            ) : publicationHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Publication History</h3>
                  <p className="text-muted-foreground text-center">
                    Your published content will appear here once you start publishing
                  </p>
                </CardContent>
              </Card>
            ) : (
              publicationHistory.map((history: any) => (
                <Card key={history.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(history.status)}
                        {history.contentTitle || "Untitled Content"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(history.status)}>
                          {history.status}
                        </Badge>
                        {history.platformUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={history.platformUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {getPlatformIcon(history.platform)}
                        Published to {history.platform} on {new Date(history.publishedAt).toLocaleString()}
                      </p>
                      {history.metrics && (
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Views: {history.metrics.views || 0}</span>
                          <span>Likes: {history.metrics.likes || 0}</span>
                          <span>Shares: {history.metrics.shares || 0}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publicationHistory.length}</div>
                <p className="text-xs text-muted-foreground">Across all platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connections.filter((c: any) => c.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">Connected platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scheduledPublications.filter((p: any) => p.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">Pending publication</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}