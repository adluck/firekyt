import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Sparkles, Target, TrendingUp, BarChart3, 
  Plus, Edit, Trash2, Eye, MousePointer, DollarSign,
  Zap, Link, Filter, Search, Globe, CheckCircle, XCircle,
  FileText, Settings, Lightbulb
} from 'lucide-react';
import LinkInsertionPreview from '@/components/links/LinkInsertionPreview';
import LinkPerformanceStats from '@/components/links/LinkPerformanceStats';
import RetroactiveConversion from '@/components/links/RetroactiveConversion';
import { parseContextMatch } from '@/utils/parseContextMatch';
import { LoadingGate } from '@/components/LoadingGate';

interface IntelligentLink {
  id: number;
  title: string;
  originalUrl: string;
  shortenedUrl?: string;
  description?: string;
  keywords: string[];
  targetKeywords: string[];
  priority: number;
  isActive: boolean;
  insertionStrategy: string;
  affiliateData?: any;
  performanceGoals?: any;
  categoryId?: number;
  siteId?: number;
}

interface LinkSuggestion {
  id: number;
  suggestedLinkId: number;
  suggestedAnchorText: string;
  confidence: number;
  reasoning: string;
  status: string;
  contextMatch: string[];
}

export default function IntelligentLinkManager() {
  const [selectedTab, setSelectedTab] = useState('links');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<IntelligentLink | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [aiSuggestContent, setAiSuggestContent] = useState('');
  const [aiSuggestKeywords, setAiSuggestKeywords] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch intelligent links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['/api/links/intelligent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/intelligent');
      return response.json();
    }
  });

  // Fetch link suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/links/suggestions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/suggestions');
      return response.json();
    }
  });

  // Fetch user sites
  const { data: sites = [] } = useQuery({
    queryKey: ['/api/sites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sites');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/links/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/categories');
      return response.json();
    }
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: (linkData: any) => apiRequest('POST', '/api/links/intelligent', linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Success', description: 'Intelligent link created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: ({ id, ...linkData }: any) => apiRequest('PUT', `/api/links/intelligent/${id}`, linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      setIsEditDialogOpen(false);
      setEditingLink(null);
      toast({ title: 'Success', description: 'Link updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/links/intelligent/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      toast({ title: 'Success', description: 'Link deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // AI suggest mutation
  const aiSuggestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/links/ai-suggest', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
      toast({ 
        title: 'AI Suggestions Generated', 
        description: `Found ${data.totalFound} intelligent link suggestions` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Accept suggestion mutation
  const acceptSuggestionMutation = useMutation({
    mutationFn: (suggestionId: number) => 
      apiRequest('PUT', `/api/links/suggestions/${suggestionId}`, { status: 'accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
      toast({ title: 'Success', description: 'Suggestion accepted and link inserted' });
    }
  });

  // Bulk accept suggestions mutation
  const bulkAcceptMutation = useMutation({
    mutationFn: async (suggestionIds: number[]) => {
      const insertions = suggestionIds.map(id => {
        const suggestion = suggestions.find((s: any) => s.id === id);
        return {
          linkId: suggestion.suggestedLinkId,
          anchorText: suggestion.suggestedAnchorText,
          position: suggestion.suggestedPosition,
          insertionType: 'ai-suggested',
          insertionContext: 'content_body'
        };
      });

      const response = await apiRequest('POST', '/api/links/bulk-insert', {
        contentId: 1, // Use appropriate content ID
        insertions
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
      toast({ title: 'Success', description: 'Multiple suggestions accepted and links inserted' });
    }
  });

  const handleCreateLink = (formData: FormData) => {
    const linkData = {
      title: formData.get('title'),
      originalUrl: formData.get('originalUrl'),
      description: formData.get('description'),
      keywords: formData.get('keywords')?.toString().split(',').map(k => k.trim()) || [],
      targetKeywords: formData.get('targetKeywords')?.toString().split(',').map(k => k.trim()) || [],
      priority: parseInt(formData.get('priority')?.toString() || '50'),
      insertionStrategy: formData.get('insertionStrategy') || 'manual',
      categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId')?.toString() || '0') : null,
      siteId: formData.get('siteId') ? parseInt(formData.get('siteId')?.toString() || '0') : null,
      affiliateData: {
        commissionRate: formData.get('commissionRate') || '',
        trackingId: formData.get('trackingId') || ''
      }
    };
    createLinkMutation.mutate(linkData);
  };

  const handleAISuggest = () => {
    if (!aiSuggestContent.trim()) {
      toast({ title: 'Error', description: 'Please provide content for analysis', variant: 'destructive' });
      return;
    }

    aiSuggestMutation.mutate({
      contentId: 1, // Use first content for demo
      keywords: aiSuggestKeywords.split(',').map(k => k.trim()).filter(k => k),
      context: aiSuggestContent
    });
  };

  const handleEditLink = (formData: FormData) => {
    if (!editingLink) return;
    
    const linkData = {
      id: editingLink.id,
      title: formData.get('title'),
      originalUrl: formData.get('originalUrl'),
      description: formData.get('description'),
      keywords: formData.get('keywords')?.toString().split(',').map(k => k.trim()) || [],
      targetKeywords: formData.get('targetKeywords')?.toString().split(',').map(k => k.trim()) || [],
      priority: parseInt(formData.get('priority')?.toString() || '50'),
      insertionStrategy: formData.get('insertionStrategy') || 'manual',
      categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId')?.toString() || '0') : null,
      siteId: formData.get('siteId') ? parseInt(formData.get('siteId')?.toString() || '0') : null,
    };
    
    updateLinkMutation.mutate(linkData);
  };

  const handleDeleteLink = (linkId: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      deleteLinkMutation.mutate(linkId);
    }
  };

  const filteredLinks = links.filter((link: IntelligentLink) => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStrategy = filterStrategy === 'all' || link.insertionStrategy === filterStrategy;
    return matchesSearch && matchesStrategy;
  });

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'automatic': return 'bg-green-100 text-green-800';
      case 'ai-suggested': return 'bg-blue-100 text-blue-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <LoadingGate minLoadTime={300}>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Intelligent Link Manager
          </h1>
          <p className="text-muted-foreground">
            AI-powered affiliate link optimization and placement
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Intelligent Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Intelligent Link</DialogTitle>
              <DialogDescription>
                Add a new affiliate link with AI-powered optimization settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateLink(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Link Title</Label>
                    <Input id="title" name="title" placeholder="e.g., Best Gaming Laptop 2024" required />
                  </div>
                  <div>
                    <Label htmlFor="originalUrl">Original URL</Label>
                    <Input id="originalUrl" name="originalUrl" type="url" placeholder="https://affiliate-link.com" required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Describe this affiliate link..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input id="keywords" name="keywords" placeholder="gaming, laptop, review" />
                  </div>
                  <div>
                    <Label htmlFor="targetKeywords">Target Keywords</Label>
                    <Input id="targetKeywords" name="targetKeywords" placeholder="best gaming laptop, top gaming pc" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority (1-100)</Label>
                    <Input id="priority" name="priority" type="number" min="1" max="100" defaultValue="50" />
                  </div>
                  <div>
                    <Label htmlFor="insertionStrategy">Insertion Strategy</Label>
                    <Select name="insertionStrategy" defaultValue="manual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="ai-suggested">AI Suggested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select name="categoryId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input id="commissionRate" name="commissionRate" placeholder="5.5" />
                  </div>
                  <div>
                    <Label htmlFor="trackingId">Tracking ID</Label>
                    <Input id="trackingId" name="trackingId" placeholder="affiliate_123" />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={createLinkMutation.isPending}>
                  {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="links">Intelligent Links</TabsTrigger>
          <TabsTrigger value="ai-suggest">AI Suggestions</TabsTrigger>
          <TabsTrigger value="preview">Link Preview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterStrategy} onValueChange={setFilterStrategy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="ai-suggested">AI Suggested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Links Grid */}
          <div className="grid gap-4">
            {linksLoading ? (
              <div>Loading intelligent links...</div>
            ) : filteredLinks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Link className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Intelligent Links</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first intelligent link to get started with AI-powered optimization
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredLinks.map((link: IntelligentLink) => (
                <Card key={link.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <CardDescription>{link.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStrategyColor(link.insertionStrategy)}>
                          {link.insertionStrategy.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          Priority: {link.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        {link.originalUrl}
                      </div>
                      
                      {link.keywords && link.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {link.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            0 views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="h-4 w-4" />
                            0 clicks
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            $0.00
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingLink(link);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteLink(link.id)}
                            disabled={deleteLinkMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai-suggest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI-Powered Link Suggestions
              </CardTitle>
              <CardDescription>
                Analyze your content and get intelligent link placement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-content">Content to Analyze</Label>
                <Textarea
                  id="ai-content"
                  placeholder="Paste your content here for AI analysis..."
                  value={aiSuggestContent}
                  onChange={(e) => setAiSuggestContent(e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="ai-keywords">Target Keywords (optional)</Label>
                <Input
                  id="ai-keywords"
                  placeholder="gaming laptop, tech review, affiliate"
                  value={aiSuggestKeywords}
                  onChange={(e) => setAiSuggestKeywords(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAISuggest} 
                  disabled={aiSuggestMutation.isPending}
                  className="flex-1"
                >
                  {aiSuggestMutation.isPending ? (
                    <>Analyzing Content...</>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate AI Suggestions
                    </>
                  )}
                </Button>
                {suggestions.length > 0 && (
                  <Button 
                    onClick={() => setSelectedTab('preview')}
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <div className="space-y-4">
            {suggestionsLoading ? (
              <div>Loading suggestions...</div>
            ) : suggestions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No AI Suggestions</h3>
                  <p className="text-muted-foreground text-center">
                    Analyze your content above to get intelligent link placement suggestions
                  </p>
                </CardContent>
              </Card>
            ) : (
              suggestions.map((suggestion: LinkSuggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          "{suggestion.suggestedAnchorText}"
                        </CardTitle>
                        <CardDescription>{suggestion.reasoning}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(suggestion.confidence)}>
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant={suggestion.status === 'pending' ? 'default' : 'secondary'}>
                          {suggestion.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {parseContextMatch(suggestion.contextMatch).map((match: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {match}
                          </Badge>
                        ))}
                      </div>
                      
                      {suggestion.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => acceptSuggestionMutation.mutate(suggestion.id)}
                            disabled={acceptSuggestionMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => 
                              apiRequest('PUT', `/api/links/suggestions/${suggestion.id}`, { status: 'rejected' })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
                                  toast({ title: 'Suggestion rejected' });
                                })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {aiSuggestContent && suggestions.length > 0 ? (
            <LinkInsertionPreview
              content={aiSuggestContent}
              suggestions={suggestions.map((s: any) => ({
                id: s.id,
                linkId: s.suggestedLinkId,
                anchorText: s.suggestedAnchorText,
                position: s.suggestedPosition || 0,
                confidence: parseFloat(s.confidence) || 0,
                reasoning: s.reasoning,
                contextMatch: s.contextMatch || [],
                linkTitle: `Link ${s.suggestedLinkId}`,
                linkUrl: 'https://example.com/affiliate-link'
              }))}
              onAccept={(suggestionId) => acceptSuggestionMutation.mutate(suggestionId)}
              onReject={(suggestionId) => 
                apiRequest('PUT', `/api/links/suggestions/${suggestionId}`, { status: 'rejected' })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/links/suggestions'] });
                    toast({ title: 'Suggestion rejected' });
                  })
              }
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Content to Preview</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate AI suggestions first to see the link insertion preview
                </p>
                <Button onClick={() => setSelectedTab('ai-suggest')} variant="outline">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Link Performance Overview
              </CardTitle>
              <CardDescription>
                Track the effectiveness of your intelligent link strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{links.length}</div>
                  <div className="text-sm text-muted-foreground">Total Intelligent Links</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{suggestions.filter(s => s.status === 'accepted').length}</div>
                  <div className="text-sm text-muted-foreground">Active Insertions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{suggestions.length}</div>
                  <div className="text-sm text-muted-foreground">AI Suggestions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Link Performance */}
          {links.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Individual Link Performance</h3>
              {links.slice(0, 3).map((link: any) => (
                <LinkPerformanceStats key={link.id} linkId={link.id} days={30} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="retroactive" className="space-y-6">
          <RetroactiveConversion />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Intelligent Link</DialogTitle>
            <DialogDescription>
              Update your affiliate link details and optimization settings.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleEditLink(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-title">Link Title</Label>
                <Input 
                  id="edit-title" 
                  name="title" 
                  defaultValue={editingLink?.title || ''}
                  placeholder="Best Gaming Laptop 2024" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="edit-originalUrl">Original URL</Label>
                <Input 
                  id="edit-originalUrl" 
                  name="originalUrl" 
                  type="url" 
                  defaultValue={editingLink?.originalUrl || ''}
                  placeholder="https://affiliate-link.com/product" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  name="description" 
                  defaultValue={editingLink?.description || ''}
                  placeholder="Describe what this link is for..." 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-keywords">Keywords (comma-separated)</Label>
                <Input 
                  id="edit-keywords" 
                  name="keywords" 
                  defaultValue={editingLink?.keywords?.join(', ') || ''}
                  placeholder="gaming, laptop, review" 
                />
              </div>
              <div>
                <Label htmlFor="edit-targetKeywords">Target Keywords</Label>
                <Input 
                  id="edit-targetKeywords" 
                  name="targetKeywords" 
                  defaultValue={editingLink?.targetKeywords?.join(', ') || ''}
                  placeholder="best gaming laptop, top gaming pc" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority (1-100)</Label>
                <Input 
                  id="edit-priority" 
                  name="priority" 
                  type="number" 
                  min="1" 
                  max="100" 
                  defaultValue={editingLink?.priority || 50}
                />
              </div>
              <div>
                <Label htmlFor="edit-insertionStrategy">Insertion Strategy</Label>
                <Select name="insertionStrategy" defaultValue={editingLink?.insertionStrategy || 'manual'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="ai-suggested">AI Suggested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-categoryId">Category</Label>
                <Select name="categoryId" defaultValue={editingLink?.categoryId?.toString() || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Category</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-siteId">Site</Label>
              <Select name="siteId" defaultValue={editingLink?.siteId?.toString() || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Site</SelectItem>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLinkMutation.isPending}>
                {updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </LoadingGate>
  );
}