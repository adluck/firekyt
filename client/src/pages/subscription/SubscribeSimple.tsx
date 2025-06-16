import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Crown, Star, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription";

export default function SubscribeSimple() {
  const { user } = useAuth();

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Star className="h-5 w-5" />;
      case 'pro':
        return <Zap className="h-5 w-5" />;
      case 'agency':
        return <Crown className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'bg-blue-500';
      case 'pro':
        return 'bg-orange-500';
      case 'agency':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Scale your affiliate marketing with AI-powered content generation
        </p>
        
        {user?.subscriptionTier === 'admin' && (
          <Alert className="max-w-2xl mx-auto mb-6">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Access:</strong> You have unlimited access to all platform features.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Object.entries(SUBSCRIPTION_TIERS).map(([tier, plan]) => (
          <Card 
            key={tier} 
            className={`relative ${tier === 'pro' ? 'border-2 border-orange-500 shadow-lg scale-105' : ''}`}
          >
            {tier === 'pro' && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className={`w-12 h-12 ${getPlanColor(tier)} rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
                {getPlanIcon(tier)}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
                {plan.price > 0 && <span className="text-base font-normal text-muted-foreground">/month</span>}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={tier === 'pro' ? 'default' : 'outline'}
                disabled={user?.subscriptionTier === tier || user?.subscriptionTier === 'admin'}
              >
                {user?.subscriptionTier === tier ? 'Current Plan' : 
                 user?.subscriptionTier === 'admin' ? 'Admin Access' : 
                 tier === 'free' ? 'Get Started' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Alert className="max-w-2xl mx-auto">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Payment processing is currently being configured. 
            All users currently have access to pro-level features during our beta period.
          </AlertDescription>
        </Alert>
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards and provide secure payment processing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a free trial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, start with our free plan and upgrade when you need more features and capacity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee on all paid plans. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}