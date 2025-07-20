import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Mail, 
  FileText, 
  Send, 
  Eye, 
  TrendingUp, 
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  Settings,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Campaign form schema
const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Email subject is required"),
  emailTemplate: z.string().min(1, "Email template is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Valid email address is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
});

interface CRMStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  freeUsers: number;
  proUsers: number;
  enterpriseUsers: number;
  newUsersThisWeek: number;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  totalTemplates: number;
  subscriptionBreakdown: {
    free: number;
    pro: number;
    enterprise: number;
  };
  userGrowthMetrics: {
    thisMonth: number;
    lastMonth: number;
  };
}

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  targetAudience: string;
  totalRecipients?: number;
  successfulSends?: number;
  failedSends?: number;
  createdAt: string;
  sentAt?: string;
  createdById: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  trialEndsAt?: string;
}

export default function CRMDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showUserSettingsDialog, setShowUserSettingsDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTemplateSettingsDialog, setShowTemplateSettingsDialog] = useState(false);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);

  // Campaign form
  const campaignForm = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      emailTemplate: "",
      fromName: "FireKyt Team",
      fromEmail: "noreply@firekyt.com",
      targetAudience: "",
    },
  });

  // Get CRM statistics
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/crm/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/stats');
      return response.json();
    }
  });

  const stats = statsResponse?.stats;

  // Get email campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/admin/crm/campaigns'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/campaigns');
      return response.json();
    }
  });

  // Get users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/crm/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/users');
      return response.json();
    }
  });

  // Get email templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/admin/crm/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/templates');
      return response.json();
    }
  });

  // Initialize default templates mutation
  const initializeTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/crm/initialize-templates');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Templates Initialized",
        description: `${data.templates?.length || 0} default email templates created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/templates'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Initialize Templates",
        description: "Could not create default email templates. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: z.infer<typeof campaignFormSchema>) => {
      const response = await apiRequest('POST', '/api/admin/crm/campaigns', campaignData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Campaign Created",
        description: `Campaign "${data.campaign?.name}" has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/stats'] });
      setShowNewCampaignDialog(false);
      campaignForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Campaign",
        description: "Could not create email campaign. Please try again.",
        variant: "destructive",
      });
    }
  });

  const campaigns: EmailCampaign[] = campaignsData?.campaigns || [];
  const users: User[] = usersData?.users || [];
  const templates = templatesData?.templates || [];

  // Debug logging
  console.log('Debug - campaignsData:', campaignsData);
  console.log('Debug - campaigns array:', campaigns);
  console.log('Debug - campaigns loading:', campaignsLoading);

  // Handle view user
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  // Handle user settings
  const handleUserSettings = (user: User) => {
    setSelectedUser(user);
    setShowUserSettingsDialog(true);
  };

  // Handle view template
  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateDialog(true);
  };

  // Handle template settings
  const handleTemplateSettings = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateSettingsDialog(true);
  };

  // Handle campaign creation
  const onCreateCampaign = (data: z.infer<typeof campaignFormSchema>) => {
    createCampaignMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "outline" as const, label: "Draft" },
      sending: { variant: "default" as const, label: "Sending" },
      sent: { variant: "default" as const, label: "Sent" },
      failed: { variant: "destructive" as const, label: "Failed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSubscriptionBadge = (tier: string) => {
    const tierConfig = {
      free: { variant: "outline" as const, label: "Free" },
      pro: { variant: "default" as const, label: "Pro" },
      enterprise: { variant: "secondary" as const, label: "Enterprise" }
    };
    
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (statsLoading || campaignsLoading || usersLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, email campaigns, and customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => initializeTemplatesMutation.mutate()}
            disabled={initializeTemplatesMutation.isPending}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            {initializeTemplatesMutation.isPending ? "Creating..." : "Initialize Templates"}
          </Button>

        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.newUsersThisWeek || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCampaigns || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.completedCampaigns || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.userGrowthMetrics?.thisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">
                  vs {stats?.userGrowthMetrics?.lastMonth || 0} last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Breakdown</CardTitle>
                <CardDescription>Users by subscription tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Free Tier</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stats?.subscriptionBreakdown?.free || 0}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalUsers ? Math.round((stats.subscriptionBreakdown.free / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pro Tier</span>
                  <div className="flex items-center gap-2">
                    <Badge>{stats?.subscriptionBreakdown?.pro || 0}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalUsers ? Math.round((stats.subscriptionBreakdown.pro / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Enterprise</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats?.subscriptionBreakdown?.enterprise || 0}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalUsers ? Math.round((stats.subscriptionBreakdown.enterprise / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Latest email campaign activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>All registered users and their subscription status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </p>
                        {getSubscriptionBadge(user.subscriptionTier)}
                        {!user.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUserSettings(user)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Email Campaigns</CardTitle>
                <CardDescription>Manage and monitor email marketing campaigns</CardDescription>
              </div>
              <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Email Campaign</DialogTitle>
                    <DialogDescription>
                      Set up a new email marketing campaign with personalized content
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...campaignForm}>
                    <form onSubmit={campaignForm.handleSubmit(onCreateCampaign)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Weekly Newsletter" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={campaignForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Subject</FormLabel>
                              <FormControl>
                                <Input placeholder="Welcome to our latest updates!" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="fromName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>From Name</FormLabel>
                              <FormControl>
                                <Input placeholder="FireKyt Team" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={campaignForm.control}
                          name="fromEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>From Email</FormLabel>
                              <FormControl>
                                <Input placeholder="noreply@firekyt.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={campaignForm.control}
                        name="emailTemplate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an email template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templates.map((template: any) => (
                                  <SelectItem key={template.id} value={template.name}>
                                    {template.name} - {template.category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={campaignForm.control}
                        name="targetAudience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Audience</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target audience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="new_users">New Users</SelectItem>
                                <SelectItem value="active_users">Active Users</SelectItem>
                                <SelectItem value="premium_users">Premium Users</SelectItem>
                                <SelectItem value="free_users">Free Users</SelectItem>
                                <SelectItem value="beta_users">Beta Users</SelectItem>
                                <SelectItem value="inactive_users">Inactive Users</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowNewCampaignDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createCampaignMutation.isPending}>
                          {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Debug info */}
                <div className="text-xs text-gray-500 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  DEBUG: Found {campaigns.length} campaigns
                </div>
                
                {campaigns.map((campaign, index) => {
                  console.log(`Rendering campaign ${index}:`, campaign);
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-black dark:text-white">{campaign.name}</p>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Target: {campaign.targetAudience}</span>
                          {campaign.totalRecipients && (
                            <span>Recipients: {campaign.totalRecipients}</span>
                          )}
                          <span>Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {campaigns.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No campaigns found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Pre-built templates for email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-muted animate-pulse rounded" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template: any) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Category: {template.category}</span>
                          <span>Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTemplateSettings(template)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No email templates found</p>
                  <Button
                    onClick={() => initializeTemplatesMutation.mutate()}
                    disabled={initializeTemplatesMutation.isPending}
                  >
                    {initializeTemplatesMutation.isPending ? "Creating..." : "Initialize Default Templates"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User View Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information for this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">First Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.firstName || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.lastName || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subscription Tier</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.subscriptionTier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedUser.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedUser.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {selectedUser.lastLoginAt && (
                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedUser.lastLoginAt), { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Settings Dialog */}
      <Dialog open={showUserSettingsDialog} onOpenChange={setShowUserSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Settings</DialogTitle>
            <DialogDescription>
              Manage settings for this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue={selectedUser.username} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={selectedUser.email} />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue={selectedUser.firstName || ''} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue={selectedUser.lastName || ''} />
                </div>
                <div>
                  <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                  <Input id="subscriptionTier" defaultValue={selectedUser.subscriptionTier} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Input id="status" defaultValue={selectedUser.isActive ? 'Active' : 'Inactive'} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowUserSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Settings Updated",
                    description: "User settings have been updated successfully.",
                  });
                  setShowUserSettingsDialog(false);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template View Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>
              Preview of the email template content
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Template Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedTemplate.isActive ? "default" : "secondary"}>
                    {selectedTemplate.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">HTML Content Preview</Label>
                <div className="mt-2 border rounded-lg p-4 bg-muted max-h-96 overflow-y-auto">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Created {formatDistanceToNow(new Date(selectedTemplate.createdAt), { addSuffix: true })}</span>
                <span>•</span>
                <span>Updated {formatDistanceToNow(new Date(selectedTemplate.updatedAt), { addSuffix: true })}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Settings Dialog */}
      <Dialog open={showTemplateSettingsDialog} onOpenChange={setShowTemplateSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
            <DialogDescription>
              Edit template configuration and settings
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input 
                    id="templateName" 
                    defaultValue={selectedTemplate.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateCategory">Category</Label>
                  <Input 
                    id="templateCategory" 
                    defaultValue={selectedTemplate.category}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateSubject">Subject Line</Label>
                <Input 
                  id="templateSubject" 
                  defaultValue={selectedTemplate.subject}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="templateActive"
                  defaultChecked={selectedTemplate.isActive}
                  className="rounded border border-input"
                />
                <Label htmlFor="templateActive">Template is active</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTemplateSettingsDialog(false)}
                >
                  Cancel
                </Button>
                <Button>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}