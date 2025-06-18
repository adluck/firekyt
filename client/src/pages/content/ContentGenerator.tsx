import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentEditor } from "@/components/content/ContentEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wand2, AlertCircle, CheckCircle, Clock, FileText, Sparkles, Globe, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocation } from "wouter";
import { SiteSelectionDialog } from "@/components/content/SiteSelectionDialog";
import type { Site, Content } from "@shared/schema";

export default function ContentGenerator() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const initialSiteId = queryParams.get('siteId');
  
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || "");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSiteDialog, setShowSiteDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canAccess, hasReachedLimit, getUsage, getLimit } = useSubscription();

  // Fetch sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch recent content
  const { data: recentContent = [] } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });

  // Generate content mutation (without auto-save)
  const generateContentMutation = useMutation({
    mutationFn: async (params: any) => {
      setIsGenerating(true);
      const response = await apiRequest("POST", "/api/content/generate-preview", {
        ...params
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      setIsGenerating(false);
      toast({
        title: "Content generated!",
        description: "Your AI-powered content is ready to save.",
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save content mutation with site selection
  const saveContentMutation = useMutation({
    mutationFn: async (siteId: number | null) => {
      if (!generatedContent) {
        throw new Error("No content to save");
      }

      const payload = {
        title: generatedContent.title || "Generated Content",
        content: generatedContent.content || generatedContent.generated_text || '',
        contentType: generatedContent.contentType || 'blog_post',
        siteId: siteId,
        seoTitle: generatedContent.seoTitle,
        seoDescription: generatedContent.seoDescription,
        targetKeywords: generatedContent.targetKeywords || [],
        status: "draft"
      };

      const response = await apiRequest("POST", "/api/content", payload);
      return response.json();
    },
    onSuccess: () => {
      setShowSiteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setGeneratedContent(null);
      toast({
        title: "Content saved!",
        description: "Your content has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveClick = () => {
    if (!generatedContent) {
      toast({
        title: "No content to save",
        description: "Please generate content first.",
        variant: "destructive",
      });
      return;
    }
    setShowSiteDialog(true);
  };

  const selectedSite = sites.find(site => site.id === parseInt(selectedSiteId));
  const canGenerateContent = canAccess('content_generation') && !hasReachedLimit('content_generation');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Generator</h1>
          <p className="text-muted-foreground">
            Create AI-powered affiliate content for your sites
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Monthly usage: {getUsage('content_generation')}/{getLimit('content_generation') === -1 ? '∞' : getLimit('content_generation')}
          </div>
        </div>
      </div>

      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site for content generation" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{site.name}</span>
                        {site.niche && (
                          <Badge variant="secondary" className="text-xs">
                            {site.niche}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedSite && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">{selectedSite.name}</h4>
              {selectedSite.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedSite.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {selectedSite.niche && <span>Niche: {selectedSite.niche}</span>}
                {selectedSite.brandVoice && <span>Voice: {selectedSite.brandVoice}</span>}
                {selectedSite.targetKeywords && selectedSite.targetKeywords.length > 0 && (
                  <span>Keywords: {selectedSite.targetKeywords.slice(0, 3).join(', ')}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Limits Alert */}
      {!canGenerateContent && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!canAccess('content_generation') 
              ? "Content generation is not available in your current plan. Upgrade to access AI-powered content creation."
              : `You've reached your monthly content generation limit (${getUsage('content_generation')}/${getLimit('content_generation')}). Upgrade to generate more content.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Content Generation */}
      {selectedSiteId && canGenerateContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Quick Content Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => generateContentMutation.mutate({ type: 'blog_post' })}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Blog Post'}
              </Button>
              <Button 
                onClick={() => generateContentMutation.mutate({ type: 'product_review' })}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Review'}
              </Button>
            </div>

            {generatedContent && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Generated Content</h3>
                  <Button onClick={handleSaveClick} disabled={saveContentMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveContentMutation.isPending ? 'Saving...' : 'Save Content'}
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">{generatedContent.title || 'Generated Content'}</h4>
                  <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                    {generatedContent.content || generatedContent.generated_text || 'Content preview will appear here...'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Content */}
      {recentContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContent.slice(0, 5).map((content) => {
                const site = sites.find(s => s.id === content.siteId);
                return (
                  <div key={content.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(content.status)}
                      <div>
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {site?.name} • {content.contentType.replace('_', ' ')} • {new Date(content.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {content.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {sites.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites available</h3>
            <p className="text-muted-foreground mb-4">
              Create a site first to start generating content
            </p>
            <Button asChild>
              <a href="/sites">Create Your First Site</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Site Selection Dialog */}
      <SiteSelectionDialog
        open={showSiteDialog}
        onOpenChange={setShowSiteDialog}
        sites={sites}
        onSave={saveContentMutation.mutate}
        isLoading={saveContentMutation.isPending}
        title="Save Generated Content"
        description="Choose a site to save this generated content to, or save without a specific site."
      />
    </div>
  );
}
