import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Check, Crown, Zap, Star, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/subscription/create", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to subscription page with client secret
      setLocation(`/subscribe?subscription_id=${data.subscriptionId}&client_secret=${data.clientSecret}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (tier: string, priceId: string) => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (tier === 'free') {
      toast({
        title: "You're already on the free plan",
        description: "You can start using the platform right away.",
      });
      setLocation("/dashboard");
      return;
    }

    createSubscriptionMutation.mutate(priceId);
  };

  const plans = [
    {
      tier: 'free',
      title: 'Free',
      price: isAnnual ? '$0' : '$0',
      description: 'Perfect for getting started',
      priceId: '',
      features: [
        '1 affiliate site',
        '5 AI-generated articles per month',
        '100 API calls per month',
        'Basic content templates',
        'Community support'
      ],
      popular: false,
    },
    {
      tier: 'basic',
      title: 'Basic',
      price: isAnnual ? '$19' : '$24',
      description: 'For serious affiliate marketers',
      priceId: isAnnual ? 'price_basic_annual' : 'price_basic_monthly',
      features: [
        '3 affiliate sites',
        '25 AI-generated articles per month',
        '1,000 API calls per month',
        'SEO optimization tools',
        'Affiliate link management',
        'Email support'
      ],
      popular: true,
    },
    {
      tier: 'pro',
      title: 'Pro',
      price: isAnnual ? '$49' : '$59',
      description: 'For growing affiliate businesses',
      priceId: isAnnual ? 'price_pro_annual' : 'price_pro_monthly',
      features: [
        '10 affiliate sites',
        '100 AI-generated articles per month',
        '5,000 API calls per month',
        'Advanced SEO & analytics',
        'Brand voice training',
        'Affiliate link tracking',
        'Priority support'
      ],
      popular: false,
    },
    {
      tier: 'agency',
      title: 'Agency',
      price: isAnnual ? '$149' : '$179',
      description: 'For agencies and large teams',
      priceId: isAnnual ? 'price_agency_annual' : 'price_agency_monthly',
      features: [
        'Unlimited affiliate sites',
        '500 AI-generated articles per month',
        '25,000 API calls per month',
        'White-label options',
        'Advanced analytics dashboard',
        'Custom brand voices',
        'Dedicated account manager',
        'Custom integrations'
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          
          
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start generating AI-powered affiliate content today. Upgrade or downgrade at any time.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge className="gradient-bg text-white">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <PricingCard
              key={plan.tier}
              tier={plan.tier}
              title={plan.title}
              price={plan.price + (plan.tier !== 'free' ? (isAnnual ? '/year' : '/month') : '')}
              description={plan.description}
              features={plan.features}
              popular={plan.popular}
              current={user?.subscriptionTier === plan.tier}
              onSelect={() => handleSelectPlan(plan.tier, plan.priceId)}
              isLoading={createSubscriptionMutation.isPending}
            />
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Features</th>
                    <th className="text-center py-3 px-4">Free</th>
                    <th className="text-center py-3 px-4">Basic</th>
                    <th className="text-center py-3 px-4">Pro</th>
                    <th className="text-center py-3 px-4">Agency</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-4">Affiliate Sites</td>
                    <td className="text-center py-3 px-4">1</td>
                    <td className="text-center py-3 px-4">3</td>
                    <td className="text-center py-3 px-4">10</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">AI Articles/Month</td>
                    <td className="text-center py-3 px-4">5</td>
                    <td className="text-center py-3 px-4">25</td>
                    <td className="text-center py-3 px-4">100</td>
                    <td className="text-center py-3 px-4">500</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">SEO Optimization</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Brand Voice Training</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Analytics Dashboard</td>
                    <td className="text-center py-3 px-4">Basic</td>
                    <td className="text-center py-3 px-4">Standard</td>
                    <td className="text-center py-3 px-4">Advanced</td>
                    <td className="text-center py-3 px-4">Enterprise</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Support</td>
                    <td className="text-center py-3 px-4">Community</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4">Priority</td>
                    <td className="text-center py-3 px-4">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated automatically.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards including Visa, Mastercard, and American Express.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Is there a free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, our Free plan gives you access to basic features. No credit card required.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
