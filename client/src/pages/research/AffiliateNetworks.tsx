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
  CheckCircle,
  Plus,
  Settings
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  // State for adding new networks
  const [showAddNetworkDialog, setShowAddNetworkDialog] = useState(false);
  const [newNetwork, setNewNetwork] = useState({
    networkKey: "",
    networkName: "",
    baseUrl: "",
    trackingParam: "",
    affiliateId: "",
    commissionRate: 5.0,
    cookieDuration: 30
  });

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

  const addNetworkMutation = useMutation({
    mutationFn: async (networkData: typeof newNetwork) => {
      const response = await apiRequest("POST", "/api/affiliate-networks", networkData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Network Added",
        description: `Successfully added ${data.network.name} affiliate network`,
      });
      setShowAddNetworkDialog(false);
      setNewNetwork({
        networkKey: "",
        networkName: "",
        baseUrl: "",
        trackingParam: "",
        affiliateId: "",
        commissionRate: 5.0,
        cookieDuration: 30
      });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate-networks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Network",
        description: error.message || "Failed to add affiliate network",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Affiliate Networks</h1>
          <p className="text-muted-foreground mt-2">
            Manage affiliate programs and generate tracking links for your products
          </p>
        </div>
        <Dialog open={showAddNetworkDialog} onOpenChange={setShowAddNetworkDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Affiliate Network</DialogTitle>
              <DialogDescription>
                Configure your affiliate network credentials to start generating tracking links.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="networkKey">Network Key *</Label>
                <Input
                  id="networkKey"
                  placeholder="e.g., amazon, shareasale, cj"
                  value={newNetwork.networkKey}
                  onChange={(e) => setNewNetwork({...newNetwork, networkKey: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="networkName">Network Name *</Label>
                <Input
                  id="networkName"
                  placeholder="e.g., Amazon Associates"
                  value={newNetwork.networkName}
                  onChange={(e) => setNewNetwork({...newNetwork, networkName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">Base URL *</Label>
                <Input
                  id="baseUrl"
                  placeholder="e.g., https://amazon.com"
                  value={newNetwork.baseUrl}
                  onChange={(e) => setNewNetwork({...newNetwork, baseUrl: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trackingParam">Tracking Parameter *</Label>
                <Input
                  id="trackingParam"
                  placeholder="e.g., tag, affid, pid"
                  value={newNetwork.trackingParam}
                  onChange={(e) => setNewNetwork({...newNetwork, trackingParam: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="affiliateId">Your Affiliate ID *</Label>
                <Input
                  id="affiliateId"
                  placeholder="Your affiliate account ID"
                  value={newNetwork.affiliateId}
                  onChange={(e) => setNewNetwork({...newNetwork, affiliateId: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.1"
                    value={newNetwork.commissionRate}
                    onChange={(e) => setNewNetwork({...newNetwork, commissionRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cookieDuration">Cookie Duration (days)</Label>
                  <Input
                    id="cookieDuration"
                    type="number"
                    value={newNetwork.cookieDuration}
                    onChange={(e) => setNewNetwork({...newNetwork, cookieDuration: parseInt(e.target.value) || 30})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddNetworkDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => addNetworkMutation.mutate(newNetwork)}
                disabled={addNetworkMutation.isPending || !newNetwork.networkKey || !newNetwork.networkName || !newNetwork.baseUrl || !newNetwork.trackingParam || !newNetwork.affiliateId}
              >
                {addNetworkMutation.isPending ? "Adding..." : "Add Network"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {networks.length === 0 && !networksLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <LinkIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Affiliate Networks Connected</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Connect your affiliate network accounts to start generating tracking links and earning commissions.
                  You'll need API credentials from each network you want to use.
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Popular Networks:</strong></p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Amazon Associates', 'ShareASale', 'CJ Affiliate', 'Impact', 'Rakuten'].map(network => (
                    <Badge key={network} variant="outline" className="text-xs">
                      {network}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn How to Connect Networks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          {networks.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Networks Configured</h3>
                <p className="text-muted-foreground mt-2">
                  Add affiliate network credentials to start generating tracking links.
                </p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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