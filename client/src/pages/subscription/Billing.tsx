import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download,
  ExternalLink,
  Crown,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Billing() {
  const { user } = useAuth();
  const { subscription, getUsage, getLimit } = useSubscription();
  const { toast } = useToast();

  // Customer portal mutation
  const customerPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/portal");
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to open billing portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenPortal = () => {
    customerPortalMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'trialing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanPrice = (tier: string) => {
    switch (tier) {
      case 'basic':
        return '$24/month';
      case 'pro':
        return '$59/month';
      case 'agency':
        return '$179/month';
      default:
        return 'Free';
    }
  };

  // Mock billing history - in real app this would come from Stripe
  const billingHistory = [
    {
      id: 'inv_1',
      date: '2024-01-01',
      description: 'Pro Plan - January 2024',
      amount: '$59.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'inv_2',
      date: '2023-12-01',
      description: 'Pro Plan - December 2023',
      amount: '$59.00',
      status: 'paid',
      downloadUrl: '#'
    },
    {
      id: 'inv_3',
      date: '2023-11-01',
      description: 'Basic Plan - November 2023',
      amount: '$24.00',
      status: 'paid',
      downloadUrl: '#'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view billing information
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/pricing">
            <Button variant="outline">
              View Plans
            </Button>
          </Link>
          {user?.stripeCustomerId && (
            <Button 
              onClick={handleOpenPortal}
              disabled={customerPortalMutation.isPending}
              className="btn-gradient"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          )}
        </div>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(user?.subscriptionStatus || 'inactive')}
              <div>
                <div className="font-medium text-lg">
                  {user?.subscriptionTier?.charAt(0).toUpperCase() + user?.subscriptionTier?.slice(1)} Plan
                </div>
                <div className="text-sm text-muted-foreground">
                  {getPlanPrice(user?.subscriptionTier || 'free')}
                </div>
              </div>
            </div>
            
            <Badge className={getStatusColor(user?.subscriptionStatus || 'inactive')}>
              {user?.subscriptionStatus || 'inactive'}
            </Badge>
          </div>
          
          {user?.currentPeriodEnd && (
            <div className="text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              Next billing date: {formatDate(user.currentPeriodEnd)}
            </div>
          )}
          
          {user?.subscriptionStatus === 'past_due' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment is past due. Please update your payment method to avoid service interruption.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Content Generation</span>
              <span className="text-sm text-muted-foreground">
                {getUsage('content_generation')}/{getLimit('content_generation') === -1 ? '∞' : getLimit('content_generation')}
              </span>
            </div>
            <Progress 
              value={getLimit('content_generation') === -1 ? 0 : (getUsage('content_generation') / getLimit('content_generation')) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">API Calls</span>
              <span className="text-sm text-muted-foreground">
                {getUsage('api_calls')}/{getLimit('api_calls') === -1 ? '∞' : getLimit('api_calls')}
              </span>
            </div>
            <Progress 
              value={getLimit('api_calls') === -1 ? 0 : (getUsage('api_calls') / getLimit('api_calls')) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Sites</span>
              <span className="text-sm text-muted-foreground">
                {subscription?.overview?.totalSites || 0}/{getLimit('sites') === -1 ? '∞' : getLimit('sites')}
              </span>
            </div>
            <Progress 
              value={getLimit('sites') === -1 ? 0 : ((subscription?.overview?.totalSites || 0) / getLimit('sites')) * 100} 
              className="h-2"
            />
          </div>
          
          {(getUsage('content_generation') / getLimit('content_generation')) > 0.8 && getLimit('content_generation') !== -1 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're approaching your monthly content generation limit. Consider upgrading your plan to avoid interruptions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No billing history</h3>
              <p className="text-muted-foreground">
                Your billing history will appear here once you make your first payment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingHistory.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">{invoice.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(invoice.date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge variant="outline" className="text-green-600">
                      {invoice.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6">
          <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Upgrade Plan</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get more features and higher limits
          </p>
          <Link href="/pricing">
            <Button className="btn-gradient w-full">
              View Plans
            </Button>
          </Link>
        </Card>
        
        <Card className="text-center p-6">
          <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Payment Method</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Update your billing information
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleOpenPortal}
            disabled={!user?.stripeCustomerId}
          >
            Manage Payment
          </Button>
        </Card>
        
        <Card className="text-center p-6">
          <Download className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Download Invoices</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get copies of your receipts
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleOpenPortal}
            disabled={!user?.stripeCustomerId}
          >
            View Invoices
          </Button>
        </Card>
      </div>
    </div>
  );
}
