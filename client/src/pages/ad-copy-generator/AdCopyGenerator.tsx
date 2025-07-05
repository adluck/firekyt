import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Sparkles, Target, Settings, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProductInfo {
  productName: string;
  productDescription: string;
  affiliateUrl: string;
  targetAudience: string;
  primaryBenefit: string;
  toneOfVoice: string;
}

interface PlatformSelection {
  platforms: string[];
  formats: {
    [platform: string]: string[];
  };
}

interface ABTestSettings {
  variationCount: number;
  optimizeForConversion: boolean;
}

const toneOptions = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'bold', label: 'Bold' },
  { value: 'quirky', label: 'Quirky' }
];

const platforms = [
  {
    id: 'google_search',
    name: 'Google Search',
    description: 'Search ads with headlines and descriptions',
    formats: ['headlines', 'descriptions', 'ctas']
  },
  {
    id: 'facebook_ads',
    name: 'Facebook Ads',
    description: 'Facebook feed and display advertisements',
    formats: ['headlines', 'descriptions', 'ctas']
  },
  {
    id: 'instagram_stories',
    name: 'Instagram Stories/Reels',
    description: 'Short-form vertical content',
    formats: ['headlines', 'descriptions', 'hashtags']
  },
  {
    id: 'tiktok_video',
    name: 'TikTok Video Captions',
    description: 'Engaging video descriptions and hooks',
    formats: ['headlines', 'descriptions', 'hashtags']
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts Titles',
    description: 'Compelling short-form video titles',
    formats: ['headlines', 'descriptions', 'hashtags']
  },
  {
    id: 'pinterest_pins',
    name: 'Pinterest Pins',
    description: 'Visual content with descriptions',
    formats: ['headlines', 'descriptions', 'hashtags']
  }
];

const formatLabels = {
  headlines: 'Headlines',
  descriptions: 'Descriptions',
  ctas: 'Call-to-Actions',
  hashtags: 'Hashtags'
};

