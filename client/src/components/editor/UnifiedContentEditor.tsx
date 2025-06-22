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
import { ComparisonTableRenderer } from '@/components/editor/ComparisonTableRenderer';
import { KeywordModal } from '@/components/editor/KeywordModal';
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
    ...initialContent, // This will override siteId if provided
  });
  
  // Debug log the initial siteId
  console.log('🔍 UnifiedContentEditor initialized with siteId:', contentData.siteId);
  console.log('🔍 Initial content passed:', initialContent);
  
  // Effect to update contentData when initialContent changes (for live updates)
  useEffect(() => {
    if (initialContent) {
      console.log('🔍 initialContent changed, updating contentData:', initialContent);
      console.log('🔍 Setting siteId to:', initialContent.siteId);
      setContentData(prev => ({
        ...prev,
        ...initialContent,
        // Ensure siteId is properly updated
        siteId: initialContent.siteId !== undefined ? initialContent.siteId : prev.siteId
      }));
    }
  }, [initialContent]);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'tables' | 'seo' | 'preview'>('editor');
  const [comparisonTableConfig, setComparisonTableConfig] = useState<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Fetch products for table data population
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
  });

  // Listen for tab switching events from table builder
  useEffect(() => {
    const handleSwitchToEditor = () => {
      setActiveTab('editor');
    };

    window.addEventListener('switchToEditor', handleSwitchToEditor);
    return () => {
      window.removeEventListener('switchToEditor', handleSwitchToEditor);
    };
  }, []);

  // Handle table insertion from table builder
  const handleTableInsertion = (tableConfig: any) => {
    if (editorInstance) {
      console.log('Inserting table with editor instance:', editorInstance);
      
      try {
        // Build complete HTML table with product data
        let tableHtml = '';
        
        // Add title if provided
        if (tableConfig.name) {
          tableHtml += `<h3>${tableConfig.name}</h3>`;
        }
        
        // Add description if provided
        if (tableConfig.description) {
          tableHtml += `<p>${tableConfig.description}</p>`;
        }
        
        // Apply styling configuration
        const { styling } = tableConfig;
        let tableClass = 'border-collapse border border-border w-full my-4';
        let cellClass = 'border border-border px-4 py-2';
        let headerClass = 'border border-border px-4 py-2 font-semibold';
        
        // Apply header background color via data attribute and dynamic CSS
        const applyHeaderColor = (color: string) => {
          if (!color || color === '#f8f9fa') {
            return { attribute: '', value: '' };
          }
          
          // Create a unique identifier for this color
          const colorHash = color.replace('#', '').toLowerCase();
          
          // Inject CSS using data attributes (TipTap preserves these better)
          const styleId = `table-header-style-${colorHash}`;
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
              .ProseMirror table[data-header-color="${colorHash}"] th,
              .dark .ProseMirror table[data-header-color="${colorHash}"] th {
                background-color: ${color} !important;
                color: white !important;
              }
            `;
            document.head.appendChild(style);
            console.log('🎨 Injected CSS with data attribute:', style.textContent);
          }
          
          return { attribute: 'data-header-color', value: colorHash };
        };
        
        // Add header color styling to table
        console.log('🎨 Header styling - headerBg:', styling.headerBg);
        const headerColorData = applyHeaderColor(styling.headerBg);
        
        let tableAttributes = '';
        if (headerColorData.attribute && headerColorData.value) {
          tableAttributes = ` ${headerColorData.attribute}="${headerColorData.value}"`;
          console.log('🎨 Applied data attribute:', tableAttributes);
        } else {
          headerClass += ' bg-muted';
          console.log('🎨 Using default muted header');
        }
        
        // Apply border styling
        if (styling.borderStyle === 'none') {
          tableClass = tableClass.replace('border border-border', '');
          cellClass = cellClass.replace('border border-border ', '');
          headerClass = headerClass.replace('border border-border ', '');
        } else if (styling.borderStyle === 'medium') {
          tableClass = tableClass.replace('border border-border', 'border-2 border-border');
          cellClass = cellClass.replace('border border-border', 'border-2 border-border');
          headerClass = headerClass.replace('border border-border', 'border-2 border-border');
        } else if (styling.borderStyle === 'heavy') {
          tableClass = tableClass.replace('border border-border', 'border-4 border-border');
          cellClass = cellClass.replace('border border-border', 'border-4 border-border');
          headerClass = headerClass.replace('border border-border', 'border-4 border-border');
        }
        
        // Apply compact styling
        if (styling.compact) {
          cellClass = cellClass.replace('px-4 py-2', 'px-2 py-1');
          headerClass = headerClass.replace('px-4 py-2', 'px-2 py-1');
        }
        
        // Start table with styling and data attributes
        tableHtml += `<table class="${tableClass}"${tableAttributes}>`;
        
        // Header row with custom styling
        if (tableConfig.settings.showHeader) {
          tableHtml += '<thead><tr>';
          tableConfig.columns.forEach((col: any) => {
            tableHtml += `<th class="${headerClass}">${col.name}</th>`;
          });
          tableHtml += '</tr></thead>';
        }
        
        // Data rows
        tableHtml += '<tbody>';
        tableConfig.rows.forEach((row: any, rowIndex: number) => {
          const product = products.find(p => p.id === row.productId);
          
          // Apply alternating row styling
          let rowClass = '';
          if (styling.alternateRows && rowIndex % 2 === 1) {
            rowClass = ' class="bg-muted/50"';
          }
          
          tableHtml += `<tr${rowClass}>`;
          
          tableConfig.columns.forEach((col: any) => {
            let cellContent = '';
            
            if (row.customData && row.customData[col.id]) {
              cellContent = row.customData[col.id];
            } else if (product && col.productField) {
              if (col.productField === 'title') {
                cellContent = product.title;
              } else if (col.productField === 'price') {
                cellContent = `$${product.price}`;
              } else if (col.productField === 'rating') {
                cellContent = `${product.rating} ⭐`;
              } else {
                cellContent = product[col.productField] || '';
              }
            }
            
            tableHtml += `<td class="${cellClass}">${cellContent}</td>`;
          });
          
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        console.log('Generated table HTML:', tableHtml);
        
        // Get current content
        const currentContent = editorInstance.getHTML();
        console.log('Current content:', currentContent);
        
        // Append table to current content or replace if empty
        const newContent = currentContent === '<p></p>' ? tableHtml : currentContent + tableHtml;
        
        // Update the content data state directly
        setContentData(prev => ({
          ...prev,
          richContent: newContent,
          content: newContent
        }));
        
        // Set editor content
        editorInstance.commands.setContent(newContent);
        
        console.log('Table insertion completed with content:', newContent);
        setActiveTab('editor');
        return true;
        
      } catch (error) {
        console.error('Failed to insert table:', error);
        return false;
      }
    } else {
      console.log('No editor instance available');
      return false;
    }
  };
  
  // Use contentData.targetKeywords as the single source of truth for keywords
  const currentKeywords = contentData.targetKeywords || [];

  // Fetch existing content if editing
  const { data: existingContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content', contentId],
    enabled: !!contentId && mode === 'edit',
  });

  // Fetch user sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Set default siteId when sites are loaded (only if no initialContent siteId)
  useEffect(() => {
    if (sites.length > 0 && contentData.siteId === 0 && !initialContent?.siteId) {
      setContentData(prev => ({ ...prev, siteId: sites[0].id }));
    }
  }, [sites, contentData.siteId, initialContent?.siteId]);

  // Load existing content data - track if keywords have been manually updated
  const [keywordsManuallyUpdated, setKeywordsManuallyUpdated] = useState(false);
  
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
        // Only update keywords if they haven't been manually updated
        targetKeywords: keywordsManuallyUpdated ? prevData.targetKeywords : (contentWithKeywords.targetKeywords || []),
        comparisonTables: contentWithKeywords.comparisonTables || null,
      }));
      setComparisonTableConfig(contentWithKeywords.comparisonTables || null);
    }
  }, [initialContent, keywordsManuallyUpdated]);

  // Handle keyword updates from KeywordManager - single source of truth
  const handleKeywordsUpdate = (newKeywords: string[]) => {
    console.log('🔍 UNIFIED handleKeywordsUpdate called with:', newKeywords);
    console.log('🔍 UNIFIED Current keywords before update:', currentKeywords);
    
    // Mark keywords as manually updated to prevent overwriting on page loads
    setKeywordsManuallyUpdated(true);
    
    // Update only the contentData - currentKeywords will automatically reflect this change
    setContentData(prev => ({ 
      ...prev, 
      targetKeywords: [...newKeywords] 
    }));
    
    console.log('🔍 UNIFIED Keywords updated, should trigger re-render');
  };

  // Quick Actions handlers
  const handleAddAffiliateLinks = () => {
    // Show loading state
    toast({
      title: 'Opening Link Inserter',
      description: 'Saving content and preparing affiliate tools...',
    });
    
    // Save current content first, then navigate to link inserter
    if (contentData.content && contentData.title) {
      defaultSaveMutation.mutate(contentData, {
        onSuccess: () => {
          // Use wouter's useLocation hook for navigation
          window.history.pushState({}, '', '/links/inserter');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      });
    } else {
      // Use wouter's useLocation hook for navigation
      window.history.pushState({}, '', '/links/inserter');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleSEOAnalysis = () => {
    setActiveTab('seo');
  };

  const handleSchedulePost = () => {
    updateContentData({ status: 'scheduled' });
    toast({
      title: 'Post scheduled',
      description: 'Content status updated to scheduled',
    });
  };

  // Default save mutation
  const defaultSaveMutation = useMutation({
    mutationFn: async (data: ContentData) => {
      // Always use default API save behavior - the onSave should handle its own mutation
      const isUpdate = contentId && mode === 'edit';
      const url = saveEndpoint || (isUpdate ? `/api/content/${contentId}` : '/api/content');
      const method = customSaveMethod || (isUpdate ? 'PATCH' : 'POST');
      
      // Ensure siteId is included in the request data
      const requestData = {
        ...data,
        siteId: data.siteId || null
      };
      
      console.log('UnifiedContentEditor API call with siteId:', requestData.siteId);
      console.log('UnifiedContentEditor full requestData:', requestData);
      const response = await apiRequest(method, url, requestData);
      const result = await response.json();
      
      // Call onSave after successful API call if provided
      if (onSave) {
        await onSave(data);
      }
      
      // State will be updated in onSuccess callback
      
      return result;
    },
    onSuccess: async (result) => {
      console.log('🔍 FRONTEND onSuccess called with result:', JSON.stringify(result));
      console.log('🔍 FRONTEND targetKeywords from response:', JSON.stringify(result?.targetKeywords));
      console.log('🔍 FRONTEND siteId from response:', result?.siteId);
      
      // Update the contentData state to reflect the saved siteId with a brief delay to ensure visibility
      if (result?.siteId !== undefined) {
        console.log('🔍 FRONTEND Updating dropdown to show saved siteId:', result.siteId);
        
        // Add a small delay to make the update more visible
        setTimeout(() => {
          setContentData(prev => ({
            ...prev,
            siteId: result.siteId
          }));
        }, 200);
      }
      
      console.log('🔍 FRONTEND Save successful, server returned siteId:', result?.siteId);
      
      toast({
        title: 'Content saved',
        description: contentId ? 'Content updated successfully' : 'New content created successfully',
      });
      
      // Invalidate all content-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      // Invalidate site-specific content queries
      if (result?.siteId) {
        queryClient.invalidateQueries({ queryKey: [`/api/content/site/${result.siteId}`] });
      }
      
      // Invalidate any query that contains 'content' to ensure comprehensive cache clearing
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey.some(key => 
            typeof key === 'string' && key.includes('content')
          );
        }
      });
      
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
    console.log('🔍 updateContentData called with:', updates);
    setContentData(prev => {
      const newData = { ...prev, ...updates };
      console.log('🔍 Previous contentData.siteId:', prev.siteId);
      console.log('🔍 New contentData.siteId:', newData.siteId);
      return newData;
    });
    
    // Force re-render and re-apply link styles after content update
    setTimeout(() => {
      const previewElement = document.querySelector('.content-updated');
      if (previewElement) {
        const links = previewElement.querySelectorAll('a');
        links.forEach(link => {
          (link as HTMLElement).style.color = 'rgb(37 99 235)';
          (link as HTMLElement).style.textDecoration = 'underline';
          (link as HTMLElement).style.fontWeight = '500';
        });
      }
    }, 100);
  };

  const handleRichContentChange = (content: string) => {
    console.log('🔄 handleRichContentChange called with:', content);
    console.log('🔄 Current contentData.content:', contentData.content);
    
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

  const handleInsertTable = () => {
    if (comparisonTableConfig && window.editor) {
      // Insert the comparison table into the rich text editor
      window.editor.chain().focus().insertComparisonTable(comparisonTableConfig).run();
      toast({
        title: 'Table inserted',
        description: 'Comparison table has been added to your content',
      });
    }
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
      targetKeywords: currentKeywords || [],
      siteId: contentData.siteId > 0 ? contentData.siteId : null, // Properly handle siteId
    };

    console.log('Saving content with keywords:', dataToSave.targetKeywords);
    console.log('Full data being saved:', dataToSave);
    console.log('SiteId being saved:', dataToSave.siteId);
    console.log('Original contentData.siteId:', contentData.siteId);

    defaultSaveMutation.mutate(dataToSave);
  };

  const handlePublish = () => {
    if (!handleValidation()) return;

    const dataToSave = {
      ...contentData,
      status: 'published',
      targetKeywords: currentKeywords || [],
      siteId: contentData.siteId > 0 ? contentData.siteId : null, // Properly handle siteId
    };

    console.log('Publishing content with keywords:', dataToSave.targetKeywords);
    console.log('Full data being published:', dataToSave);
    console.log('SiteId being published:', dataToSave.siteId);
    console.log('Original contentData.siteId:', contentData.siteId);

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
                      onEditorReady={setEditorInstance}
                    />
                  </div>
                </TabsContent>

                {enableTables && (
                  <TabsContent value="tables" className="p-6">
                    <ComparisonTableBuilder
                      config={comparisonTableConfig}
                      onChange={handleTableConfigChange}
                      onSave={handleSaveTable}
                      onInsertTable={handleTableInsertion}
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

                      <div className="space-y-2">
                        <Label>SEO Keywords</Label>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {currentKeywords && currentKeywords.length > 0 ? (
                              currentKeywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No keywords added</span>
                            )}
                          </div>
                          <KeywordModal
                            contentId={contentId ? (typeof contentId === 'string' ? parseInt(contentId) : contentId) : null}
                            currentKeywords={currentKeywords}
                            onUpdate={handleKeywordsUpdate}
                          />
                        </div>
                      </div>
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
                          {currentKeywords && currentKeywords.length > 0 && (
                            <span>Keywords: {currentKeywords.length}</span>
                          )}
                        </div>
                      </div>

                      <div 
                        className="prose max-w-none prose-table:border-collapse prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-a:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 content-updated"
                        dangerouslySetInnerHTML={{ 
                          __html: contentData.content && isMarkdown(contentData.content) 
                            ? markdownToHtml(contentData.content) 
                            : contentData.content || '' 
                        }}
                        ref={(el) => {
                          if (el) {
                            // Force reapply styles to all links after content update
                            const links = el.querySelectorAll('a');
                            links.forEach(link => {
                              link.style.color = 'rgb(37 99 235)';
                              link.style.textDecoration = 'underline';
                              link.style.fontWeight = '500';
                            });
                          }
                        }}
                      />



                      {currentKeywords && currentKeywords.length > 0 && (
                        <div className="mt-8">
                          <h2 className="text-xl font-semibold mb-4">SEO Keywords</h2>
                          <div className="flex flex-wrap gap-2">
                            {currentKeywords.map((keyword, index) => (
                              <Badge key={`preview-${keyword}-${index}`} variant="outline">
                                {keyword}
                              </Badge>
                            ))}
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
                    key={`site-select-${contentData.siteId}-${Date.now()}`}
                    value={contentData.siteId && contentData.siteId > 0 ? contentData.siteId.toString() : ""}
                    onValueChange={(value) => {
                      const newSiteId = parseInt(value) || null;
                      console.log('🔍 Target site dropdown changed to:', newSiteId);
                      console.log('🔍 Current contentData.siteId before change:', contentData.siteId);
                      console.log('🔍 Available sites:', sites.map(s => ({ id: s.id, name: s.name })));
                      
                      updateContentData({ siteId: newSiteId });
                    }}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {sites.find(s => s.id === contentData.siteId)?.name || 'None'} (ID: {contentData.siteId})
                  </p>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleAddAffiliateLinks}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Add Affiliate Links
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleSEOAnalysis}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  SEO Analysis
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleSchedulePost}
                >
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