import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OnboardingProgress } from './OnboardingProgress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { ExternalLink, HelpCircle, Globe, ShoppingCart, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export function ConnectSiteStep() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    platform: '',
    description: ''
  });
  
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const connectSiteMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/sites', data),
    onSuccess: async () => {
      toast({
        title: "Success!",
        description: "Your site has been connected successfully. Let's generate your first content.",
        variant: "default",
      });
      
      // Complete onboarding step 1
      await apiRequest('POST', '/api/onboarding/complete-step/1');
      
      // Navigate to next step
      navigate('/onboarding/generate');
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect site. Please check your details and try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !selectedPlatform) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive",
      });
      return;
    }
    
    connectSiteMutation.mutate({
      ...formData,
      platform: selectedPlatform
    });
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const platforms = [
    { id: 'wordpress', name: 'WordPress', icon: Globe, description: 'Most popular CMS platform' },
    { id: 'shopify', name: 'Shopify', icon: ShoppingCart, description: 'E-commerce platform' },
    { id: 'ghost', name: 'Ghost', icon: Globe, description: 'Modern publishing platform' },
    { id: 'custom', name: 'Custom/Other', icon: Globe, description: 'Custom or other platform' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <OnboardingProgress currentStep={1} totalSteps={3} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-primary" />
                <span>Connect Your First Site</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Site Name */}
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name *</Label>
                  <Input
                    id="site-name"
                    placeholder="e.g., My Awesome Blog"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Site URL */}
                <div className="space-y-2">
                  <Label htmlFor="site-url">Site URL *</Label>
                  <Input
                    id="site-url"
                    type="url"
                    placeholder="https://your-site.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>

                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label>Platform *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {platforms.map((platform) => (
                      <Card 
                        key={platform.id}
                        className={`cursor-pointer transition-all ${
                          selectedPlatform === platform.id 
                            ? 'ring-2 ring-primary border-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedPlatform(platform.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <platform.icon className="h-6 w-6 text-primary" />
                            <div>
                              <div className="font-medium text-sm">{platform.name}</div>
                              <div className="text-xs text-muted-foreground">{platform.description}</div>
                            </div>
                            {selectedPlatform === platform.id && (
                              <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your site and niche..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6">
                  <Button
                    type="submit"
                    disabled={connectSiteMutation.isPending}
                    className="flex-1"
                  >
                    {connectSiteMutation.isPending ? (
                      "Connecting..."
                    ) : (
                      <>
                        Connect Site
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={connectSiteMutation.isPending}
                  >
                    Skip for now
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">WordPress Setup</h4>
                <p className="text-xs text-muted-foreground">
                  Install our WordPress plugin or use REST API credentials for seamless integration.
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        WordPress Guide
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Opens WordPress integration documentation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Shopify Setup</h4>
                <p className="text-xs text-muted-foreground">
                  Create a private app in your Shopify admin to get API credentials.
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Shopify Guide
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Opens Shopify integration documentation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Don't worry if you don't have all the details right now. You can always update your site settings later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}