export default function AdCopyGenerator() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    productName: '',
    productDescription: '',
    affiliateUrl: '',
    targetAudience: '',
    primaryBenefit: '',
    toneOfVoice: ''
  });
  
  const [platformSelection, setPlatformSelection] = useState<PlatformSelection>({
    platforms: [],
    formats: {}
  });
  
  const [abTestSettings, setABTestSettings] = useState<ABTestSettings>({
    variationCount: 3,
    optimizeForConversion: true
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const progress = (currentStep / 3) * 100;

  const handleProductInfoChange = (field: keyof ProductInfo, value: string) => {
    setProductInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platformId: string) => {
    setPlatformSelection(prev => {
      const newPlatforms = prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId];
      
      const newFormats = { ...prev.formats };
      if (newPlatforms.includes(platformId)) {
        const platform = platforms.find(p => p.id === platformId);
        newFormats[platformId] = platform?.formats || [];
      } else {
        delete newFormats[platformId];
      }
      
      return { platforms: newPlatforms, formats: newFormats };
    });
  };

  const handleFormatToggle = (platformId: string, format: string) => {
    setPlatformSelection(prev => ({
      ...prev,
      formats: {
        ...prev.formats,
        [platformId]: prev.formats[platformId]?.includes(format)
          ? prev.formats[platformId].filter(f => f !== format)
          : [...(prev.formats[platformId] || []), format]
      }
    }));
  };

  const canProceedFromStep1 = productInfo.productName && productInfo.affiliateUrl && productInfo.targetAudience && productInfo.primaryBenefit && productInfo.toneOfVoice;
  const canProceedFromStep2 = platformSelection.platforms.length > 0 && Object.values(platformSelection.formats).some(formats => formats.length > 0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const requestData = {
        productName: productInfo.productName,
        productDescription: productInfo.productDescription,
        targetAudience: productInfo.targetAudience,
        primaryBenefit: productInfo.primaryBenefit,
        toneOfVoice: productInfo.toneOfVoice,
        platforms: platformSelection.platforms,
        formats: platformSelection.formats,
        variationCount: abTestSettings.variationCount,
        optimizeForConversion: abTestSettings.optimizeForConversion,
        affiliateUrl: productInfo.affiliateUrl
      };

      const response = await apiRequest('POST', '/api/generate-ad-copy', requestData);
      
      if (response.success) {
        toast({
          title: "Ad Copy Generated!",
          description: `Generated ${response.totalVariations} ad copy variations successfully.`,
        });
        
        // Navigate to results page with campaign ID
        navigate(`/my-ads/${response.campaignId}`);
      } else {
        throw new Error(response.message || 'Failed to generate ad copy');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate ad copy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
          <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Product & Audience Info</h3>
          <p className="text-sm text-muted-foreground">Tell us about your product and target audience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            placeholder="e.g., Wireless Gaming Headset"
            value={productInfo.productName}
            onChange={(e) => handleProductInfoChange('productName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience *</Label>
          <Input
            id="targetAudience"
            placeholder="e.g., gamers, moms, small business owners"
            value={productInfo.targetAudience}
            onChange={(e) => handleProductInfoChange('targetAudience', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="productDescription">Product Description (Optional)</Label>
          <Textarea
            id="productDescription"
            placeholder="Brief description of your product's features and benefits..."
            value={productInfo.productDescription}
            onChange={(e) => handleProductInfoChange('productDescription', e.target.value)}
            rows={3}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="affiliateUrl">Product Page or Affiliate URL *</Label>
          <Input
            id="affiliateUrl"
            placeholder="https://example.com/product-page"
            value={productInfo.affiliateUrl}
            onChange={(e) => handleProductInfoChange('affiliateUrl', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="primaryBenefit">Primary Benefit or USP *</Label>
          <Input
            id="primaryBenefit"
            placeholder="e.g., Crystal clear audio with 50-hour battery life"
            value={productInfo.primaryBenefit}
            onChange={(e) => handleProductInfoChange('primaryBenefit', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tone of Voice *</Label>
          <Select value={productInfo.toneOfVoice} onValueChange={(value) => handleProductInfoChange('toneOfVoice', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Platform & Format Selection</h3>
          <p className="text-sm text-muted-foreground">Choose where you want to advertise and what content types</p>
        </div>
      </div>

      <div className="space-y-6">
        {platforms.map((platform) => (
          <Card key={platform.id} className={`transition-all ${platformSelection.platforms.includes(platform.id) ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={platformSelection.platforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                  />
                  <div>
                    <CardTitle className="text-base">{platform.name}</CardTitle>
                    <CardDescription className="text-sm">{platform.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {platformSelection.platforms.includes(platform.id) && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select content formats:</Label>
                  <div className="flex flex-wrap gap-2">
                    {platform.formats.map((format) => (
                      <Badge
                        key={format}
                        variant={platformSelection.formats[platform.id]?.includes(format) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => handleFormatToggle(platform.id, format)}
                      >
                        {formatLabels[format as keyof typeof formatLabels]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Copy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">A/B Test Variations</h3>
          <p className="text-sm text-muted-foreground">Configure how many variations you want to test</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Number of Variations</CardTitle>
            <CardDescription>Choose how many versions of each ad copy to generate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Variations per format</Label>
                <Badge variant="outline">{abTestSettings.variationCount}</Badge>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <Button
                    key={count}
                    variant={abTestSettings.variationCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setABTestSettings(prev => ({ ...prev, variationCount: count }))}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optimization Settings</CardTitle>
            <CardDescription>Configure AI optimization preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Optimize for conversion</Label>
                <p className="text-sm text-muted-foreground">Focus on high-converting copy variations</p>
              </div>
              <Switch
                checked={abTestSettings.optimizeForConversion}
                onCheckedChange={(checked) => setABTestSettings(prev => ({ ...prev, optimizeForConversion: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950 dark:to-pink-950 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium">Generation Summary</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Platforms</p>
                <p className="font-medium">{platformSelection.platforms.length} selected</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Formats</p>
                <p className="font-medium">{Object.values(platformSelection.formats).flat().length} formats</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Variations</p>
                <p className="font-medium">{Object.values(platformSelection.formats).flat().length * abTestSettings.variationCount} ad copies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Ad Copy Generator</h1>
        <p className="text-muted-foreground">Create high-converting ad copy for multiple platforms with AI</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Step {currentStep} of 3</span>
            <Progress value={progress} className="w-64" />
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-3">
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={
                (currentStep === 1 && !canProceedFromStep1) ||
                (currentStep === 2 && !canProceedFromStep2)
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Ad Copy
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}