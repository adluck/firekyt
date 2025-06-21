import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiteCard } from "@/components/sites/SiteCard";
import { Plus, Globe, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import type { Site, InsertSite } from "@shared/schema";

export default function Sites() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<Partial<InsertSite>>({
    name: "",
    domain: "",
    description: "",
    niche: "",
    targetKeywords: [],
    brandVoice: "professional",
  });
  const [keywordInput, setKeywordInput] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canAccess, hasReachedLimit, getUsage, getLimit } = useSubscription();

  // Fetch sites
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch content counts for each site
  const { data: allContent = [] } = useQuery({
    queryKey: ["/api/content"],
  });

  // Fetch analytics for all sites
  const { data: sitesAnalytics = {} } = useQuery({
    queryKey: ["/api/analytics/sites"],
    enabled: sites.length > 0,
  });

  // Create site mutation
  const createSiteMutation = useMutation({
    mutationFn: async (siteData: InsertSite) => {
      const response = await apiRequest("POST", "/api/sites", siteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Site created!",
        description: "Your new affiliate site has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create site",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update site mutation
  const updateSiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Site> }) => {
      const response = await apiRequest("PUT", `/api/sites/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setEditingSite(null);
      resetForm();
      toast({
        title: "Site updated!",
        description: "Your site has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update site",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete site mutation
  const deleteSiteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({
        title: "Site deleted",
        description: "Your site has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete site",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      domain: "",
      description: "",
      niche: "",
      targetKeywords: [],
      brandVoice: "professional",
    });
    setKeywordInput("");
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.targetKeywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        targetKeywords: [...(prev.targetKeywords || []), keywordInput.trim()]
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      targetKeywords: prev.targetKeywords?.filter(k => k !== keyword) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSite) {
      updateSiteMutation.mutate({ id: editingSite.id, data: formData });
    } else {
      createSiteMutation.mutate(formData as InsertSite);
    }
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      domain: site.domain || "",
      description: site.description || "",
      niche: site.niche || "",
      targetKeywords: site.targetKeywords || [],
      brandVoice: site.brandVoice || "professional",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (site: Site) => {
    if (window.confirm(`Are you sure you want to delete "${site.name}"? This action cannot be undone.`)) {
      deleteSiteMutation.mutate(site.id);
    }
  };

  const getContentCount = (siteId: number) => {
    return allContent.filter((content: any) => content.siteId === siteId).length;
  };

  const getSiteViews = (siteId: number) => {
    return sitesAnalytics[siteId]?.views || 0;
  };

  const canCreateSite = canAccess('site_creation') && !hasReachedLimit('sites');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Sites</h1>
          <p className="text-muted-foreground">
            Manage your affiliate sites and track their performance
          </p>
        </div>
        
        <Dialog 
          open={isCreateDialogOpen} 
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingSite(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button 
              className="btn-gradient"
              disabled={!canCreateSite}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Site
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSite ? "Edit Site" : "Create New Site"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name *</Label>
                  <Input
                    id="name"
                    placeholder="Tech Reviews Hub"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="techreviews.com"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A comprehensive review site for the latest tech gadgets and electronics"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche</Label>
                  <Input
                    id="niche"
                    placeholder="Technology, Electronics, Gadgets"
                    value={formData.niche}
                    onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brandVoice">Brand Voice</Label>
                  <Select 
                    value={formData.brandVoice} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brandVoice: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Target Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    id="keywords"
                    placeholder="Add keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  />
                  <Button type="button" onClick={handleAddKeyword}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.targetKeywords?.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="btn-gradient"
                  disabled={createSiteMutation.isPending || updateSiteMutation.isPending}
                >
                  {createSiteMutation.isPending || updateSiteMutation.isPending 
                    ? "Saving..." 
                    : editingSite ? "Update Site" : "Create Site"
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Limits Alert */}
      {!canCreateSite && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!canAccess('site_creation') 
              ? "Site creation is not available in your current plan. Upgrade to create more sites."
              : `You've reached your site limit (${getUsage('sites')}/${getLimit('sites')}). Upgrade to create more sites.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Sites Grid */}
      {sites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first affiliate site to start generating content
            </p>
            {canCreateSite && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="btn-gradient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Site
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              contentCount={getContentCount(site.id)}
              totalViews={getSiteViews(site.id)}
              onEdit={() => handleEdit(site)}
              onDelete={() => handleDelete(site)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
