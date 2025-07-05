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
  Filter
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
              <CardTitle>Generated Ad Copy ({generatedContent.length} variations)</CardTitle>
            </CardHeader>
            <CardContent>
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
                    acc[content.platform].hashtags = [...new Set([...acc[content.platform].hashtags, ...content.hashtags])];
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
                      </div>
                    ))}
                  </div>
                );
              })()}
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