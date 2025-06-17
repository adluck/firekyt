import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  Link as LinkIcon, 
  Percent, 
  Clock, 
  Copy,
  CheckCircle 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AffiliateNetwork {
  name: string;
  commissionRate: number;
  cookieDuration: number;
}

interface AffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  networkName: string;
  commissionRate: number;
  trackingId: string;
  deepLink?: string;
}

export default function AffiliateNetworks() {
  const [productUrl, setProductUrl] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [customAffiliateId, setCustomAffiliateId] = useState("");
  const [subId, setSubId] = useState("");
  const [generatedLink, setGeneratedLink] = useState<AffiliateLink | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: networksData, isLoading: networksLoading } = useQuery<{networks: AffiliateNetwork[]}>({
    queryKey: ["/api/affiliate-networks"],
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (params: {
      productUrl: string;
      networkName?: string;
      customAffiliateId?: string;
      subId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/affiliate-link", params);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.affiliateLink);
      toast({
        title: "Affiliate Link Generated",
        description: `Successfully created ${data.affiliateLink.networkName} affiliate link`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate affiliate link",
        variant: "destructive",
      });
    },
  });

  const handleGenerateLink = () => {
    if (!productUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    generateLinkMutation.mutate({
      productUrl,
      networkName: selectedNetwork && selectedNetwork !== "auto" ? selectedNetwork : undefined,
      customAffiliateId: customAffiliateId || undefined,
      subId: subId || undefined,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  if (networksLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const networks: AffiliateNetwork[] = networksData?.networks ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Affiliate Networks</h1>
        <p className="text-muted-foreground mt-2">
          Manage affiliate programs and generate tracking links for your products
        </p>
      </div>

      {/* Supported Networks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Supported Networks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {networks.map((network) => (
              <div
                key={network.name}
                className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{network.name}</h3>
                  <Badge variant="secondary">
                    <Percent className="h-3 w-3 mr-1" />
                    {network.commissionRate}%
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {network.cookieDuration} day cookie
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Generate Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productUrl">Product URL</Label>
            <Input
              id="productUrl"
              placeholder="https://amazon.com/product-page"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="network">Network (auto-detect if empty)</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect from URL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  {networks.map((network) => (
                    <SelectItem key={network.name} value={network.name.toLowerCase().replace(/\s+/g, '').replace(/&/g, '')}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliateId">Custom Affiliate ID (optional)</Label>
              <Input
                id="affiliateId"
                placeholder="your-affiliate-id"
                value={customAffiliateId}
                onChange={(e) => setCustomAffiliateId(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subId">Sub ID / Campaign Tracking (optional)</Label>
            <Input
              id="subId"
              placeholder="campaign-name"
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleGenerateLink}
            disabled={generateLinkMutation.isPending}
            className="w-full"
          >
            {generateLinkMutation.isPending ? "Generating..." : "Generate Affiliate Link"}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Link Results */}
      {generatedLink && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated Affiliate Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Network</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{generatedLink.networkName}</Badge>
                  <Badge variant="outline">
                    {generatedLink.commissionRate}% commission
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Tracking ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {generatedLink.trackingId}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedLink.trackingId, "Tracking ID")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Original URL</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={generatedLink.originalUrl} 
                  readOnly 
                  className="bg-muted"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedLink.originalUrl, "Original URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Affiliate URL</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={generatedLink.affiliateUrl} 
                  readOnly 
                  className="bg-muted font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(generatedLink.affiliateUrl, "Affiliate URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(generatedLink.affiliateUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Usage Instructions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use this affiliate URL in your content instead of the original product URL</li>
                <li>• Track performance using the tracking ID: {generatedLink.trackingId}</li>
                <li>• Commission rate: {generatedLink.commissionRate}% of qualifying purchases</li>
                <li>• Ensure compliance with {generatedLink.networkName} terms of service</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}