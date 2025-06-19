import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Globe, 
  Key, 
  Send, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Copy,
  RefreshCw,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';

interface BlogConnection {
  id: number;
  blogName: string;
  blogUrl: string;
  token: string;
  status: 'active' | 'testing' | 'failed';
}

interface Content {
  id: number;
  title: string;
  content: string;
  status: string;
  targetKeywords: string[];
}

export default function PublishingTest() {
  const [blogName, setBlogName] = useState('Test Blog');
  const [blogUrl, setBlogUrl] = useState('http://localhost:3001');
  const [testToken, setTestToken] = useState('firekyt_test_token_2024');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [connection, setConnection] = useState<BlogConnection | null>(null);
  const [publishStatus, setPublishStatus] = useState<string>('');
  const [publishingResults, setPublishingResults] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user content for publishing
  const { data: contentList = [] } = useQuery<Content[]>({
    queryKey: ['/api/content']
  });

  // Generate new token mutation
  const generateTokenMutation = useMutation({
    mutationFn: async (data: { blogName: string; blogUrl: string }) => {
      try {
        const response = await apiRequest('POST', '/api/publishing/generate-token', data);
        return response.json();
      } catch (error) {
        console.error('Token generation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data?.connection) {
        setConnection(data.connection);
      }
      if (data?.instructions?.token) {
        setTestToken(data.instructions.token);
      }
      toast({
        title: 'Token Generated',
        description: 'New publishing token created successfully'
      });
    },
    onError: (error: any) => {
      console.error('Token generation mutation error:', error);
      toast({
        title: 'Generation Failed',
        description: error?.message || 'Failed to generate token',
        variant: 'destructive'
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: { blogUrl: string; token: string }) => {
      try {
        // Use direct fetch to bypass apiRequest error handling
        const authToken = localStorage.getItem("authToken");
        const response = await fetch('/api/test-blog-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        // Parse response as JSON first, handle errors properly
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, try to get text response
          const textResponse = await response.text();
          throw new Error(`Invalid response format: ${textResponse}`);
        }
        
        // Check if response indicates success
        if (!response.ok) {
          throw new Error(responseData?.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return responseData;
      } catch (error: any) {
        console.error('Connection test error:', error);
        throw new Error(error.message || 'Failed to connect to blog server');
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Successful',
        description: data.message || `Successfully connected to ${blogUrl}`
      });
      setPublishStatus('connected');
    },
    onError: (error: any) => {
      console.error('Connection test mutation error:', error);
      toast({
        title: 'Connection Failed',
        description: error?.message || 'Failed to connect to blog server',
        variant: 'destructive'
      });
      setPublishStatus('failed');
    }
  });

  // Publish content mutation
  const publishMutation = useMutation({
    mutationFn: async (data: { 
      contentId: string; 
      blogUrl: string; 
      token: string; 
      publishSettings?: any 
    }) => {
      // Use direct fetch to bypass authentication issues for testing
      const response = await fetch('/api/test-blog-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Publishing failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Published Successfully',
        description: `Content published with ID ${data.postId}. View at ${data.publishedUrl}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setPublishStatus('published');
      setPublishingResults(data);
    },
    onError: (error: any) => {
      toast({
        title: 'Publishing Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Token copied to clipboard'
    });
  };

  const handleGenerateToken = () => {
    generateTokenMutation.mutate({ blogName, blogUrl });
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate({ blogUrl, token: testToken });
  };

  const handlePublish = () => {
    if (!selectedContent) {
      toast({
        title: 'No Content Selected',
        description: 'Please select content to publish',
        variant: 'destructive'
      });
      return;
    }

    publishMutation.mutate({
      contentId: selectedContent,
      blogUrl,
      token: testToken,
      publishSettings: {
        status: 'published'
      }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Publishing Test Center</h1>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Test Blog Setup
          </CardTitle>
          <CardDescription>
            Configure your external blog connection for testing publishing features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blogName">Blog Name</Label>
              <Input
                id="blogName"
                value={blogName}
                onChange={(e) => setBlogName(e.target.value)}
                placeholder="My Test Blog"
              />
            </div>
            <div>
              <Label htmlFor="blogUrl">Blog URL</Label>
              <Input
                id="blogUrl"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                placeholder="http://localhost:3001"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateToken}
              disabled={generateTokenMutation.isPending}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              {generateTokenMutation.isPending ? 'Generating...' : 'Generate New Token'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open(blogUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Blog
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token & Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Access Token & Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">Access Token</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(testToken)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Use this token to authenticate with your external blog API
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
              {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
            </Button>

            {publishStatus === 'connected' && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            )}
            {publishStatus === 'failed' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Failed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Selection & Publishing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Publish Content
          </CardTitle>
          <CardDescription>
            Select content from your FireKyt library to publish to the external blog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content">Select Content to Publish</Label>
            <Select value={selectedContent} onValueChange={setSelectedContent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose content to publish" />
              </SelectTrigger>
              <SelectContent>
                {contentList.map((content) => (
                  <SelectItem key={content.id} value={content.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{content.title}</span>
                      <span className="text-sm text-muted-foreground">
                        Status: {content.status} | Keywords: {content.targetKeywords?.join(', ') || 'None'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContent && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Content Preview:</h4>
              {(() => {
                const content = contentList.find(c => c.id.toString() === selectedContent);
                return content ? (
                  <div>
                    <p className="font-medium">{content.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {content.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <Button 
            onClick={handlePublish}
            disabled={publishMutation.isPending || !selectedContent || publishStatus !== 'connected'}
            className="w-full flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {publishMutation.isPending ? 'Publishing...' : 'Publish to Blog'}
          </Button>

          {publishStatus === 'published' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Successfully Published!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your content has been published to the external blog. Check the blog to see the published post.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Quick Start Testing Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Before testing, you need to start the external test blog server in a separate terminal or command prompt.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Terminal Setup (Required)</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">Run this command in a new terminal window:</p>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs">
                ./start-test-blog.sh
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                This starts a test blog server at http://localhost:3001
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Step 1: Server Setup</h4>
                <p className="text-sm text-muted-foreground">Start the test blog server using the command above</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Step 2: Test Connection</h4>
                <p className="text-sm text-muted-foreground">Use the "Test Connection" button to verify connectivity</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Step 3: Select Content</h4>
                <p className="text-sm text-muted-foreground">Choose content from your FireKyt library to publish</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Step 4: Publish & Verify</h4>
                <p className="text-sm text-muted-foreground">Publish content and check the test blog to see results</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Pre-configured Test Token:
              </p>
              <code className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                firekyt_test_token_2024
              </code>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                This token is already configured for testing. You can generate a new one if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Results Display */}
      {publishingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">
              Publishing Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="space-y-2">
                  <p><strong>Post ID:</strong> {publishingResults.postId}</p>
                  <p><strong>Status:</strong> {publishingResults.status}</p>
                  <p><strong>Published At:</strong> {new Date(publishingResults.publishedAt).toLocaleString()}</p>
                  <p><strong>Published URL:</strong> 
                    <a 
                      href={publishingResults.publishedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline ml-2"
                    >
                      {publishingResults.publishedUrl}
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Published Content Preview</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                  <p><strong>Title:</strong> {publishingResults.content?.title}</p>
                  <p className="mt-2"><strong>Content:</strong> {publishingResults.content?.content}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}