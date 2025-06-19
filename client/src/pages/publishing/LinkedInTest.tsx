import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, Linkedin, ExternalLink } from "lucide-react";

interface LinkedInProfile {
  firstName?: { localized?: { en_US?: string } };
  lastName?: { localized?: { en_US?: string } };
  id?: string;
}

interface LinkedInConnection {
  id: number;
  platform: string;
  accessToken: string;
  isValid?: boolean;
  profile?: LinkedInProfile;
}

export default function LinkedInTest() {
  const [accessToken, setAccessToken] = useState("");
  const [connection, setConnection] = useState<LinkedInConnection | null>(null);
  const [testContent, setTestContent] = useState({
    title: "Test LinkedIn Post from FireKyt",
    content: "Testing the LinkedIn integration for our AI-powered affiliate marketing platform. This post was automatically generated and published through our unified content management system.",
    hashtags: ["AI", "Marketing", "Automation", "Content"]
  });
  const { toast } = useToast();

  // Test LinkedIn token
  const testTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/publishing/test-connection', {
        blogUrl: '',
        accessToken: token,
        platform: 'linkedin'
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isValid) {
        toast({
          title: "LinkedIn Connected",
          description: `Connected as ${data.details?.firstName || 'User'} ${data.details?.lastName || ''}`
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Invalid LinkedIn token",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error?.message || "Failed to test LinkedIn connection",
        variant: "destructive"
      });
    }
  });

  // Add LinkedIn connection
  const addConnectionMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/publishing/connections', {
        platform: 'linkedin',
        accessToken: token,
        platformUsername: '',
        platformUserId: ''
      });
      return response.json();
    },
    onSuccess: (data) => {
      setConnection(data);
      toast({
        title: "LinkedIn Added",
        description: "LinkedIn account connected successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to add LinkedIn connection",
        variant: "destructive"
      });
    }
  });

  // Test post to LinkedIn
  const testPostMutation = useMutation({
    mutationFn: async () => {
      if (!connection) throw new Error("No LinkedIn connection found");
      
      const response = await apiRequest('POST', '/api/social/publish', {
        connectionId: connection.id,
        content: {
          title: testContent.title,
          content: testContent.content,
          hashtags: testContent.hashtags
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Posted to LinkedIn",
        description: data.simulated ? "Test post simulated successfully" : "Posted successfully to LinkedIn"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Post Failed",
        description: error?.message || "Failed to post to LinkedIn",
        variant: "destructive"
      });
    }
  });

  const handleTestToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter a LinkedIn access token",
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
        description: "Please enter a LinkedIn access token",
        variant: "destructive"
      });
      return;
    }
    addConnectionMutation.mutate(accessToken);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Linkedin className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">LinkedIn Integration Test</h1>
      </div>

      {/* LinkedIn Connection Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5" />
            LinkedIn Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">LinkedIn Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="Enter your LinkedIn API access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Get your access token from LinkedIn Developer Console with 'w_member_social' permissions
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
                <Linkedin className="h-4 w-4 mr-2" />
              )}
              Add Connection
            </Button>
          </div>

          {connection && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  LinkedIn Connected
                </span>
                <Badge variant="secondary">ID: {connection.id}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Post */}
      {connection && (
        <Card>
          <CardHeader>
            <CardTitle>Test LinkedIn Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Post Title</Label>
              <Input
                id="title"
                value={testContent.title}
                onChange={(e) => setTestContent(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Post Content</Label>
              <Textarea
                id="content"
                value={testContent.content}
                onChange={(e) => setTestContent(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
              <Input
                id="hashtags"
                value={testContent.hashtags.join(", ")}
                onChange={(e) => setTestContent(prev => ({ 
                  ...prev, 
                  hashtags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
                }))}
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => testPostMutation.mutate()}
              disabled={testPostMutation.isPending}
              className="w-full"
            >
              {testPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Test Post to LinkedIn
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn API Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. Create LinkedIn App:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Go to LinkedIn Developer Console</li>
              <li>Create a new app for your organization</li>
              <li>Request access to 'Share on LinkedIn' product</li>
            </ul>

            <p><strong>2. Configure Permissions:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Add 'w_member_social' scope for posting</li>
              <li>Add 'r_liteprofile' scope for profile access</li>
            </ul>

            <p><strong>3. Get Access Token:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Implement OAuth 2.0 flow or use LinkedIn's tools</li>
              <li>Exchange authorization code for access token</li>
              <li>Use the access token in the field above</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}