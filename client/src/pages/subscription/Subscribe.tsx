import { useEffect, useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing`,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Active!",
        description: "Welcome to your new plan. You can now access all features.",
      });
      setLocation("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-border rounded-lg">
        <PaymentElement 
          options={{
            layout: "tabs"
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full btn-gradient"
        disabled={!stripe || isProcessing}
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
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const secret = params.get('client_secret');
    const subscriptionId = params.get('subscription_id');
    
    if (secret) {
      setClientSecret(secret);
    }
    
    if (subscriptionId) {
      // In a real app, you might fetch subscription details here
      setSubscriptionDetails({
        id: subscriptionId,
        plan: 'Pro Plan',
        price: '$59/month',
        features: [
          '10 affiliate sites',
          '100 AI-generated articles per month',
          '5,000 API calls per month',
          'Advanced SEO & analytics',
          'Brand voice training',
          'Priority support'
        ]
      });
    }
  }, [location]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Invalid Subscription</h3>
              <p className="text-muted-foreground mb-4">
                The subscription link is invalid or has expired.
              </p>
              <Button asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
            <p className="text-muted-foreground">
              You're one step away from unlocking all features
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subscription Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionDetails && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{subscriptionDetails.plan}</span>
                      <Badge className="gradient-bg text-white">Popular</Badge>
                    </div>
                    
                    <div className="text-2xl font-bold text-primary">
                      {subscriptionDetails.price}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Included features:</h4>
                      {subscriptionDetails.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can cancel or change your plan at any time from your billing settings.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#f97316',
                      }
                    }
                  }}
                >
                  <SubscribeForm />
                </Elements>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Secure Payment</div>
                  <div>Your payment information is encrypted and secure. We never store your card details.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
