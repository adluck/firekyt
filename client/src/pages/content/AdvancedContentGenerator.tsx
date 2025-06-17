import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wand2, Clock, CheckCircle, AlertCircle, Copy, Save, RefreshCw, Sparkles, Target, Megaphone, Users, FileText, Scale, Star, Video, MessageSquare, Mail, Edit3 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContentEditor from "@/components/content/ContentEditor";
import type { Site } from "@shared/schema";

interface ContentGenerationRequest {
  keyword: string;
  content_type: 'blog_post' | 'product_comparison' | 'review_article' | 'video_script' | 'social_post' | 'email_campaign';
  tone_of_voice: string;
  target_audience: string;
  additional_context?: string;
  brand_voice?: string;
  seo_focus?: boolean;
  word_count?: number;
  siteId?: number;
}

interface ContentGenerationResponse {
  content_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_text?: string;
  title?: string;
  seo_title?: string;
  seo_description?: string;
  meta_tags?: string[];
  estimated_reading_time?: number;
  ai_model_used?: string;
  generation_time_ms?: number;
  error?: string;
}

const CONTENT_TYPES = [
  { 
    value: 'blog_post', 
    label: 'Blog Post', 
    icon: 'FileText', 
    description: 'Comprehensive articles (800+ words)',
    color: 'text-blue-600 dark:text-blue-400'
  },
  { 
    value: 'product_comparison', 
    label: 'Product Comparison', 
    icon: 'Scale', 
    description: 'Feature comparisons and recommendations',
    color: 'text-green-600 dark:text-green-400'
  },
  { 
    value: 'review_article', 
    label: 'Review Article', 
    icon: 'Star', 
    description: 'In-depth product/service reviews',
    color: 'text-yellow-600 dark:text-yellow-400'
  },
  { 
    value: 'video_script', 
    label: 'Video Script', 
    icon: 'Video', 
    description: 'Engaging video content scripts',
    color: 'text-purple-600 dark:text-purple-400'
  },
  { 
    value: 'social_post', 
    label: 'Social Media Post', 
    icon: 'MessageSquare', 
    description: 'Short, punchy social content',
    color: 'text-pink-600 dark:text-pink-400'
  },
  { 
    value: 'email_campaign', 
    label: 'Email Campaign', 
    icon: 'Mail', 
    description: 'Marketing email content',
    color: 'text-orange-600 dark:text-orange-400'
  }
];

const TONE_PRESETS = [
  'Professional and authoritative',
  'Friendly and conversational',
  'Casual and approachable',
  'Technical and detailed',
  'Persuasive and sales-focused',
  'Educational and informative',
  'Humorous and entertaining',
  'Serious and formal'
];

const AUDIENCE_PRESETS = [
  'Beginners and newcomers',
  'Intermediate users',
  'Advanced professionals',
  'Decision makers and executives',
  'Budget-conscious consumers',
  'Premium market segment',
  'Tech-savvy millennials',
  'Gen Z digital natives',
  'Business owners',
  'Industry professionals'
];

