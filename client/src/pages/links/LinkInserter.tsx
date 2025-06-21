import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Sparkles, Target, CheckCircle, XCircle, Clock,
  Lightbulb, TrendingUp, MousePointer, ExternalLink,
  Plus, Zap, ArrowRight, AlertCircle, Info, ArrowLeft, X, FileText
} from 'lucide-react';

interface ContentItem {
  id: number;
  title: string;
  content: string;
  status: string;
  siteId?: number;
}

interface LinkSuggestion {
  id: number;
  suggestedLinkId: number;
  suggestedAnchorText: string;
  suggestedPosition: number;
  confidence: number;
  reasoning: string;
  contextMatch: any;
  status: string;
  originalUrl?: string;
  shortenedUrl?: string;
}

export default function LinkInserter() {
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [keywords, setKeywords] = useState('');
  const [context, setContext] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Page entry animation
  useEffect(() => {
    // Remove any transition overlay and start page animation
    const overlays = document.querySelectorAll('div[style*="z-index: 9999"]');
    overlays.forEach(overlay => overlay.remove());
    
    // Trigger page entry animation
    setTimeout(() => {
      setPageVisible(true);
    }, 50);
  }, []);

  // Fetch user content
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content');
      return response.json();
    }
  });

  // Fetch user sites
  const { data: sitesData } = useQuery({
    queryKey: ['/api/sites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sites');
      return response.json();
    }
  });

  // Fetch link suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/links/suggestions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/suggestions');
      return response.json();
    }
  });

  // Ensure we have arrays to work with
  const content = Array.isArray(contentData) ? contentData : [];
  const sites = Array.isArray(sitesData) ? sitesData : [];
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData : [];

  // AI suggestion mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/links/ai-suggest', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
      toast({ 
        title: 'AI Suggestions Generated', 
        description: `Generated intelligent link suggestions`
      });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: 'Failed to generate suggestions', variant: 'destructive' });
      setIsGenerating(false);
    }
  });

  // Update suggestion mutation
  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, status, userFeedback }: any) => {
      const response = await apiRequest('PUT', `/api/links/suggestions/${id}`, { status, userFeedback });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
      toast({ title: 'Success', description: 'Suggestion updated successfully' });
    }
  });

  // Bulk insert mutation
  const bulkInsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/links/bulk-insert', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/insertions'] });
      toast({ 
        title: 'Links Inserted', 
        description: `Successfully inserted links`
      });
    }
  });

  const handleGenerateSuggestions = () => {
    if (!selectedContent) {
      toast({ title: 'Error', description: 'Please select content first', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    const requestData = {
      contentId: parseInt(selectedContent),
      siteId: selectedSite ? parseInt(selectedSite) : null,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      context: context
    };

    generateSuggestionsMutation.mutate(requestData);
  };

  const handleAcceptSuggestion = async (suggestion: LinkSuggestion) => {
    // First update the suggestion status
    updateSuggestionMutation.mutate({
      id: suggestion.id,
      status: 'accepted',
      userFeedback: 'Accepted via AI interface'
    });

    // Then automatically insert the link into content
    if (suggestion.contentId && suggestion.suggestedLinkId) {
      bulkInsertMutation.mutate({
        contentId: suggestion.contentId,
        insertions: [{
          linkId: suggestion.suggestedLinkId,
          anchorText: suggestion.suggestedAnchorText,
          position: suggestion.suggestedPosition || 100
        }]
      });
      
      toast({
        title: 'Link Accepted & Inserted',
        description: `Link "${suggestion.suggestedAnchorText}" has been inserted into your content`,
      });
    }
  };

  const handleRejectSuggestion = (suggestion: LinkSuggestion, reason: string = '') => {
    updateSuggestionMutation.mutate({
      id: suggestion.id,
      status: 'rejected',
      userFeedback: reason || 'Rejected via AI interface'
    });
  };

  const handleBulkAccept = () => {
    const pendingSuggestions = suggestions.filter((s: LinkSuggestion) => s.status === 'pending');
    
    if (pendingSuggestions.length === 0) {
      toast({ title: 'No suggestions', description: 'No pending suggestions to accept', variant: 'destructive' });
      return;
    }

    const insertions = pendingSuggestions.map((suggestion: LinkSuggestion) => ({
      linkId: suggestion.suggestedLinkId,
      anchorText: suggestion.suggestedAnchorText,
      position: suggestion.suggestedPosition,
      insertionType: 'ai-suggested',
      insertionContext: 'automatic'
    }));

    bulkInsertMutation.mutate({
      contentId: parseInt(selectedContent),
      insertions
    });

    pendingSuggestions.forEach((suggestion: LinkSuggestion) => {
      updateSuggestionMutation.mutate({
        id: suggestion.id,
        status: 'accepted',
        userFeedback: 'Bulk accepted'
      });
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'default';
    if (confidence >= 60) return 'secondary';
    return 'destructive';
  };

  const pendingSuggestions = suggestions.filter((s: LinkSuggestion) => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter((s: LinkSuggestion) => s.status === 'accepted');
  const rejectedSuggestions = suggestions.filter((s: LinkSuggestion) => s.status === 'rejected');

  return (
    <div className={`container mx-auto p-6 space-y-6 transition-all duration-300 ease-out ${
      pageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          Smart Link Assistant
        </h1>
        <p className="text-lg text-muted-foreground">
          AI finds the perfect links for your content in 3 simple steps
        </p>
      </div>

      {/* Step-by-step process indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            selectedContent ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            1
          </div>
          <div className="w-16 h-1 bg-muted"></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            pendingSuggestions.length > 0 ? 'bg-green-500 text-white' : selectedContent ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className="w-16 h-1 bg-muted"></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            acceptedSuggestions.length > 0 ? 'bg-green-500 text-white' : pendingSuggestions.length > 0 ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Content */}
        <Card className={`${selectedContent ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-blue-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">1</div>
              Choose Your Content
            </CardTitle>
            <CardDescription>
              Select the content you want to optimize with smart links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content-select">Content to optimize</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedContent} 
                onChange={(e) => setSelectedContent(e.target.value)}
              >
                <option value="">Choose content...</option>
                {content.length > 0 ? (
                  content.map((item: ContentItem) => (
                    <option key={item.id} value={item.id.toString()}>
                      {item.title || `Content ${item.id}`}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No content available</option>
                )}
              </select>
            </div>
            
            <div>
              <Label htmlFor="keywords">What topics does this cover?</Label>
              <Input
                id="keywords"
                placeholder="e.g., grant writing, AI tools, nonprofits"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="context">Brief description</Label>
              <textarea
                id="context"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe what this content is about..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Generate Suggestions */}
        <Card className={`${pendingSuggestions.length > 0 ? 'border-green-200 bg-green-50 dark:bg-green-950' : selectedContent ? 'border-blue-200' : 'border-muted'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                pendingSuggestions.length > 0 ? 'bg-green-500 text-white' : selectedContent ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>2</div>
              Get AI Suggestions
            </CardTitle>
            <CardDescription>
              AI analyzes your content and finds relevant links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedContent ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowLeft className="w-8 h-8 mx-auto mb-2" />
                <p>Select content first</p>
              </div>
            ) : pendingSuggestions.length === 0 ? (
              <div className="text-center">
                <Button
                  onClick={handleGenerateSuggestions}
                  disabled={isGenerating}
                  className="w-full h-12"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Finding perfect links...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Find Smart Links
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-green-600 font-medium mb-4">
                  <CheckCircle className="w-5 h-5 inline mr-1" />
                  Found {pendingSuggestions.length} perfect links!
                </div>
                {pendingSuggestions.slice(0, 2).map((suggestion: LinkSuggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{suggestion.suggestedAnchorText}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getConfidenceBadge(suggestion.confidence)} className="text-xs">
                            {suggestion.confidence}% match
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingSuggestions.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pendingSuggestions.length - 2} more suggestions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Review & Accept */}
        <Card className={`${acceptedSuggestions.length > 0 ? 'border-green-200 bg-green-50 dark:bg-green-950' : pendingSuggestions.length > 0 ? 'border-blue-200' : 'border-muted'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                acceptedSuggestions.length > 0 ? 'bg-green-500 text-white' : pendingSuggestions.length > 0 ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>3</div>
              Review & Add Links
            </CardTitle>
            <CardDescription>
              Choose which links to add to your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSuggestions.length === 0 && acceptedSuggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowLeft className="w-8 h-8 mx-auto mb-2" />
                <p>Generate suggestions first</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSuggestions.map((suggestion: LinkSuggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{suggestion.suggestedAnchorText}</h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          disabled={updateSuggestionMutation.isPending || bulkInsertMutation.isPending}
                          className="flex-1"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Add Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectSuggestion(suggestion)}
                          disabled={updateSuggestionMutation.isPending}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {acceptedSuggestions.length > 0 && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-green-700 dark:text-green-300 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        {acceptedSuggestions.length} links added successfully!
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const contentItem = content.find(c => c.id.toString() === selectedContent);
                          if (contentItem) {
                            window.open(`/content/editor/${contentItem.id}`, '_blank');
                          }
                        }}
                        className="text-green-700 dark:text-green-300 border-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View Content
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Smart Tips</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                {!selectedContent ? (
                  <>
                    <li>• Start by selecting the content you want to optimize</li>
                    <li>• Choose content with clear topics for better AI matching</li>
                  </>
                ) : !keywords.trim() ? (
                  <>
                    <li>• Add specific keywords like "{selectedContent && content.find(c => c.id.toString() === selectedContent)?.title ? 
                        content.find(c => c.id.toString() === selectedContent)?.title?.split(' ').slice(0, 2).join(' ').toLowerCase() : 'your topic'}" instead of generic terms</li>
                    <li>• Include 3-5 relevant keywords for better link matching</li>
                  </>
                ) : !context.trim() ? (
                  <>
                    <li>• Describe your content's purpose and target audience</li>
                    <li>• Mention the type of links you want (educational, tools, resources)</li>
                  </>
                ) : pendingSuggestions.length === 0 ? (
                  <>
                    <li>• Your setup looks good! Click "Find Smart Links" to generate suggestions</li>
                    <li>• Keywords: "{keywords}" will help AI find relevant matches</li>
                  </>
                ) : acceptedSuggestions.length === 0 ? (
                  <>
                    <li>• Review confidence scores - higher percentages mean better matches</li>
                    <li>• Check if the suggested anchor text fits naturally in your content</li>
                    <li>• Accept links that add real value for your readers</li>
                  </>
                ) : (
                  <>
                    <li>• Great! You've added {acceptedSuggestions.length} smart link{acceptedSuggestions.length > 1 ? 's' : ''}</li>
                    <li>• Monitor performance in your analytics to see what works best</li>
                    <li>• Generate suggestions for more content to build your link strategy</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="hidden">
        <TabsList className="hidden">
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="hidden" className="hidden">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate AI Link Suggestions
              </CardTitle>
              <CardDescription>
                Select content and provide context for intelligent link placement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="content-select">Select Content</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedContent} 
                    onChange={(e) => setSelectedContent(e.target.value)}
                  >
                    <option value="">Choose content to optimize</option>
                    {content.length > 0 ? (
                      content.map((item: ContentItem) => (
                        <option key={item.id} value={item.id.toString()}>
                          {item.title || `Content ${item.id}`}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No content available
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <Label htmlFor="site-select">Target Site (Optional)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedSite} 
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    <option value="">All sites</option>
                    {sites.map((site: any) => (
                      <option key={site.id} value={site.id.toString()}>
                        {site.name || `Site ${site.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., best smartphone, tech review, mobile devices"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Keywords help AI match relevant links to your content
                </p>
              </div>

              <div>
                <Label htmlFor="context">Content Context</Label>
                <Textarea
                  id="context"
                  placeholder="Describe the content theme, target audience, and desired link placement strategy..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Provide context to help AI understand the best link placement opportunities
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleGenerateSuggestions}
                  disabled={!selectedContent || isGenerating || generateSuggestionsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {isGenerating || generateSuggestionsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate AI Suggestions
                    </>
                  )}
                </Button>
                
                {pendingSuggestions.length > 0 && (
                  <Button 
                    onClick={handleBulkAccept}
                    variant="outline"
                    disabled={bulkInsertMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept All ({pendingSuggestions.length})
                  </Button>
                )}
              </div>

              {selectedContent && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        AI Analysis Process
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        Our AI will analyze your content, match relevant links from your library, 
                        consider keyword relevance, context alignment, and performance potential 
                        to suggest optimal link placements.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          {pendingSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Pending AI Suggestions
                </CardTitle>
                <CardDescription>
                  Review and approve AI-generated link insertion recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSuggestions.map((suggestion: LinkSuggestion) => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{suggestion.suggestedAnchorText}</h4>
                            <Badge variant={getConfidenceBadge(suggestion.confidence)}>
                              {suggestion.confidence}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Position: Character {suggestion.suggestedPosition}
                          </p>
                          <p className="text-sm">{suggestion.reasoning}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptSuggestion(suggestion)}
                            disabled={updateSuggestionMutation.isPending || bulkInsertMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {(updateSuggestionMutation.isPending || bulkInsertMutation.isPending) ? 'Inserting...' : 'Accept & Insert'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectSuggestion(suggestion)}
                            disabled={updateSuggestionMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {suggestions.length === 0 && !suggestionsLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Suggestions Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate AI-powered link suggestions to get started
                  </p>
                  <Button onClick={() => setSelectedTab('generator')}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Generator
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Suggestion History
              </CardTitle>
              <CardDescription>
                Complete history of AI link suggestions and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion: LinkSuggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{suggestion.suggestedAnchorText}</h4>
                          <Badge variant={
                            suggestion.status === 'accepted' ? 'default' :
                            suggestion.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {suggestion.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Confidence: {suggestion.confidence}% • Position: {suggestion.suggestedPosition}
                        </p>
                        <p className="text-sm">{suggestion.reasoning}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Confidence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}