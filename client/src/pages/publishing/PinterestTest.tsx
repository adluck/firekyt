import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { SiPinterest } from "react-icons/si";

interface PinterestProfile {
  username?: string;
  account_type?: string;
  profile_image?: string;
}

interface PinterestConnection {
  id: number;
  platform: string;
  accessToken: string;
  isValid?: boolean;
  profile?: PinterestProfile;
}

export default function PinterestTest() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [connection, setConnection] = useState<PinterestConnection | null>(null);
  
  const [testContent] = useState({
    title: "AI-Powered Affiliate Marketing Success",
    description: "Discover how AI is revolutionizing affiliate marketing with automated content generation and smart optimization strategies. #affiliate #AI #marketing",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600",
    link: "https://example.com/affiliate-marketing-ai"
  });

  // Test Pinterest token
  const testTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/publishing/test-connection', {
        platform: 'pinterest',
        accessToken: token,
        connectionData: {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.validation.isValid) {
        toast({
          title: "Pinterest Token Valid",
          description: `Connected to ${data.validation.details?.username || 'Pinterest account'}`
        });
      } else {
        toast({
          title: "Pinterest Token Invalid",
          description: data.validation.error || "Token validation failed",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error?.message || "Failed to test Pinterest token",
        variant: "destructive"
      });
    }
  });

  // Add Pinterest connection
  const addConnectionMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/publishing/connections', {
        platform: 'pinterest',
        accessToken: token,
        platformUsername: '',
        platformUserId: ''
      });
      return response.json();
    },
    onSuccess: (data) => {
      setConnection(data);
      toast({
        title: "Pinterest Added",
        description: "Pinterest account connected successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to add Pinterest connection",
        variant: "destructive"
      });
    }
  });

  // Test pin to Pinterest
  const testPinMutation = useMutation({
    mutationFn: async () => {
      if (!connection) {
        // If no connection exists, try to create one first
        if (!accessToken.trim()) {
          throw new Error("Please enter a Pinterest access token first");
        }
        
        // Create connection automatically
        const connectionResponse = await apiRequest('POST', '/api/publishing/connections', {
          platform: 'pinterest',
          accessToken: accessToken,
          platformUsername: '',
          platformUserId: ''
        });
        const connectionData = await connectionResponse.json();
        setConnection(connectionData);
        
        // Now post with the new connection
        const response = await apiRequest('POST', '/api/social/publish', {
          connectionId: connectionData.id,
          content: {
            title: testContent.title,
            content: testContent.description,
            media: [{
              type: 'image',
              url: testContent.imageUrl
            }],
            link: testContent.link
          }
        });
        return response.json();
      } else {
        // Use existing connection
        const response = await apiRequest('POST', '/api/social/publish', {
          connectionId: connection.id,
          content: {
            title: testContent.title,
            content: testContent.description,
            media: [{
              type: 'image',
              url: testContent.imageUrl
            }],
            link: testContent.link
          }
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Posted to Pinterest",
        description: data.simulated ? "Test pin simulated successfully" : "Pin created successfully on Pinterest"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Pin Failed",
        description: error?.message || "Failed to create pin on Pinterest",
        variant: "destructive"
      });
    }
  });

  const handleTestToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a Pinterest access token",
        variant: "destructive"
      });
      return;
    }
    testTokenMutation.mutate(accessToken);
  };

  const handleAddConnection = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a Pinterest access token",
        variant: "destructive"
      });
      return;
    }
    addConnectionMutation.mutate(accessToken);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SiPinterest className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Pinterest Integration Test</h1>
          <p className="text-muted-foreground">Test Pinterest API connectivity and pin creation functionality</p>
        </div>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Pinterest API Setup
          </CardTitle>
          <CardDescription>
            Get your Pinterest access token to test the integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Required Pinterest API Scopes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code>boards:read</code> - Read board information</li>
              <li><code>pins:read</code> - Read pin information</li>
              <li><code>pins:write</code> - Create and update pins</li>
              <li><code>user_accounts:read</code> - Read user account information</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to <a href="https://developers.pinterest.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Pinterest Developer Console</a></li>
              <li>Create a new app or select existing app</li>
              <li>Generate an access token with required scopes</li>
              <li>Copy the access token and paste it below</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Token Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Pinterest Access Token</CardTitle>
          <CardDescription>
            Enter your Pinterest access token to test connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="Enter your Pinterest access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="mt-1 font-mono"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Token must include: boards:read, pins:read, pins:write, user_accounts:read scopes
            </p>
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
              onClick={handleAddConnection}
              disabled={addConnectionMutation.isPending || !accessToken}
            >
              {addConnectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SiPinterest className="h-4 w-4 mr-2" />
              )}
              Add Connection
            </Button>
            
            <Button
              onClick={() => testPinMutation.mutate()}
              disabled={testPinMutation.isPending || !accessToken}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {testPinMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <SiPinterest className="h-4 w-4 mr-2" />
              )}
              Quick Test Pin
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Quick Test Pin will create a connection automatically if needed, then create a test pin
          </p>

          {connection && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Pinterest Connected
                </span>
                <Badge variant="secondary">ID: {connection.id}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Test Pin Content</CardTitle>
          <CardDescription>
            Preview of the content that will be posted to Pinterest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pin Title</Label>
            <Input value={testContent.title} readOnly className="mt-1" />
          </div>
          
          <div>
            <Label>Pin Description</Label>
            <Textarea value={testContent.description} readOnly className="mt-1" rows={3} />
          </div>
          
          <div>
            <Label>Image URL</Label>
            <Input value={testContent.imageUrl} readOnly className="mt-1" />
          </div>
          
          <div>
            <Label>Destination Link</Label>
            <Input value={testContent.link} readOnly className="mt-1" />
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This content will be used to create a test pin on your Pinterest account when you click "Quick Test Pin"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}