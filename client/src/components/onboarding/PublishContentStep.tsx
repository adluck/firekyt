import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OnboardingProgress } from './OnboardingProgress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/useOnboarding';
import { apiRequest } from '@/lib/queryClient';
import { Send, Globe, FileText, CheckCircle, ArrowLeft, PartyPopper, Settings, ExternalLink, Copy, AlertCircle, Monitor } from 'lucide-react';

export function PublishContentStep() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { completeOnboardingStep } = useOnboarding();
  const queryClient = useQueryClient();
  
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedContent, setSelectedContent] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [currentTab, setCurrentTab] = useState('connect');
  
  // WordPress connection form
  const [wpForm, setWpForm] = useState({
    blogUrl: '',
    username: '',
    accessToken: '',
    platform: 'wordpress'
  });

  // Fetch user sites
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
  });

  // Fetch user content
  const { data: content } = useQuery({
    queryKey: ['/api/content'],
  });

  // Debug content loading
  console.log('🔍 ONBOARDING DEBUG - Content data:', content);
  console.log('🔍 ONBOARDING DEBUG - Content length:', content?.length);
  console.log('🔍 ONBOARDING DEBUG - Content items:', content?.map((item: any) => ({
    id: item.id,
    title: item.title,
    contentType: item.contentType,
    status: item.status
  })));

  // Debug sites loading
  console.log('🔍 ONBOARDING DEBUG - Sites data:', sites);
  console.log('🔍 ONBOARDING DEBUG - Sites length:', sites?.length);
  console.log('🔍 ONBOARDING DEBUG - Sites items:', sites?.map((site: any) => ({
    id: site.id,
    name: site.name,
    platform: site.platform
  })));

  // Fetch platform connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/publishing/connections'],
  });

  // Auto-select most recent site and content for onboarding
  useEffect(() => {
    if (sites && content) {
      // Auto-select the most recently created site
      const getOnboardingSiteId = () => {
        if (!sites || !Array.isArray(sites) || sites.length === 0) {
          return null;
        }
        
        // Return the most recently created site
        const sortedSites = [...sites].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return sortedSites[0]?.id?.toString() || null;
      };

      // Auto-select the most recently created content
      const getOnboardingContentId = () => {
        if (!content || !Array.isArray(content) || content.length === 0) {
          return null;
        }
        
        // Return the most recently created content
        const sortedContent = [...content].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return sortedContent[0]?.id?.toString() || null;
      };

      // Auto-select if not already selected
      if (!selectedSite) {
        const onboardingSiteId = getOnboardingSiteId();
        if (onboardingSiteId) {
          setSelectedSite(onboardingSiteId);
        }
      }

      if (!selectedContent) {
        const onboardingContentId = getOnboardingContentId();
        if (onboardingContentId) {
          setSelectedContent(onboardingContentId);
        }
      }
    }
  }, [sites, content, selectedSite, selectedContent]);

  // Test WordPress connection
  const testConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/publishing/test-connection', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful!",
          description: "WordPress connection verified. You can now publish content.",
        });
        setCurrentTab('publish');
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to WordPress.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: "There was an error testing the connection.",
        variant: "destructive",
      });
    }
  });

  // Add platform connection
  const addConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/publishing/connections', data);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['/api/publishing/connections'] });
      toast({
        title: "Platform Connected!",
        description: "WordPress has been successfully connected to your account.",
      });
      setCurrentTab('publish');
      setShowSetup(false);
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to save WordPress connection.",
        variant: "destructive",
      });
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/content/publish', data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Mark step as complete
      await completeOnboardingStep(3);
      
      // Additional query invalidation to ensure dashboard updates
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/publishing/history'] });
      
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

  const handleTestConnection = () => {
    testConnectionMutation.mutate({
      platform: wpForm.platform,
      accessToken: wpForm.accessToken,
      blogUrl: wpForm.blogUrl,
      platformUsername: wpForm.username
    });
  };

  const handleConnectWordPress = () => {
    addConnectionMutation.mutate({
      platform: wpForm.platform,
      accessToken: wpForm.accessToken,
      blogUrl: wpForm.blogUrl,
      platformUsername: wpForm.username
    });
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  // Check if user has WordPress connections
  const hasWordPressConnection = connections?.connections?.some((conn: any) => conn.platform === 'wordpress');
  
  // Determine if we should show setup flow
  const shouldShowSetup = !connectionsLoading && !hasWordPressConnection;

  if (publishSuccess) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-foreground">Congratulations!</h1>
              <p className="text-lg text-foreground">
                You've successfully set up your affiliate marketing platform
              </p>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Connected your site</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Generated AI-powered content</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Published your first content</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <p className="text-foreground">
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

        {/* Setup or Publishing Flow */}
        {!connectionsLoading && !hasWordPressConnection && !showSetup ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                <span>Connect WordPress</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your WordPress site to start publishing AI-generated content
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To publish content, you'll need to connect your WordPress site first. This takes just 2 minutes.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => setShowSetup(true)}
                className="w-full"
                size="lg"
              >
                <Settings className="mr-2 h-4 w-4" />
                Set Up WordPress Connection
              </Button>
            </CardContent>
          </Card>
        ) : showSetup ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                <span>WordPress Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="connect">Connect WordPress</TabsTrigger>
                  <TabsTrigger value="publish" disabled={!hasWordPressConnection}>Publish Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="connect" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">WordPress Setup (2 Steps)</h4>
                      
                      <div className="mb-3">
                        <h5 className="font-medium text-xs mb-1 text-blue-800 dark:text-blue-200">Step 1: Check User Role</h5>
                        <ol className="text-xs space-y-1 text-muted-foreground list-decimal list-inside ml-2">
                          <li>Go to WordPress admin → Users → All Users</li>
                          <li>Find your user account and check the "Role" column</li>
                          <li>If not "Editor" or "Administrator", click Edit and change Role to "Editor"</li>
                        </ol>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-xs mb-1 text-blue-800 dark:text-blue-200">Step 2: Create Application Password</h5>
                        <ol className="text-xs space-y-1 text-muted-foreground list-decimal list-inside ml-2">
                          <li>Go to your WordPress admin → Users → Profile</li>
                          <li>Scroll to "Application Passwords" section</li>
                          <li>Enter name: "FireKyt" and click "Add New Application Password"</li>
                          <li>Copy the generated password (keep it safe!)</li>
                        </ol>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={() => window.open('https://wordpress.org/support/article/application-passwords/', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        WordPress Guide
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="blogUrl">WordPress Site URL</Label>
                        <Input
                          id="blogUrl"
                          placeholder="https://yoursite.com"
                          value={wpForm.blogUrl}
                          onChange={(e) => setWpForm(prev => ({ ...prev, blogUrl: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="username">WordPress Username</Label>
                        <Input
                          id="username"
                          placeholder="Your WordPress username"
                          value={wpForm.username}
                          onChange={(e) => setWpForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="accessToken">Application Password</Label>
                        <Input
                          id="accessToken"
                          type="password"
                          placeholder="Your WordPress application password"
                          value={wpForm.accessToken}
                          onChange={(e) => setWpForm(prev => ({ ...prev, accessToken: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleTestConnection}
                        disabled={!wpForm.blogUrl || !wpForm.username || !wpForm.accessToken || testConnectionMutation.isPending}
                        variant="outline"
                        className="flex-1"
                      >
                        {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                      </Button>
                      
                      <Button 
                        onClick={handleConnectWordPress}
                        disabled={!wpForm.blogUrl || !wpForm.username || !wpForm.accessToken || addConnectionMutation.isPending}
                        className="flex-1"
                      >
                        {addConnectionMutation.isPending ? "Connecting..." : "Connect WordPress"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="publish" className="space-y-6 mt-6">
                  <div className="space-y-4">
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
                          {sites?.map((site: any) => (
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
                          {content?.map((item: any) => (
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
                          Your content will be published to WordPress with affiliate links automatically inserted.
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
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : !connectionsLoading && hasWordPressConnection ? (
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
                    {sites?.map((site: any) => (
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
                    {content?.map((item: any) => (
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
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading platform connections...</p>
              </div>
            </CardContent>
          </Card>
        )}

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