import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Check if Stripe is configured
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const SubscribeForm = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (!stripePublicKey) {
        toast({
          title: "Payment unavailable",
          description: "Payment processing is temporarily unavailable. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Simulate payment processing
      setTimeout(() => {
        toast({
          title: "Subscription Active!",
          description: "Welcome to your new plan. You can now access all features.",
        });
        setLocation("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-muted/20">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {stripePublicKey ? "Payment form will load here" : "Payment processing unavailable"}
          </p>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full btn-gradient"
        disabled={!stripePublicKey || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Subscription"
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground text-center">
        By subscribing, you agree to our Terms of Service and Privacy Policy.
        You can cancel your subscription at any time.
      </div>
    </form>
  );
};

export default function Subscribe() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract plan from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const plan = params.get('plan') || 'pro';
    setSelectedPlan(plan);
    setIsLoading(false);
  }, [location]);

  const plans = {
    starter: {
      name: "Starter",
      price: "$29",
      description: "Perfect for beginners getting started with affiliate marketing",
      features: [
        "5 affiliate sites",
        "50 AI-generated articles/month",
        "Basic analytics",
        "Email support",
        "Standard templates"
      ]
    },
    pro: {
      name: "Professional",
      price: "$79",
      description: "Ideal for growing affiliate marketers and content creators",
      features: [
        "25 affiliate sites",
        "250 AI-generated articles/month",
        "Advanced analytics & insights",
        "Priority support",
        "Premium templates",
        "SEO optimization tools",
        "Social media integration"
      ],
      popular: true
    },
    enterprise: {
      name: "Enterprise",
      price: "$199",
      description: "For agencies and high-volume affiliate marketers",
      features: [
        "Unlimited affiliate sites",
        "1000 AI-generated articles/month",
        "Custom analytics dashboard",
        "Dedicated account manager",
        "Custom templates & branding",
        "Advanced SEO tools",
        "API access",
        "White-label options"
      ]
    }
  };

  const currentPlan = selectedPlan && plans[selectedPlan as keyof typeof plans] 
    ? plans[selectedPlan as keyof typeof plans] 
    : plans.pro;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Complete Your Subscription
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You're just one step away from unlocking powerful AI-driven affiliate marketing tools
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Selected Plan</CardTitle>
                  {currentPlan.popular && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                      Most Popular
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                  <p className="text-3xl font-bold text-primary">
                    {currentPlan.price}<span className="text-lg text-muted-foreground">/month</span>
                  </p>
                  <p className="text-muted-foreground mt-2">{currentPlan.description}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">What's included:</h4>
                  <ul className="space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Money Back Guarantee */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>30-day money-back guarantee.</strong> Try risk-free and cancel anytime.
              </AlertDescription>
            </Alert>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscribeForm />
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <div className="md:col-span-2">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-center">
                <strong>Secure Payment:</strong> Your payment information is encrypted and secure. 
                We never store your credit card details.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}