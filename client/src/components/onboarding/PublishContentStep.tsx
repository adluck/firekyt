import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingProgress } from './OnboardingProgress';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/useOnboarding';
import { apiRequest } from '@/lib/queryClient';
import { Send, Globe, FileText, CheckCircle, ArrowLeft, PartyPopper } from 'lucide-react';

export function PublishContentStep() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { completeOnboardingStep } = useOnboarding();
  
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedContent, setSelectedContent] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Fetch user sites
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
  });

  // Fetch user content
  const { data: content } = useQuery({
    queryKey: ['/api/content'],
  });

  const publishMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/content/publish', data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Mark step as complete
      await completeOnboardingStep(3);
      
      setPublishSuccess(true);
      toast({
        title: "Content Published!",
        description: "Your content is now live and ready to generate revenue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Publishing Failed",
        description: "There was an error publishing your content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePublish = () => {
    if (selectedSite && selectedContent) {
      publishMutation.mutate({
        siteId: selectedSite,
        contentId: selectedContent,
        isOnboarding: true
      });
    }
  };

  const handleBack = () => {
    navigate('/onboarding/generate');
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (publishSuccess) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
              <p className="text-lg text-muted-foreground">
                You've successfully set up your affiliate marketing platform
              </p>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Connected your site</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Generated AI-powered content</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Published your first content</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <p className="text-muted-foreground">
                Your affiliate marketing journey starts now! Your content is live and ready to generate revenue.
              </p>
              
              <Button onClick={handleComplete} size="lg" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <OnboardingProgress currentStep={3} totalSteps={3} />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Send className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Publish Your Content</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Get your content live and start generating affiliate revenue
          </p>
        </div>

        {/* Publishing Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Publishing Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Site</label>
              <Select
                value={selectedSite}
                onValueChange={setSelectedSite}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site to publish to" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.sites?.map((site: any) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name} ({site.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Content</label>
              <Select
                value={selectedContent}
                onValueChange={setSelectedContent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose content to publish" />
                </SelectTrigger>
                <SelectContent>
                  {content?.content?.map((item: any) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.title} ({item.contentType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSite && selectedContent && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Ready to Publish</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your content will be published to your selected site with affiliate links automatically inserted.
                </p>
              </div>
            )}

            <Button 
              onClick={handlePublish}
              disabled={!selectedSite || !selectedContent || publishMutation.isPending}
              className="w-full"
              size="lg"
            >
              {publishMutation.isPending ? "Publishing..." : "Publish Content"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={handleBack} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button variant="ghost" onClick={handleSkip} size="lg">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}