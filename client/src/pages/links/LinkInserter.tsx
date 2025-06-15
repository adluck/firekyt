import React, { useState } from 'react';
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
  Plus, Zap, ArrowRight, AlertCircle, Info
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user content
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content'],
    queryFn: () => apiRequest('/api/content')
  });

  // Fetch user sites
  const { data: sitesData } = useQuery({
    queryKey: ['/api/sites'],
    queryFn: () => apiRequest('/api/sites')
  });

  // Fetch link suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/links/suggestions'],
    queryFn: () => apiRequest('/api/links/suggestions')
  });

  // Ensure we have arrays to work with
  const content = Array.isArray(contentData) ? contentData : [];
  const sites = Array.isArray(sitesData) ? sitesData : [];
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData : [];

  // AI suggestion mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/links/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
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
    mutationFn: ({ id, status, userFeedback }: any) => apiRequest(`/api/links/suggestions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userFeedback })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
      toast({ title: 'Success', description: 'Suggestion updated successfully' });
    }
  });

  // Bulk insert mutation
  const bulkInsertMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/links/bulk-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
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

  const handleAcceptSuggestion = (suggestion: LinkSuggestion) => {
    updateSuggestionMutation.mutate({
      id: suggestion.id,
      status: 'accepted',
      userFeedback: 'Accepted via AI interface'
    });
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Link Inserter
          </h1>
          <p className="text-muted-foreground">
            Intelligent link suggestions powered by AI for optimal content performance
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
          <TabsTrigger value="suggestions">
            Suggestions 
            {pendingSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingSuggestions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
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
                  <Select value={selectedContent} onValueChange={setSelectedContent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose content to optimize" />
                    </SelectTrigger>
                    <SelectContent>
                      {content.length > 0 ? (
                        content.map((item: ContentItem) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.title || `Content ${item.id}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No content available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="site-select">Target Site (Optional)</Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by specific site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All sites</SelectItem>
                      {sites.map((site: any) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name || `Site ${site.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            disabled={updateSuggestionMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Accept
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