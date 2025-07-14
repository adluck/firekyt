import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Rocket, ArrowRight, Globe, Zap, Send, Clock, CheckCircle, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [, navigate] = useLocation();
  const { getNextOnboardingRoute, skipOnboarding, isSkipping } = useOnboarding();

  const handleStartOnboarding = () => {
    const route = getNextOnboardingRoute();
    navigate(route);
    onClose();
  };

  const handleSkipOnboarding = () => {
    skipOnboarding();
    onClose();
  };

  const onboardingSteps = [
    {
      step: 1,
      title: "Connect Your Site",
      description: "Link your WordPress, Shopify, or other platform",
      icon: Globe,
      duration: "2 min"
    },
    {
      step: 2,
      title: "Generate Content",
      description: "Create your first AI-powered affiliate content",
      icon: Zap,
      duration: "3 min"
    },
    {
      step: 3,
      title: "Publish & Earn",
      description: "Publish directly to your site and start earning",
      icon: Send,
      duration: "1 min"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Get started with AI-powered affiliate marketing
            </div>
            <p className="text-muted-foreground">
              Complete our quick 3-step setup to start generating revenue from your content
            </p>
          </div>

          {/* Onboarding Steps */}
          <div className="space-y-4">
            {onboardingSteps.map((step, index) => (
              <Card key={step.step} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">Step {step.step}: {step.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.duration}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What you'll get:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">AI-generated content optimized for conversions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Automatic affiliate link insertion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Real-time performance analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Direct publishing to your platforms</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleStartOnboarding}
              className="flex-1"
              size="lg"
            >
              Start Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleSkipOnboarding}
              disabled={isSkipping}
              size="lg"
            >
              {isSkipping ? "Skipping..." : "Skip for now"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can always access this setup guide later from your dashboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}