import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { SiPinterest, SiLinkedin, SiInstagram } from "react-icons/si";

interface SocialConnection {
  id: number;
  platform: string;
  accessToken: string;
  isValid?: boolean;
  profile?: any;
}

interface TestPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  scopes: string[];
  setupUrl: string;
  notes: string;
}

const platforms: TestPlatform[] = [
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: SiPinterest,
    color: 'text-red-600',
    scopes: ['user_accounts:read', 'pins:read', 'pins:write', 'boards:read'],
    setupUrl: 'https://developers.pinterest.com/apps/',
    notes: 'Requires Pinterest Business account. Test tokens expire in 30 days.'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: SiLinkedin,
    color: 'text-blue-600',
    scopes: ['r_liteprofile', 'w_member_social'],
    setupUrl: 'https://www.linkedin.com/developers/apps',
    notes: 'Many scopes require LinkedIn Partner approval. Use minimal scopes for testing.'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: SiInstagram,
    color: 'text-pink-600',
    scopes: ['instagram_basic', 'instagram_content_publish'],
    setupUrl: 'https://developers.facebook.com/apps/',
    notes: 'Requires Facebook app with Instagram Basic Display API. Business account recommended.'
  }
];

export default function SocialMediaTest() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState('pinterest');
  const [accessToken, setAccessToken] = useState('');
  const [connections, setConnections] = useState<Record<string, SocialConnection>>({});
  
  const [testContent] = useState({
    title: "AI-Powered Content Strategy",
    description: "Discover how AI is transforming content creation and social media marketing. Automate your workflow and boost engagement with smart tools. #AI #ContentMarketing #SocialMedia",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600",
    link: "https://example.com/ai-content-strategy"
  });

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)!;

  // Test platform token
  const testTokenMutation = useMutation({
    mutationFn: async ({ platform, token }: { platform: string, token: string }) => {
      const response = await apiRequest('POST', '/api/publishing/test-connection', {
        platform,
        accessToken: token,
        connectionData: {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.validation.isValid) {
        toast({
          title: `${currentPlatform.name} Token Valid`,
          description: `Successfully connected to ${currentPlatform.name}`
        });
      } else {
        toast({
          title: `${currentPlatform.name} Token Invalid`,
          description: data.validation.error || "Token validation failed",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error?.message || `Failed to test ${currentPlatform.name} token`,
        variant: "destructive"
      });
    }
  });

  // Add platform connection
  const addConnectionMutation = useMutation({
    mutationFn: async ({ platform, token }: { platform: string, token: string }) => {
      const response = await apiRequest('POST', '/api/publishing/connections', {
        platform,
        accessToken: token,
        platformUsername: '',
        platformUserId: ''
      });
      return response.json();
    },
    onSuccess: (data) => {
      setConnections(prev => ({ ...prev, [selectedPlatform]: data }));
      toast({
        title: `${currentPlatform.name} Connected`,
        description: `${currentPlatform.name} account connected successfully`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error?.message || `Failed to connect ${currentPlatform.name}`,
        variant: "destructive"
      });
    }
  });

  // Test post/pin
  const testPostMutation = useMutation({
    mutationFn: async () => {
      let connectionId = connections[selectedPlatform]?.id;
      
      if (!connectionId) {
        if (!accessToken.trim()) {
          throw new Error(`Please enter a ${currentPlatform.name} access token first`);
        }
        
        // Create connection automatically
        const connectionResponse = await apiRequest('POST', '/api/publishing/connections', {
          platform: selectedPlatform,
          accessToken: accessToken,
          platformUsername: '',
          platformUserId: ''
        });
        const connectionData = await connectionResponse.json();
        setConnections(prev => ({ ...prev, [selectedPlatform]: connectionData }));
        connectionId = connectionData.id;
      }
      
      // Create post content based on platform
      let content: any = {
        title: testContent.title,
        content: testContent.description
      };

      if (selectedPlatform === 'pinterest') {
        content.media = [{ type: 'image', url: testContent.imageUrl }];
        content.link = testContent.link;
      } else if (selectedPlatform === 'linkedin') {
        content.hashtags = ['AI', 'ContentMarketing', 'SocialMedia'];
      }

      const response = await apiRequest('POST', '/api/social/publish', {
        connectionId,
        content
      });
      return response.json();
    },
    onSuccess: (data) => {
      const action = selectedPlatform === 'pinterest' ? 'pin' : 'post';
      toast({
        title: `${currentPlatform.name} ${action} created`,
        description: data.simulated ? `Test ${action} simulated successfully` : `${action} published to ${currentPlatform.name}`
      });
    },
    onError: (error: any) => {
      const action = selectedPlatform === 'pinterest' ? 'pin' : 'post';
      toast({
        title: `${currentPlatform.name} ${action} failed`,
        description: error?.message || `Failed to create ${action}`,
        variant: "destructive"
      });
    }
  });

  const handleTestToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Token Required",
        description: `Please enter a ${currentPlatform.name} access token`,
        variant: "destructive"
      });
      return;
    }
    testTokenMutation.mutate({ platform: selectedPlatform, token: accessToken });
  };

  const handleAddConnection = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Token Required",
        description: `Please enter a ${currentPlatform.name} access token`,
        variant: "destructive"
      });
      return;
    }
    addConnectionMutation.mutate({ platform: selectedPlatform, token: accessToken });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Social Media Integration Test</h1>
          <p className="text-muted-foreground">Test social media platform connectivity and content publishing</p>
        </div>
      </div>

      {/* Platform Selection */}
      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList className="grid w-full grid-cols-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <TabsTrigger key={platform.id} value={platform.id} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${platform.color}`} />
                {platform.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {platforms.map((platform) => (
          <TabsContent key={platform.id} value={platform.id} className="space-y-6">
            {/* Platform Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  {platform.name} API Setup
                </CardTitle>
                <CardDescription>
                  Configure {platform.name} API access for content publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Required Scopes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platform.scopes.map((scope) => (
                      <li key={scope}><code>{scope}</code></li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Setup Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to <a href={platform.setupUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{platform.name} Developer Console</a></li>
                    <li>Create a new app or select existing app</li>
                    <li>Generate an access token with required scopes</li>
                    <li>Copy the access token and paste it below</li>
                  </ol>
                </div>
                
                {platform.notes && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium mb-1">Important Notes:</h4>
                        <p className="text-sm">{platform.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Token Testing */}
            <Card>
              <CardHeader>
                <CardTitle>{platform.name} Access Token</CardTitle>
                <CardDescription>
                  Enter your {platform.name} access token to test connectivity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="token">Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder={`Enter your ${platform.name} access token or use demo_${platform.id}_token`}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="mt-1 font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Token must include: {platform.scopes.join(', ')}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Demo Mode:</strong> Use <code>demo_{platform.id}_token</code> to test the integration workflow without real API tokens
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestToken}
                    disabled={testTokenMutation.isPending}
                    variant="outline"
                  >
                    {testTokenMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Test Token
                  </Button>
                  
                  <Button
                    onClick={() => setAccessToken(`demo_${platform.id}_token`)}
                    variant="secondary"
                    size="sm"
                  >
                    Use Demo Token
                  </Button>

                  <Button
                    onClick={handleAddConnection}
                    disabled={addConnectionMutation.isPending || !accessToken}
                  >
                    {addConnectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <platform.icon className="h-4 w-4 mr-2" />
                    )}
                    Add Connection
                  </Button>
                  
                  <Button
                    onClick={() => testPostMutation.mutate()}
                    disabled={testPostMutation.isPending || !accessToken}
                    className={`${platform.color.replace('text-', 'bg-').replace('-600', '-600')} hover:${platform.color.replace('text-', 'bg-').replace('-600', '-700')} text-white`}
                  >
                    {testPostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <platform.icon className="h-4 w-4 mr-2" />
                    )}
                    Quick Test {platform.id === 'pinterest' ? 'Pin' : 'Post'}
                  </Button>
                </div>

                {connections[platform.id] && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        {platform.name} Connected
                      </span>
                      <Badge variant="secondary">ID: {connections[platform.id].id}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Test Content</CardTitle>
                <CardDescription>
                  Preview of the content that will be posted to {platform.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={testContent.title} readOnly className="mt-1" />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea value={testContent.description} readOnly className="mt-1" rows={3} />
                </div>
                
                {platform.id === 'pinterest' && (
                  <>
                    <div>
                      <Label>Image URL</Label>
                      <Input value={testContent.imageUrl} readOnly className="mt-1" />
                    </div>
                    
                    <div>
                      <Label>Destination Link</Label>
                      <Input value={testContent.link} readOnly className="mt-1" />
                    </div>
                  </>
                )}

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This content will be used to create a test {platform.id === 'pinterest' ? 'pin' : 'post'} on your {platform.name} account
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}