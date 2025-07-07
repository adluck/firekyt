import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Plus, 
  Eye, 
  Copy, 
  Download, 
  Trash2, 
  Calendar,
  Target,
  Search,
  Filter,
  Image,
  Type,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface AdCopyCampaign {
  id: number;
  name: string;
  productName: string;
  productCategory: string;
  targetAudience: string;
  brandVoice: string;
  campaignGoal: string;
  affiliateUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MyAds() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [filterVoice, setFilterVoice] = useState<string>('all');
  const [generatedGraphics, setGeneratedGraphics] = useState<any[]>([]);
  const [isGeneratingReal, setIsGeneratingReal] = useState(false);
  const [realGraphics, setRealGraphics] = useState<any[]>([]);
  const [customGraphics, setCustomGraphics] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const campaignId = params.id ? parseInt(params.id) : null;

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ['/api/ad-copy-campaigns'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ad-copy-campaigns');
      const data = await response.json();
      return data.campaigns as AdCopyCampaign[];
    },
    enabled: !campaignId // Only fetch campaigns list when not viewing individual campaign
  });

  const { data: campaignDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/api/ad-copy-campaigns', campaignId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ad-copy-campaigns/${campaignId}`);
      const data = await response.json();
      return data;
    },
    enabled: !!campaignId // Only fetch when we have a campaign ID
  });

  const handleViewCampaign = (campaignId: number) => {
    navigate(`/my-ads/${campaignId}`);
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCSV = (campaign: AdCopyCampaign) => {
    const csvContent = `Campaign Name,Product Name,Target Audience,Brand Voice,Campaign Goal,Affiliate URL,Created Date
"${campaign.name}","${campaign.productName}","${campaign.targetAudience}","${campaign.brandVoice}","${campaign.campaignGoal}","${campaign.affiliateUrl}","${new Date(campaign.createdAt).toLocaleDateString()}"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${campaign.productName}_campaign.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Campaign data downloaded as CSV",
    });
  };



  const handleGenerateGraphics = async (campaign: any) => {
    try {
      toast({
        title: "Generating Graphics",
        description: "Creating social media graphics with text overlays...",
      });

      const platforms = ['instagram_post', 'instagram_story', 'facebook_post', 'pinterest_pin'];
      const graphics = [];
      
      for (const platform of platforms) {
        const response = await apiRequest('POST', '/api/generate-text-overlay', {
          text: campaign.productName,
          platform,
          style: 'bold',
          position: 'center',
          fontSize: 48,
          textColor: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          opacity: 0.8
        });
        
        const result = await response.json();
        if (result.success && result.graphicUrl) {
          graphics.push({
            platform,
            url: result.graphicUrl,
            text: campaign.productName,
            dimensions: getPlatformDimensions(platform)
          });
        }
      }

      setGeneratedGraphics(graphics);
      
      toast({
        title: "Graphics Generated!",
        description: `Successfully created ${graphics.length} graphics for ${platforms.length} platforms`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate graphics",
        variant: "destructive",
      });
    }
  };

  const handleGenerateRealGraphics = async (campaign: any) => {
    setIsGeneratingReal(true);
    try {
      toast({
        title: "Generating AI Graphics",
        description: "Creating professional product graphics using AI...",
      });

      const platforms = ['instagram_post', 'instagram_story', 'facebook_post', 'pinterest_pin'];
      
      const response = await apiRequest('POST', '/api/generate-real-graphics', {
        productName: campaign.productName,
        platforms
      });
      
      const result = await response.json();
      if (result.success) {
        const successfulGraphics = result.graphics.filter((g: any) => g.success);
        setRealGraphics(successfulGraphics);
        
        toast({
          title: "AI Graphics Generated!",
          description: `Successfully created ${successfulGraphics.length} professional graphics`,
        });
      } else {
        throw new Error('Failed to generate AI graphics');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI graphics",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReal(false);
    }
  };

  const handleCustomGraphicsUpload = async (files: FileList, platform: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('platform', platform);
      formData.append('campaignId', campaignId?.toString() || '');

      // Use apiRequest which handles authentication properly
      const response = await apiRequest('POST', '/api/upload-custom-graphic', formData);
      const result = await response.json();
      
      const dimensions = getPlatformDimensions(platform);
      const newGraphic = {
        platform,
        url: result.graphicUrl,
        filename: files[0].name,
        dimensions,
        isCustom: true
      };
      
      setCustomGraphics(prev => [...prev, newGraphic]);
      
      toast({
        title: "Upload Successful!",
        description: `Custom graphic uploaded for ${dimensions.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload custom graphic",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getPlatformDimensions = (platform: string) => {
    const dimensions: { [key: string]: { width: number; height: number; name: string } } = {
      'instagram_post': { width: 1080, height: 1080, name: 'Instagram Post' },
      'instagram_story': { width: 1080, height: 1920, name: 'Instagram Story' },
      'facebook_post': { width: 1200, height: 630, name: 'Facebook Post' },
      'pinterest_pin': { width: 1000, height: 1500, name: 'Pinterest Pin' }
    };
    return dimensions[platform] || { width: 1080, height: 1080, name: 'Social Media' };
  };

  const handleDeleteCampaign = async (campaignId: number, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete the campaign "${campaignName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/ad-copy-campaigns/${campaignId}`);
      toast({
        title: "Campaign Deleted",
        description: "Campaign deleted successfully",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGoal = filterGoal === 'all' || campaign.campaignGoal === filterGoal;
    const matchesVoice = filterVoice === 'all' || campaign.brandVoice === filterVoice;
    
    return matchesSearch && matchesGoal && matchesVoice;
  }) || [];

  // Show individual campaign details if campaignId is present
  if (campaignId) {
    if (isLoadingDetails) {
      return (
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      );
    }

    if (!campaignDetails) {
      return (
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Campaign not found.</p>
                <Button onClick={() => navigate('/my-ads')} className="mt-4">
                  Back to Campaigns
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const campaign = campaignDetails.campaign;
    const generatedContent = campaignDetails.generatedContent || [];

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button onClick={() => navigate('/my-ads')} variant="outline" className="mb-4">
            ← Back to Campaigns
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{campaign.name}</CardTitle>
            <CardDescription>
              Campaign details and generated ad copy variations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Product Information</h3>
                <p><strong>Product:</strong> {campaign.productName}</p>
                <p><strong>Category:</strong> {campaign.productCategory}</p>
                <p><strong>Target Audience:</strong> {campaign.targetAudience}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Campaign Settings</h3>
                <p><strong>Brand Voice:</strong> {campaign.brandVoice}</p>
                <p><strong>Goal:</strong> {campaign.campaignGoal}</p>
                <p><strong>Affiliate URL:</strong> <a href={campaign.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{campaign.affiliateUrl}</a></p>
              </div>
            </div>
          </CardContent>
        </Card>

{generatedContent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Content & Visuals</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="copy" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="copy">Ad Copy ({generatedContent.length})</TabsTrigger>
                  <TabsTrigger value="images">Image Suggestions</TabsTrigger>
                  <TabsTrigger value="graphics">Text Overlays</TabsTrigger>
                </TabsList>
                
                <TabsContent value="copy" className="mt-6">
              {(() => {
                // Group content by platform for better organization
                const groupedByPlatform = generatedContent.reduce((acc: any, content: any) => {
                  if (!acc[content.platform]) {
                    acc[content.platform] = {
                      headlines: [],
                      descriptions: [],
                      ctas: [],
                      hashtags: []
                    };
                  }
                  
                  // Group by ad format/type
                  if (content.headline && !acc[content.platform].headlines.includes(content.headline)) {
                    acc[content.platform].headlines.push(content.headline);
                  }
                  if (content.description && !acc[content.platform].descriptions.includes(content.description)) {
                    acc[content.platform].descriptions.push(content.description);
                  }
                  if (content.callToAction && !acc[content.platform].ctas.includes(content.callToAction)) {
                    acc[content.platform].ctas.push(content.callToAction);
                  }
                  if (content.hashtags && content.hashtags.length > 0) {
                    // Add unique hashtags only
                    content.hashtags.forEach((hashtag: string) => {
                      if (!acc[content.platform].hashtags.includes(hashtag)) {
                        acc[content.platform].hashtags.push(hashtag);
                      }
                    });
                  }
                  
                  return acc;
                }, {});

                return (
                  <div className="space-y-8">
                    {Object.entries(groupedByPlatform).map(([platform, data]: [string, any]) => (
                      <div key={platform} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {platform === 'tiktok_video' ? 'TikTok' : 
                             platform === 'pinterest_boards' ? 'Pinterest' :
                             platform === 'facebook_ads' ? 'Facebook' :
                             platform === 'instagram_stories' ? 'Instagram' : platform}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Headlines/Captions */}
                          {data.headlines.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 text-green-600">
                                ✅ {platform === 'tiktok_video' ? 'TikTok Captions' : 
                                     platform === 'pinterest_boards' ? 'Pinterest Headlines' : 'Headlines'} 
                                ({data.headlines.length})
                              </h4>
                              <div className="space-y-2">
                                {data.headlines.map((headline: string, index: number) => (
                                  <div key={index} className="bg-muted p-3 rounded flex items-center justify-between">
                                    <span className="text-sm">{headline}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyToClipboard(headline, 'headline')}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Descriptions */}
                          {data.descriptions.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 text-green-600">
                                ✅ {platform === 'pinterest_boards' ? 'Pin Descriptions' : 'Ad Copy'} 
                                ({data.descriptions.length})
                              </h4>
                              <div className="space-y-2">
                                {data.descriptions.map((desc: string, index: number) => (
                                  <div key={index} className="bg-muted p-3 rounded flex items-center justify-between">
                                    <span className="text-sm">{desc}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyToClipboard(desc, 'description')}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* CTAs */}
                          {data.ctas.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 text-green-600">
                                ✅ CTAs ({data.ctas.length})
                              </h4>
                              <div className="space-y-2">
                                {data.ctas.map((cta: string, index: number) => (
                                  <div key={index} className="bg-muted p-3 rounded flex items-center justify-between">
                                    <span className="text-sm font-medium">{cta}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyToClipboard(cta, 'CTA')}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Hashtags */}
                          {data.hashtags.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 text-green-600">
                                ✅ Suggested Hashtags ({data.hashtags.length})
                              </h4>
                              <div className="bg-muted p-3 rounded">
                                <div className="flex flex-wrap gap-2">
                                  {data.hashtags.map((hashtag: string, index: number) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                      {hashtag.startsWith('#') ? hashtag : `#${hashtag}`}
                                    </span>
                                  ))}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => handleCopyToClipboard(data.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' '), 'hashtags')}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy All
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Image Suggestions Section */}
                        {(() => {
                          // Check if campaign has generatedContent with image suggestions for this platform
                          if (!campaign.generatedContent) return null;
                          
                          const platformData = campaign.generatedContent.find((item: any) => 
                            item.platform === platform && 
                            item.data && 
                            item.data.imageSuggestions && 
                            item.data.imageSuggestions.length > 0
                          );
                          
                          if (!platformData || !platformData.data.imageSuggestions) return null;
                          
                          return (
                            <div className="mt-6 pt-6 border-t">
                              <h4 className="font-semibold mb-3 text-purple-600">
                                AI Image Suggestions ({platformData.data.imageSuggestions.length})
                              </h4>
                              <div className="grid grid-cols-1 gap-4">
                                {platformData.data.imageSuggestions.map((suggestion: any, index: number) => (
                                  <div key={index} className="bg-muted p-4 rounded border">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-muted-foreground">
                                        {suggestion.type} • {suggestion.mood}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyToClipboard(suggestion.description, 'image suggestion')}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="text-sm mb-3">{suggestion.description}</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                      <div>
                                        <strong>Composition:</strong><br />
                                        {suggestion.composition}
                                      </div>
                                      <div>
                                        <strong>Colors:</strong><br />
                                        {Array.isArray(suggestion.colors) ? suggestion.colors.join(', ') : suggestion.colors}
                                      </div>
                                      <div>
                                        <strong>Elements:</strong><br />
                                        {Array.isArray(suggestion.visualElements) ? suggestion.visualElements.join(', ') : suggestion.visualElements}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                );
              })()}
                </TabsContent>
                
                <TabsContent value="images" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Creative Image Suggestions</h3>
                      <Badge variant="secondary">AI-Generated</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Professional image concepts created by AI to maximize engagement with your target audience.
                    </p>
                    
                    {(() => {
                      // Group image suggestions by platform
                      const platformSuggestions = generatedContent.reduce((acc: any, content: any) => {
                        if (!acc[content.platform]) {
                          acc[content.platform] = [];
                        }
                        if (content.data && content.data.imageSuggestions) {
                          acc[content.platform] = content.data.imageSuggestions;
                        }
                        return acc;
                      }, {});

                      return Object.entries(platformSuggestions).map(([platform, suggestions]: [string, any]) => (
                        <div key={platform} className="border rounded-lg p-6">
                          <h4 className="font-semibold mb-4 capitalize text-lg">
                            {platform.replace(/_/g, ' ')} Image Concepts
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {suggestions.map((suggestion: any, index: number) => (
                              <Card key={index} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">{suggestion.type}</CardTitle>
                                    <Badge variant="outline" className="text-xs">{suggestion.mood}</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visual Elements</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {suggestion.visualElements.map((element: string, idx: number) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {element}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Composition</p>
                                      <p className="text-xs text-muted-foreground mt-1">{suggestion.composition}</p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Color Palette</p>
                                      <div className="flex gap-1 mt-1">
                                        {suggestion.colors.map((color: string, idx: number) => (
                                          <div
                                            key={idx}
                                            className="w-4 h-4 rounded-full border border-gray-300"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-3"
                                    onClick={() => handleCopyToClipboard(suggestion.description, 'image concept')}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Concept
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                    
                    {generatedContent.length === 0 && (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No image suggestions available</p>
                        <p className="text-sm">Image concepts are generated automatically with ad copy</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="graphics" className="mt-6">
                  <div className="space-y-6">
                    {/* Real AI Graphics Section */}
                    <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">AI-Generated Graphics</h3>
                          <p className="text-sm text-muted-foreground">Professional product graphics created by AI</p>
                        </div>
                        <Button onClick={() => handleGenerateRealGraphics(campaign)} disabled={!campaign || isGeneratingReal}>
                          {isGeneratingReal ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin border-2 border-background border-t-transparent rounded-full" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate AI Graphics
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Display Real AI Graphics */}
                      {realGraphics.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          {realGraphics.map((graphic, index) => (
                            <Card key={index} className="overflow-hidden">
                              <CardContent className="p-0">
                                <div className="aspect-square relative bg-muted">
                                  <img 
                                    src={graphic.url} 
                                    alt={`${graphic.dimensions.name} AI graphic`}
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="text-xs bg-purple-500 text-white">
                                      AI Generated
                                    </Badge>
                                  </div>
                                  <div className="absolute bottom-2 left-2">
                                    <Badge variant="outline" className="text-xs bg-white/90">
                                      {graphic.dimensions.name}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h4 className="font-medium text-sm mb-2">{graphic.dimensions.name}</h4>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {graphic.dimensions.width} × {graphic.dimensions.height}
                                  </p>
                                  <div className="flex gap-2 mt-3">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 text-xs"
                                      onClick={() => window.open(graphic.url, '_blank')}
                                    >
                                      View Full
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 text-xs"
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.origin + graphic.url);
                                        toast({
                                          title: "URL Copied!",
                                          description: "Image URL copied to clipboard",
                                        });
                                      }}
                                    >
                                      Copy URL
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Custom Graphics Upload Section */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Custom Graphics Upload</h3>
                          <p className="text-sm text-muted-foreground">Upload your own graphics for different platforms</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {['instagram_post', 'instagram_story', 'facebook_post', 'pinterest_pin'].map((platform) => {
                          const dimensions = getPlatformDimensions(platform);
                          return (
                            <div key={platform} className="border rounded-lg p-4 text-center">
                              <h4 className="font-medium mb-2">{dimensions.name}</h4>
                              <p className="text-xs text-muted-foreground mb-3">
                                {dimensions.width} × {dimensions.height}
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleCustomGraphicsUpload(e.target.files, platform);
                                  }
                                }}
                                className="hidden"
                                id={`upload-${platform}`}
                                disabled={isUploading}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => document.getElementById(`upload-${platform}`)?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Display Custom Graphics */}
                      {customGraphics.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {customGraphics.map((graphic, index) => (
                            <Card key={index} className="overflow-hidden">
                              <CardContent className="p-0">
                                <div className="aspect-square relative bg-muted">
                                  <img 
                                    src={graphic.url} 
                                    alt={`Custom ${graphic.dimensions.name} graphic`}
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                                      Custom Upload
                                    </Badge>
                                  </div>
                                  <div className="absolute bottom-2 left-2">
                                    <Badge variant="outline" className="text-xs bg-white/90">
                                      {graphic.dimensions.name}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h4 className="font-medium text-sm mb-2">{graphic.dimensions.name}</h4>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {graphic.dimensions.width} × {graphic.dimensions.height}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate mb-2">
                                    {graphic.filename}
                                  </p>
                                  <div className="flex gap-2 mt-3">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 text-xs"
                                      onClick={() => window.open(graphic.url, '_blank')}
                                    >
                                      View Full
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 text-xs"
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.origin + graphic.url);
                                        toast({
                                          title: "URL Copied!",
                                          description: "Image URL copied to clipboard",
                                        });
                                      }}
                                    >
                                      Copy URL
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Text Overlay Graphics Section */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Text Overlay Graphics</h3>
                          <p className="text-sm text-muted-foreground">Simple text overlays on colored backgrounds</p>
                        </div>
                        <Button onClick={() => handleGenerateGraphics(campaign)} disabled={!campaign}>
                          <Type className="w-4 h-4 mr-2" />
                          Generate Text Overlays
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedGraphics.length > 0 ? (
                        generatedGraphics.map((graphic, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="aspect-square relative bg-muted">
                                <img 
                                  src={graphic.url} 
                                  alt={`${graphic.dimensions.name} graphic`}
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {graphic.dimensions.name}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-4">
                                <h4 className="font-medium text-sm mb-2">{graphic.dimensions.name}</h4>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {graphic.dimensions.width} × {graphic.dimensions.height}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  "{graphic.text}"
                                </p>
                                <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1 text-xs"
                                    onClick={() => window.open(graphic.url, '_blank')}
                                  >
                                    View Full
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1 text-xs"
                                    onClick={() => {
                                      navigator.clipboard.writeText(window.location.origin + graphic.url);
                                      toast({
                                        title: "URL Copied",
                                        description: "Graphic URL copied to clipboard",
                                      });
                                    }}
                                  >
                                    Copy URL
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                          Click "Generate Graphics" to create text overlay graphics
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show campaigns list if no specific campaign ID
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Ad Campaigns</h1>
          <p className="text-muted-foreground">Manage and view your AI-generated ad copy campaigns</p>
        </div>
        <Button 
          onClick={() => navigate('/ad-copy-generator')}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterGoal} onValueChange={setFilterGoal}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Campaign Goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
                <SelectItem value="awareness">Awareness</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="traffic">Traffic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterVoice} onValueChange={setFilterVoice}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Brand Voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Voices</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="quirky">Quirky</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
              </div>
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{campaigns?.filter(c => c.isActive).length || 0}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {campaigns?.filter(c => 
                    new Date(c.createdAt).getMonth() === new Date().getMonth()
                  ).length || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredCampaigns.length}</p>
              </div>
              <Filter className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Copy Campaigns</CardTitle>
          <CardDescription>
            Your generated ad copy campaigns and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {campaigns?.length === 0 
                  ? "Create your first ad copy campaign to get started"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              <Button 
                onClick={() => navigate('/ad-copy-generator')}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Target Audience</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Voice</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.productName}</div>
                          <div className="text-sm text-muted-foreground">{campaign.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{campaign.targetAudience}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {campaign.campaignGoal}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {campaign.brandVoice}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.isActive ? "default" : "secondary"}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCampaign(campaign.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(campaign.affiliateUrl, 'Affiliate URL')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadCSV(campaign)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}