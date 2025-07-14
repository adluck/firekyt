import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OnboardingProgress } from './OnboardingProgress';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/useOnboarding';
import { apiRequest } from '@/lib/queryClient';
import { Zap, Sparkles, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

export function GenerateContentStep() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { completeOnboardingStep } = useOnboarding();
  
  const [formData, setFormData] = useState({
    topic: '',
    contentType: '',
    keywords: '',
    description: ''
  });

  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Get user's sites to find the most recent one for onboarding
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
    queryFn: () => apiRequest('GET', '/api/sites'),
  });

  // Get the most recently added site for onboarding
  const getOnboardingSiteId = () => {
    // Check if sites exists and is an array
    if (!sites || !Array.isArray(sites) || sites.length === 0) {
      console.log('🔍 No sites available or sites is not an array:', sites);
      return null;
    }
    
    // Return the most recently created site (highest ID)
    const sortedSites = [...sites].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const siteId = sortedSites[0]?.id || null;
    console.log('🔍 Selected site ID for onboarding:', siteId);
    return siteId;
  };

  const generateContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/content/generate', data);
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('🔍 Generate Content Response:', data);
      
      // If content generation is in progress, poll for completion
      if (data.content?.content === "Content generation in progress" && data.content?.id) {
        pollForContent(data.content.id);
        return;
      }
      
      // Extract the actual content text from the response
      let contentText = '';
      
      // Try different possible response structures
      if (data.content?.content) {
        contentText = data.content.content;
      } else if (data.content && typeof data.content === 'string') {
        contentText = data.content;
      } else if (data.generated_text) {
        contentText = data.generated_text;
      } else if (data.generatedText) {
        contentText = data.generatedText;
      }
      
      // If content is still a JSON string, try to parse it
      if (contentText && typeof contentText === 'string' && contentText.startsWith('{')) {
        try {
          const parsed = JSON.parse(contentText);
          contentText = parsed.content || parsed.generated_text || parsed.text || contentText;
        } catch (e) {
          console.log('Content not JSON, using as-is');
        }
      }
      
      console.log('🔍 Extracted Content Text:', contentText);
      
      // Only set content if it's not a placeholder
      if (contentText && contentText !== "Content generation in progress") {
        setGeneratedContent(contentText);
        toast({
          title: "Content Generated!",
          description: "Your AI-powered content is ready. Review and save it to continue.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const saveContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/content', data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Mark step as complete
      await completeOnboardingStep(2);
      
      toast({
        title: "Content Saved!",
        description: "Your content has been saved. Let's publish it next.",
      });
      
      // Navigate to next step
      navigate('/onboarding/publish');
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: "There was an error saving your content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    // Map content types to API expected values
    const contentTypeMap: { [key: string]: string } = {
      'product-review': 'review_article',
      'comparison': 'product_comparison',
      'buying-guide': 'blog_post',
      'blog-post': 'blog_post',
      'listicle': 'blog_post'
    };

    generateContentMutation.mutate({
      keyword: formData.topic,
      content_type: contentTypeMap[formData.contentType] || 'blog_post',
      tone_of_voice: 'professional and engaging',
      target_audience: 'affiliate marketing audience',
      additional_context: formData.description || '',
      brand_voice: 'informative and trustworthy',
      seo_focus: true,
      word_count: 800
    });
  };

  const handleSave = () => {
    if (generatedContent) {
      // Map content types to API expected values
      const contentTypeMap: { [key: string]: string } = {
        'product-review': 'review_article',
        'comparison': 'product_comparison',
        'buying-guide': 'blog_post',
        'blog-post': 'blog_post',
        'listicle': 'blog_post'
      };

      const siteId = getOnboardingSiteId();
      console.log('🔍 Saving content to site ID:', siteId);

      saveContentMutation.mutate({
        title: formData.topic,
        content: generatedContent,
        contentType: contentTypeMap[formData.contentType] || 'blog_post',
        targetKeywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
        status: 'draft',
        seoTitle: formData.topic,
        seoDescription: `${formData.topic} - AI-generated content`,
        siteId: siteId // Save to the user's connected site
      });
    }
  };

  const handleBack = () => {
    navigate('/onboarding/connect');
  };

  const handleSkip = () => {
    navigate('/onboarding/publish');
  };

  // Poll for content completion
  const pollForContent = async (contentId: number) => {
    setIsPolling(true);
    console.log('🔍 Starting to poll for content:', contentId);
    
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPolling(false);
        toast({
          title: "Generation Timeout",
          description: "Content generation is taking longer than expected. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const response = await apiRequest('GET', `/api/content/${contentId}`);
        const contentData = await response.json();
        
        console.log('🔍 Polling attempt', attempts + 1, ':', contentData);
        
        if (contentData.content && contentData.content !== "Content generation in progress") {
          // Content is ready
          let finalContent = contentData.content;
          
          // Parse JSON if needed
          if (typeof finalContent === 'string' && finalContent.startsWith('{')) {
            try {
              const parsed = JSON.parse(finalContent);
              finalContent = parsed.content || parsed.generated_text || parsed.text || finalContent;
            } catch (e) {
              console.log('Content not JSON, using as-is');
            }
          }
          
          console.log('🔍 Final Content Ready:', finalContent);
          setGeneratedContent(finalContent);
          setIsPolling(false);
          
          toast({
            title: "Content Generated!",
            description: "Your AI-powered content is ready. Review and save it to continue.",
          });
          return;
        }
        
        // Still generating, wait and try again
        attempts++;
        setTimeout(poll, 1000); // Wait 1 second before next attempt
        
      } catch (error) {
        console.error('Polling error:', error);
        setIsPolling(false);
        toast({
          title: "Generation Error",
          description: "There was an error checking content status. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <OnboardingProgress currentStep={2} totalSteps={3} />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Generate Your First Content</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Create AI-powered affiliate content that converts visitors into customers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Content Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Content Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Best Gaming Laptops 2024"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product-review">Product Review</SelectItem>
                    <SelectItem value="comparison">Product Comparison</SelectItem>
                    <SelectItem value="buying-guide">Buying Guide</SelectItem>
                    <SelectItem value="blog-post">Blog Post</SelectItem>
                    <SelectItem value="listicle">Listicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Target Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., gaming laptop, best laptop, gaming gear"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  placeholder="Any specific requirements or focus areas..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={!formData.topic || !formData.contentType || generateContentMutation.isPending || isPolling}
                className="w-full"
                size="lg"
              >
                {generateContentMutation.isPending || isPolling ? "Generating..." : "Generate Content"}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Generated Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  {/* Content Preview */}
                  <div className="bg-muted/50 border rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div 
                        className="whitespace-pre-wrap text-sm leading-relaxed"
                        style={{ 
                          fontFamily: 'inherit',
                          lineHeight: '1.6',
                          color: 'inherit'
                        }}
                      >
                        {typeof generatedContent === 'string' ? generatedContent : String(generatedContent)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded">
                    <span>✨ AI-Generated Content Ready</span>
                    <span>{typeof generatedContent === 'string' ? `${generatedContent.split(' ').length} words` : 'Content generated'}</span>
                  </div>
                  
                  <Button 
                    onClick={handleSave}
                    disabled={saveContentMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {saveContentMutation.isPending ? "Saving..." : "Save & Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : isPolling ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="font-medium">AI is generating your content...</p>
                  <p className="text-sm mt-2">This may take up to 30 seconds</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your generated content will appear here</p>
                  <p className="text-sm mt-2">Fill out the form and click "Generate Content" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={handleBack} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button variant="ghost" onClick={handleSkip} size="lg">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}