export default function AdvancedContentGenerator() {
  const [formData, setFormData] = useState<ContentGenerationRequest>({
    keyword: '',
    content_type: 'blog_post',
    tone_of_voice: 'Professional and authoritative',
    target_audience: 'Beginners and newcomers',
    additional_context: '',
    brand_voice: '',
    seo_focus: true,
    word_count: 800,
    siteId: undefined
  });

  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<ContentGenerationResponse | null>(null);
  const [savedContent, setSavedContent] = useState<any>(null);
  const [databaseContentId, setDatabaseContentId] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ContentGenerationRequest) => {
      const response = await apiRequest("POST", "/api/content/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setActiveContentId(data.generationId);
      setDatabaseContentId(data.content.id); // Store the database content ID
      setIsPolling(true);
      setGenerationProgress(10);
      toast({
        title: "Content generation started",
        description: data.message || "Your request has been queued for processing",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save content mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // If we have a database content ID from AI generation, update the existing record
      if (databaseContentId) {
        const payload = {
          title: data.title,
          content: data.content,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          status: data.status || "draft"
        };
        const response = await apiRequest("PUT", `/api/content/${databaseContentId}`, payload);
        return response.json();
      } else {
        // Create new content if no existing record
        const payload = {
          title: data.title,
          content: data.content,
          contentType: formData.content_type,
          siteId: data.siteId || formData.siteId,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          targetKeywords: [formData.keyword],
          status: data.status || "draft"
        };
        const response = await apiRequest("POST", "/api/content", payload);
        return response.json();
      }
    },
    onSuccess: (data) => {
      setSavedContent(data);
      setShowEditor(false);
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Content saved successfully",
        description: "Your content has been saved to your library",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll for content status
  useEffect(() => {
    if (!isPolling || !activeContentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await apiRequest("GET", `/api/content/generation-status/${activeContentId}`);
        const result = await response.json();

        setGeneratedContent(result);

        if (result.status === 'processing') {
          setGenerationProgress(Math.min(generationProgress + 10, 90));
        } else if (result.status === 'completed') {
          setGenerationProgress(100);
          setIsPolling(false);
          toast({
            title: "Content generated successfully!",
            description: `Generated in ${result.generation_time_ms}ms using ${result.ai_model_used}`,
          });
        } else if (result.status === 'failed') {
          setIsPolling(false);
          setGenerationProgress(0);
          toast({
            title: "Generation failed",
            description: result.error || "Unknown error occurred",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isPolling, activeContentId, generationProgress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keyword.trim()) {
      toast({
        title: "Keyword required",
        description: "Please enter a primary keyword for content generation",
        variant: "destructive",
      });
      return;
    }

    // Reset state for new generation
    setGeneratedContent(null);
    setSavedContent(null);
    setDatabaseContentId(null);
    setShowEditor(false);
    setActiveContentId(null);

    generateMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-screen flex flex-col p-4 space-y-4">
      {showEditor && generatedContent ? (
        <ContentEditor
          generatedContent={generatedContent}
          onSave={saveMutation.mutate}
          onClose={() => setShowEditor(false)}
          isLoading={saveMutation.isPending}
        />
      ) : (
        <>
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">AI Content Generator</h1>
              <Badge variant="secondary">Advanced Engine</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2"
                disabled={!generatedContent}
              >
                <Edit3 className="h-4 w-4" />
                Content Editor
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditor(true);
                  setGeneratedContent({
                    content_id: "test-123",
                    status: "completed",
                    generated_text: "# Test Content\n\nThis is a **test** content with *italic* text.\n\n## Subheading\n\n- List item 1\n- List item 2\n\n### Features\n\n1. Bold formatting\n2. Italic formatting\n3. Headers\n4. Lists",
                    title: "Test Article",
                    seo_title: "Test SEO Title",
                    seo_description: "This is a test SEO description",
                    meta_tags: ["test", "content", "editor"],
                    ai_model_used: "gemini-pro",
                    generation_time_ms: 1500
                  });
                }}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Test Editor
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
            {/* Content Generation Form */}
            <Card className="lg:col-span-2 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <span>Content Specification</span>
                </CardTitle>
                <CardDescription>
                  Configure your AI-powered content generation with advanced parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
                  {/* Primary Keyword */}
                  <div className="space-y-2">
                    <Label htmlFor="keyword" className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>Primary Keyword *</span>
                    </Label>
                    <Input
                      id="keyword"
                      value={formData.keyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
                      placeholder="e.g., best wireless headphones 2024"
                      required
                    />
                  </div>

                  {/* Content Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Content Type</Label>
                    <Select value={formData.content_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, content_type: value }))}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        className="py-3 px-4 cursor-pointer hover:bg-accent/50 focus:bg-accent/80"
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className={`p-2 rounded-lg bg-accent/20 ${type.color}`}>
                            {type.icon === 'FileText' && <FileText className="h-4 w-4" />}
                            {type.icon === 'Scale' && <Scale className="h-4 w-4" />}
                            {type.icon === 'Star' && <Star className="h-4 w-4" />}
                            {type.icon === 'Video' && <Video className="h-4 w-4" />}
                            {type.icon === 'MessageSquare' && <MessageSquare className="h-4 w-4" />}
                            {type.icon === 'Mail' && <Mail className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-foreground text-left">{type.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-left">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tone of Voice */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Megaphone className="h-4 w-4" />
                  <span>Tone of Voice</span>
                </Label>
                <Select value={formData.tone_of_voice} onValueChange={(value) => setFormData(prev => ({ ...prev, tone_of_voice: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_PRESETS.map((tone) => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Target Audience</span>
                </Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_PRESETS.map((audience) => (
                      <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site Selection */}
              {sites.length > 0 && (
                <div className="space-y-2">
                  <Label>Target Site (Optional)</Label>
                  <Select value={formData.siteId?.toString() || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, siteId: value === "none" ? undefined : parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a site or leave empty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific site</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Advanced Options */}
              <div className="space-y-4 p-4 border rounded-lg">
                <Label className="text-sm font-medium">Advanced Options</Label>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-focus" className="text-sm">SEO Optimization</Label>
                  <Switch
                    id="seo-focus"
                    checked={formData.seo_focus}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, seo_focus: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="word-count">Target Word Count</Label>
                  <Input
                    id="word-count"
                    type="number"
                    min="100"
                    max="3000"
                    value={formData.word_count || 800}
                    onChange={(e) => setFormData(prev => ({ ...prev, word_count: parseInt(e.target.value) || 800 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-voice">Brand Voice (Optional)</Label>
                  <Input
                    id="brand-voice"
                    value={formData.brand_voice || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_voice: e.target.value }))}
                    placeholder="e.g., Innovative, customer-focused, trustworthy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Additional Context</Label>
                  <Textarea
                    id="context"
                    value={formData.additional_context || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_context: e.target.value }))}
                    placeholder="Any specific requirements, competitor mentions, or additional guidelines..."
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={generateMutation.isPending || isPolling}
              >
                {generateMutation.isPending || isPolling ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate AI Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generation Status & Results */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Generation Status</CardTitle>
            <CardDescription>
              Real-time status of your content generation request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            {isPolling && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            )}

            {generatedContent && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(generatedContent.status)}
                  <Badge className={getStatusColor(generatedContent.status)}>
                    {generatedContent.status.toUpperCase()}
                  </Badge>
                  {generatedContent.ai_model_used && (
                    <Badge variant="outline">
                      {generatedContent.ai_model_used}
                    </Badge>
                  )}
                </div>

                {generatedContent.status === 'completed' && generatedContent.generated_text && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <Tabs defaultValue="content" className="w-full flex-1 flex flex-col">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="seo">SEO Data</TabsTrigger>
                        <TabsTrigger value="meta">Metadata</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content" className="space-y-4 flex-1 flex flex-col">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Generated Title</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(generatedContent.title || '')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm">{generatedContent.title}</p>
                          </div>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Generated Content</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(generatedContent.generated_text || '')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-4 bg-muted rounded-md flex-1 overflow-y-auto min-h-[500px]">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({children}) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-lg font-semibold mt-6 mb-3">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-md font-medium mt-4 mb-2">{children}</h3>,
                                  p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                                  ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                  ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                  li: ({children}) => <li className="ml-2">{children}</li>,
                                  strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                                  a: ({children, href}) => <a href={href} className="text-primary underline hover:text-primary/80">{children}</a>,
                                  code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
                                  blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
                                }}
                              >
                                {(() => {
                                  const rawText = generatedContent.generated_text || '';
                                  
                                  // First check if the raw text looks like JSON (starts with { and ends with })
                                  if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
                                    try {
                                      const parsed = JSON.parse(rawText);
                                      
                                      // If we successfully parsed JSON and have a content field
                                      if (parsed && typeof parsed === 'object' && parsed.content) {
                                        // Check if content already starts with the title to avoid duplication
                                        const content = parsed.content;
                                        const title = parsed.title;
                                        
                                        if (title && content && !content.startsWith(`# ${title}`)) {
                                          return `# ${title}\n\n${content}`;
                                        }
                                        return content;
                                      }
                                    } catch (error) {
                                      // JSON parsing failed, fall through to show raw text
                                    }
                                  }
                                  
                                  // If not JSON or parsing failed, show as-is (might be plain markdown)
                                  return rawText;
                                })()}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="seo" className="space-y-4">
                        {(() => {
                          try {
                            const parsed = JSON.parse(generatedContent.generated_text || '{}');
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">SEO Title</Label>
                                  <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm">{parsed.seo_title || generatedContent.seo_title || 'Not available'}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">SEO Description</Label>
                                  <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm">{parsed.seo_description || generatedContent.seo_description || 'Not available'}</p>
                                  </div>
                                </div>

                                {(parsed.meta_tags || generatedContent.meta_tags) && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Meta Tags</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {((parsed.meta_tags || generatedContent.meta_tags || []) as string[]).map((tag: string, index: number) => (
                                        <Badge key={index} variant="secondary">{tag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          } catch {
                            return (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">SEO Title</Label>
                                  <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm">{generatedContent.seo_title || 'Not available'}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">SEO Description</Label>
                                  <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm">{generatedContent.seo_description || 'Not available'}</p>
                                  </div>
                                </div>

                                {generatedContent.meta_tags && generatedContent.meta_tags.length > 0 && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Meta Tags</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {generatedContent.meta_tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary">{tag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          }
                        })()}
                      </TabsContent>

                      <TabsContent value="meta" className="space-y-4">
                        {(() => {
                          try {
                            const parsed = JSON.parse(generatedContent.generated_text || '{}');
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="font-medium">Content ID</Label>
                                  <p className="text-muted-foreground">{generatedContent.content_id}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">AI Model</Label>
                                  <p className="text-muted-foreground">{generatedContent.ai_model_used}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Generation Time</Label>
                                  <p className="text-muted-foreground">{generatedContent.generation_time_ms}ms</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Reading Time</Label>
                                  <p className="text-muted-foreground">
                                    {parsed.estimated_reading_time || generatedContent.estimated_reading_time || 'N/A'} min
                                  </p>
                                </div>
                              </div>
                            );
                          } catch {
                            return (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="font-medium">Content ID</Label>
                                  <p className="text-muted-foreground">{generatedContent.content_id}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">AI Model</Label>
                                  <p className="text-muted-foreground">{generatedContent.ai_model_used}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Generation Time</Label>
                                  <p className="text-muted-foreground">{generatedContent.generation_time_ms}ms</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Reading Time</Label>
                                  <p className="text-muted-foreground">{generatedContent.estimated_reading_time} min</p>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </TabsContent>
                    </Tabs>

                    <Separator />

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowEditor(true)}
                        variant="default"
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Content
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(generatedContent.generated_text || '')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy All
                      </Button>
                    </div>
                  </div>
                )}

                {generatedContent.status === 'failed' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {generatedContent.error || 'Content generation failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!generatedContent && !isPolling && (
              <div className="text-center py-8 text-muted-foreground">
                <Wand2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Configure your content settings and click "Generate AI Content" to begin</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>

      {savedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Content Saved Successfully!</CardTitle>
            <CardDescription>
              Your generated content has been saved to your site and is ready for publication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Title</Label>
                <p className="text-muted-foreground">{savedContent.title}</p>
              </div>
              <div>
                <Label className="font-medium">Content Type</Label>
                <p className="text-muted-foreground">{savedContent.contentType}</p>
              </div>
              <div>
                <Label className="font-medium">Created</Label>
                <p className="text-muted-foreground">{new Date(savedContent.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="font-medium">Site ID</Label>
                <p className="text-muted-foreground">{savedContent.siteId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}