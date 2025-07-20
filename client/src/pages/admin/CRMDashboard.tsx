import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  // Get CRM statistics
  const { data: stats, isLoading: statsLoading } = useQuery<CRMStats>({
    queryKey: ['/api/admin/crm/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/crm/stats');
      return response.json();
    }
  });

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

  const campaigns: EmailCampaign[] = campaignsData?.campaigns || [];
  const users: User[] = usersData?.users || [];

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
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Campaign
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
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
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
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Manage and monitor email marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{campaign.name}</p>
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
                ))}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}