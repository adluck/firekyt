import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ComparisonTableBuilder } from '@/components/editor/ComparisonTableBuilder';
import { apiRequest } from '@/lib/queryClient';
import {
  Save,
  Eye,
  Settings,
  FileText,
  Table,
  Share,
  Calendar,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentData {
  id?: number;
  title: string;
  content: string;
  richContent?: any;
  comparisonTables?: any;
  contentType: string;
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  targetKeywords?: string[];
  affiliateLinks?: any[];
  siteId: number;
}

interface Site {
  id: number;
  name: string;
  niche?: string;
  brandVoice?: string;
}

const contentTypes = [
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'product_review', label: 'Product Review' },
  { value: 'comparison', label: 'Product Comparison' },
  { value: 'buying_guide', label: 'Buying Guide' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
];

interface ContentEditorProps {
  id?: string;
}

export default function ContentEditor({ id: propId }: ContentEditorProps = {} as ContentEditorProps) {
  const { id: urlId } = useParams<{ id?: string }>();
  const id = propId || urlId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get siteId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const siteIdFromUrl = urlParams.get('siteId');
  
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    content: '',
    contentType: 'blog_post',
    status: 'draft',
    siteId: siteIdFromUrl ? parseInt(siteIdFromUrl) : 0,
  });
  
  const [activeTab, setActiveTab] = useState<'editor' | 'tables' | 'seo' | 'preview'>('editor');
  const [comparisonTableConfig, setComparisonTableConfig] = useState<any>(null);
  const [keywords, setKeywords] = useState<string>('');

  // Fetch existing content if editing
  const { data: existingContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content', id],
    enabled: !!id,
  });

  // Fetch user sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Set default siteId when sites are loaded (only if no siteId from URL)
  useEffect(() => {
    if (sites.length > 0 && contentData.siteId === 0 && !siteIdFromUrl) {
      setContentData(prev => ({ ...prev, siteId: sites[0].id }));
    }
  }, [sites, contentData.siteId, siteIdFromUrl]);

  // Load existing content data
  useEffect(() => {
    if (existingContent) {
      const contentWithKeywords = existingContent as any;
      setContentData(prevData => ({
        ...prevData,
        ...existingContent,
        targetKeywords: contentWithKeywords.targetKeywords || [],
        comparisonTables: contentWithKeywords.comparisonTables || null,
      }));
      setKeywords((contentWithKeywords.targetKeywords || []).join(', '));
      setComparisonTableConfig(contentWithKeywords.comparisonTables || null);
    }
  }, [existingContent]);

  // Save content mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ContentData) => {
      // For new content, id will be undefined, so we use POST to /api/content
      // For existing content, we use PATCH to /api/content/:id
      const isUpdate = id && id !== 'undefined';
      const url = isUpdate ? `/api/content/${id}` : '/api/content';
      const method = isUpdate ? 'PATCH' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: async (response) => {
      try {
        const result = await response.json();
        toast({
          title: 'Content saved',
          description: id ? 'Content updated successfully' : 'New content created successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
        if (!id && result?.id) {
          setLocation(`/content/editor/${result.id}`);
        }
      } catch (error) {
        console.error('Failed to parse response:', error);
      }
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Save comparison table mutation
  const saveTableMutation = useMutation({
    mutationFn: async (config: any) => {
      return apiRequest('POST', '/api/comparison-tables', {
        ...config,
        contentId: contentData.id,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Comparison table saved',
        description: 'Table configuration saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateContentData = (updates: Partial<ContentData>) => {
    setContentData(prev => ({ ...prev, ...updates }));
  };

  const handleRichContentChange = (content: string) => {
    updateContentData({ 
      content,
      richContent: content, // Store rich content structure
    });
  };

  const handleTableConfigChange = (config: any) => {
    setComparisonTableConfig(config);
    updateContentData({
      comparisonTables: config,
    });
  };

  const handleSave = () => {
    if (!contentData.title.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a title for your content',
        variant: 'destructive',
      });
      return;
    }

    if (!contentData.siteId) {
      toast({
        title: 'Validation error',
        description: 'Please select a site for your content',
        variant: 'destructive',
      });
      return;
    }

    const dataToSave = {
      ...contentData,
      targetKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    };

    saveMutation.mutate(dataToSave);
  };

  const handlePublish = () => {
    updateContentData({ status: 'published' });
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  const handleSaveTable = (config: any) => {
    saveTableMutation.mutate(config);
  };

  const generatePreview = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentData.content, 'text/html');
    return doc.body.textContent || '';
  };

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {id ? 'Edit Content' : 'Create New Content'}
          </h1>
          <p className="text-muted-foreground">
            Create and edit rich content with comparison tables
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={saveMutation.isPending}
          >
            <Share className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Content Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="w-full justify-start border-b rounded-none h-12">
                  <TabsTrigger value="editor" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="tables" className="gap-2">
                    <Table className="w-4 h-4" />
                    Tables
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="gap-2">
                    <Settings className="w-4 h-4" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="title">Content Title</Label>
                    <Input
                      id="title"
                      value={contentData.title}
                      onChange={(e) => updateContentData({ title: e.target.value })}
                      placeholder="Enter your content title..."
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* Conditional editor based on whether editing existing content */}
                  {id ? (
                    // Simple text editor for existing content
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={contentData.content}
                        onChange={(e) => updateContentData({ content: e.target.value })}
                        placeholder="Edit your content..."
                        className="min-h-[500px] resize-y"
                        rows={20}
                      />
                    </div>
                  ) : (
                    // Rich text editor for new content
                    <RichTextEditor
                      content={contentData.content}
                      onChange={handleRichContentChange}
                      placeholder="Start writing your content..."
                      className="min-h-[500px]"
                    />
                  )}
                </TabsContent>

                <TabsContent value="tables" className="p-6">
                  <ComparisonTableBuilder
                    config={comparisonTableConfig}
                    onChange={handleTableConfigChange}
                    onSave={handleSaveTable}
                  />
                </TabsContent>

                <TabsContent value="seo" className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo-title">SEO Title</Label>
                      <Input
                        id="seo-title"
                        value={contentData.seoTitle || ''}
                        onChange={(e) => updateContentData({ seoTitle: e.target.value })}
                        placeholder="Optimized title for search engines..."
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(contentData.seoTitle || '').length}/60 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="seo-description">Meta Description</Label>
                      <Textarea
                        id="seo-description"
                        value={contentData.seoDescription || ''}
                        onChange={(e) => updateContentData({ seoDescription: e.target.value })}
                        placeholder="Brief description for search results..."
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(contentData.seoDescription || '').length}/160 characters
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="keywords">Target Keywords</Label>
                      <Input
                        id="keywords"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="keyword1, keyword2, keyword3..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate keywords with commas
                      </p>
                    </div>

                    {keywords && (
                      <div>
                        <Label>Keywords Preview</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {keywords.split(',').map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="p-6">
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h1 className="text-3xl font-bold mb-2">{contentData.title}</h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Type: {contentTypes.find(t => t.value === contentData.contentType)?.label}</span>
                        <span>Status: {statusOptions.find(s => s.value === contentData.status)?.label}</span>
                        {contentData.targetKeywords && contentData.targetKeywords.length > 0 && (
                          <span>Keywords: {contentData.targetKeywords.length}</span>
                        )}
                      </div>
                    </div>

                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: contentData.content }}
                    />

                    {comparisonTableConfig && (
                      <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Product Comparison</h2>
                        <div className="border rounded-lg p-4">
                          <p className="text-muted-foreground">
                            Comparison table: {comparisonTableConfig.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {comparisonTableConfig.columns?.length || 0} columns, {comparisonTableConfig.rows?.length || 0} products
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publication Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site">Target Site (Optional)</Label>
                <Select
                  value={contentData.siteId > 0 ? contentData.siteId.toString() : ""}
                  onValueChange={(value) => updateContentData({ siteId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <Select
                  value={contentData.contentType}
                  onValueChange={(value) => updateContentData({ contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={contentData.status}
                  onValueChange={(value) => updateContentData({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Content Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Word Count:</span>
                <span>{generatePreview().split(/\s+/).filter(Boolean).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Character Count:</span>
                <span>{contentData.content?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Reading Time:</span>
                <span>~{Math.ceil(generatePreview().split(/\s+/).filter(Boolean).length / 200)} min</span>
              </div>
              {comparisonTableConfig && (
                <div className="flex justify-between text-sm">
                  <span>Comparison Tables:</span>
                  <span>1</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ExternalLink className="w-4 h-4 mr-2" />
                Add Affiliate Links
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Tag className="w-4 h-4 mr-2" />
                SEO Analysis
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}