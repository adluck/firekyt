import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownToHtml, isMarkdown } from '@/lib/markdownUtils';
import type { Site } from '@shared/schema';

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

interface UnifiedContentEditorProps {
  // Content data
  contentId?: string | number;
  initialContent?: Partial<ContentData>;
  
  // Display options
  mode?: 'create' | 'edit' | 'embedded';
  showHeader?: boolean;
  showSidebar?: boolean;
  className?: string;
  
  // Save behavior configuration
  onSave?: (data: ContentData) => Promise<void>;
  onClose?: () => void;
  saveEndpoint?: string;
  customSaveMethod?: 'POST' | 'PUT' | 'PATCH';
  
  // Feature toggles
  enableTables?: boolean;
  enableSEO?: boolean;
  enablePreview?: boolean;
  
  // Validation
  requiredFields?: (keyof ContentData)[];
  
  // Loading states
  isLoading?: boolean;
  isSaving?: boolean;
}

const contentTypes = [
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'product_comparison', label: 'Product Comparison' },
  { value: 'review_article', label: 'Review Article' },
  { value: 'video_script', label: 'Video Script' },
  { value: 'social_post', label: 'Social Media Post' },
  { value: 'email_campaign', label: 'Email Campaign' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
];

export function UnifiedContentEditor({
  contentId,
  initialContent = {},
  mode = 'create',
  showHeader = true,
  showSidebar = true,
  className,
  onSave,
  onClose,
  saveEndpoint,
  customSaveMethod,
  enableTables = true,
  enableSEO = true,
  enablePreview = true,
  requiredFields = ['title', 'content'],
  isLoading: externalLoading = false,
  isSaving: externalSaving = false,
}: UnifiedContentEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    content: '',
    contentType: 'blog_post',
    status: 'draft',
    siteId: 0,
    ...initialContent,
  });
  
  const [activeTab, setActiveTab] = useState<'editor' | 'tables' | 'seo' | 'preview'>('editor');
  const [comparisonTableConfig, setComparisonTableConfig] = useState<any>(null);
  const [keywords, setKeywords] = useState<string>('');

  // Fetch existing content if editing
  const { data: existingContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content', contentId],
    enabled: !!contentId && mode === 'edit',
  });

  // Fetch user sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Set default siteId when sites are loaded
  useEffect(() => {
    if (sites.length > 0 && contentData.siteId === 0) {
      setContentData(prev => ({ ...prev, siteId: sites[0].id }));
    }
  }, [sites, contentData.siteId]);

  // Load existing content data
  useEffect(() => {
    if (initialContent) {
      const contentWithKeywords = initialContent as any;
      
      // Parse content based on format
      let parsedContent = contentWithKeywords.content || '';
      
      if (typeof parsedContent === 'string' && parsedContent.trim()) {
        // Check if content starts with JSON-like structure
        if (parsedContent.trim().startsWith('{')) {
          try {
            // Try to parse as JSON first
            const jsonContent = JSON.parse(parsedContent);
            if (jsonContent && typeof jsonContent === 'object') {
              // If it's a JSON object with content field, extract it
              if (jsonContent.content && typeof jsonContent.content === 'string') {
                parsedContent = jsonContent.content;
              } else if (jsonContent.generated_text && typeof jsonContent.generated_text === 'string') {
                parsedContent = jsonContent.generated_text;
              } else {
                // If it's JSON but doesn't have expected fields, keep the original
                parsedContent = parsedContent;
              }
            }
          } catch {
            // If JSON parsing fails, use the content as-is
            parsedContent = parsedContent;
          }
        }
        // If not JSON, content is already set correctly
      }
      
      // Ensure we don't lose content during processing
      if (!parsedContent && contentWithKeywords.content) {
        parsedContent = contentWithKeywords.content;
      }
      

      
      setContentData(prevData => ({
        ...prevData,
        ...(initialContent || {}),
        content: parsedContent,
        targetKeywords: contentWithKeywords.targetKeywords || [],
        comparisonTables: contentWithKeywords.comparisonTables || null,
      }));
      setKeywords((contentWithKeywords.targetKeywords || []).join(', '));
      setComparisonTableConfig(contentWithKeywords.comparisonTables || null);
    }
  }, [initialContent]);

  // Simple keyword save function
  const saveKeywords = async () => {
    alert('Save keywords function called!'); // Visual debug
    console.log('🔍 KEYWORDS Function started, contentId:', contentId);
    console.log('🔍 KEYWORDS Current keywords:', keywords);
    
    if (!contentId) {
      toast({
        title: 'Error',
        description: 'Content ID required for keyword updates',
        variant: 'destructive',
      });
      return;
    }

    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      console.log('🔍 KEYWORDS Saving keywords:', JSON.stringify(keywordArray));
      
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetKeywords: keywordArray
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 KEYWORDS Response received:', JSON.stringify(result));
      
      // Update local state immediately
      if (result && result.targetKeywords) {
        const newKeywordsString = Array.isArray(result.targetKeywords) 
          ? result.targetKeywords.join(', ') 
          : String(result.targetKeywords);
        
        console.log('🔍 KEYWORDS Updating UI to:', newKeywordsString);
        
        // Force immediate state update
        setKeywords(newKeywordsString);
        setContentData(prev => ({ 
          ...prev, 
          targetKeywords: result.targetKeywords 
        }));
        
        console.log('🔍 KEYWORDS UI state updated to:', newKeywordsString);
      }
      
      toast({
        title: 'Keywords saved',
        description: 'SEO keywords updated successfully',
      });
      
      // Force refresh of content list
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
    } catch (error: any) {
      console.error('🔍 KEYWORDS Error:', error);
      alert('Error: ' + error.message); // Visual debug
      toast({
        title: 'Keywords save failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Default save mutation
  const defaultSaveMutation = useMutation({
    mutationFn: async (data: ContentData) => {
      if (onSave) {
        await onSave(data);
        return { success: true };
      }
      
      // Default API save behavior
      const isUpdate = contentId && mode === 'edit';
      const url = saveEndpoint || (isUpdate ? `/api/content/${contentId}` : '/api/content');
      const method = customSaveMethod || (isUpdate ? 'PATCH' : 'POST');
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: async (result) => {
      console.log('🔍 FRONTEND onSuccess called with result:', JSON.stringify(result));
      console.log('🔍 FRONTEND targetKeywords from response:', JSON.stringify(result?.targetKeywords));
      
      // Update keywords state with saved data to reflect in UI
      if (result && result.targetKeywords) {
        const newKeywords = Array.isArray(result.targetKeywords) ? result.targetKeywords.join(', ') : String(result.targetKeywords);
        console.log('🔍 FRONTEND Setting keywords to:', newKeywords);
        setKeywords(newKeywords);
        setContentData(prev => ({ 
          ...prev, 
          targetKeywords: result.targetKeywords 
        }));
        
        // Force UI update by triggering a state change
        setTimeout(() => {
          setKeywords(newKeywords);
        }, 0);
      } else {
        console.log('🔍 FRONTEND No targetKeywords in result or result is null');
      }
      
      toast({
        title: 'Content saved',
        description: contentId ? 'Content updated successfully' : 'New content created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      if (mode === 'embedded' && onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
      richContent: content,
    });
  };

  const handleTableConfigChange = (config: any) => {
    setComparisonTableConfig(config);
    updateContentData({
      comparisonTables: config,
    });
  };

  const handleValidation = (): boolean => {
    for (const field of requiredFields) {
      const value = contentData[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        toast({
          title: 'Validation error',
          description: `Please enter a ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: 'destructive',
        });
        return false;
      }
    }

    if (requiredFields.includes('siteId') && !contentData.siteId) {
      toast({
        title: 'Validation error',
        description: 'Please select a site for your content',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!handleValidation()) return;

    const dataToSave = {
      ...contentData,
      targetKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    };

    console.log('Saving content with keywords:', dataToSave.targetKeywords);
    console.log('Full data being saved:', dataToSave);

    defaultSaveMutation.mutate(dataToSave);
  };

  const handlePublish = () => {
    if (!handleValidation()) return;

    const dataToSave = {
      ...contentData,
      status: 'published',
      targetKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    };

    console.log('Publishing content with keywords:', dataToSave.targetKeywords);
    console.log('Full data being published:', dataToSave);

    defaultSaveMutation.mutate(dataToSave);
  };

  const handleSaveTable = (config: any) => {
    saveTableMutation.mutate(config);
  };

  const generatePreview = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentData.content, 'text/html');
    return doc.body.textContent || '';
  };

  const isLoading = contentLoading || externalLoading;
  const isSaving = defaultSaveMutation.isPending || externalSaving;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabsToShow = [
    { key: 'editor', label: 'Editor', icon: FileText },
    enableTables && { key: 'tables', label: 'Tables', icon: Table },
    enableSEO && { key: 'seo', label: 'SEO', icon: Settings },
    enablePreview && { key: 'preview', label: 'Preview', icon: Eye },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: any }>;

  return (
    <div className={cn('max-w-7xl mx-auto space-y-6', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'edit' ? 'Edit Content' : 'Create New Content'}
            </h1>
            <p className="text-muted-foreground">
              Create and edit rich content with comparison tables
            </p>
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            )}
            {enablePreview && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('preview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving}
            >
              <Share className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        "grid gap-6",
        showSidebar ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1"
      )}>
        {/* Content Editor */}
        <div className={cn(showSidebar ? "lg:col-span-3" : "col-span-1")}>
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="w-full justify-start border-b rounded-none h-12">
                  {tabsToShow.map(({ key, label, icon: Icon }) => (
                    <TabsTrigger key={key} value={key} className="gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </TabsTrigger>
                  ))}
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

                  {/* Always use rich text editor */}
                  <div>
                    <Label>Content</Label>
                    <RichTextEditor
                      content={contentData.content}
                      onChange={handleRichContentChange}
                      placeholder="Start writing your content..."
                      className="min-h-[500px]"
                    />
                  </div>
                </TabsContent>

                {enableTables && (
                  <TabsContent value="tables" className="p-6">
                    <ComparisonTableBuilder
                      config={comparisonTableConfig}
                      onChange={handleTableConfigChange}
                      onSave={handleSaveTable}
                    />
                  </TabsContent>
                )}

                {enableSEO && (
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

                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          onClick={saveKeywords}
                          disabled={!contentId}
                          size="sm"
                        >
                          Save Keywords
                        </Button>
                        
                        {!contentId && (
                          <p className="text-xs text-muted-foreground">
                            Save content first to enable keyword updates
                          </p>
                        )}
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
                )}

                {enablePreview && (
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
                        dangerouslySetInnerHTML={{ 
                          __html: contentData.content && isMarkdown(contentData.content) 
                            ? markdownToHtml(contentData.content) 
                            : contentData.content || '' 
                        }}
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
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        {showSidebar && (
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
        )}
      </div>
    </div>
  );
}