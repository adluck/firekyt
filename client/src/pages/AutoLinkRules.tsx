import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Link, Settings, Target, Eye, BarChart3 } from "lucide-react";

const autoLinkRuleSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  affiliateUrl: z.string().url("Please enter a valid URL"),
  anchorText: z.string().optional(),
  linkTitle: z.string().optional(),
  targetAttribute: z.string().optional(),
  relAttribute: z.string().optional(),
  caseSensitive: z.boolean().default(false),
  matchWholeWords: z.boolean().default(true),
  maxInsertions: z.number().min(1).max(10).default(1),
  priority: z.number().min(1).max(100).default(50),
  isActive: z.boolean().default(true),
  siteId: z.number().optional(),
  utmParams: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

type AutoLinkRuleFormData = z.infer<typeof autoLinkRuleSchema>;

interface AutoLinkRule {
  id: number;
  userId: number;
  siteId?: number;
  keyword: string;
  affiliateUrl: string;
  anchorText?: string;
  linkTitle?: string;
  targetAttribute: string;
  relAttribute: string;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  maxInsertions: number;
  priority: number;
  isActive: boolean;
  utmParams?: any;
  lastUsed?: string;
  usageCount: number;
  performanceData?: any;
  createdAt: string;
  updatedAt: string;
}

export default function AutoLinkRules() {
  const [selectedSiteId, setSelectedSiteId] = useState<number | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoLinkRule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites for filtering
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
    enabled: true
  });

  // Fetch auto-link rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['/api/auto-link-rules', selectedSiteId],
    queryFn: () => {
      const params = selectedSiteId ? `?siteId=${selectedSiteId}` : '';
      return fetch(`/api/auto-link-rules${params}`, {
        credentials: 'include'
      }).then(res => res.json());
    }
  });

  const rules = rulesData?.rules || [];

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (data: AutoLinkRuleFormData) =>
      apiRequest('POST', '/api/auto-link-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-link-rules'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Auto-link rule created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create auto-link rule",
        variant: "destructive"
      });
    }
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AutoLinkRuleFormData> }) =>
      apiRequest('PUT', `/api/auto-link-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-link-rules'] });
      setEditingRule(null);
      toast({
        title: "Success",
        description: "Auto-link rule updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-link rule",
        variant: "destructive"
      });
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/auto-link-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-link-rules'] });
      toast({
        title: "Success",
        description: "Auto-link rule deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete auto-link rule",
        variant: "destructive"
      });
    }
  });

  const form = useForm<AutoLinkRuleFormData>({
    resolver: zodResolver(autoLinkRuleSchema),
    defaultValues: {
      caseSensitive: false,
      matchWholeWords: true,
      maxInsertions: 1,
      priority: 50,
      isActive: true,
      targetAttribute: "_blank",
      relAttribute: "nofollow"
    }
  });

  const onSubmit = (data: AutoLinkRuleFormData) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    form.reset({
      caseSensitive: false,
      matchWholeWords: true,
      maxInsertions: 1,
      priority: 50,
      isActive: true,
      targetAttribute: "_blank",
      relAttribute: "nofollow",
      siteId: selectedSiteId
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (rule: AutoLinkRule) => {
    setEditingRule(rule);
    form.reset({
      keyword: rule.keyword,
      affiliateUrl: rule.affiliateUrl,
      anchorText: rule.anchorText || "",
      linkTitle: rule.linkTitle || "",
      targetAttribute: rule.targetAttribute || "_blank",
      relAttribute: rule.relAttribute || "nofollow",
      caseSensitive: rule.caseSensitive,
      matchWholeWords: rule.matchWholeWords,
      maxInsertions: rule.maxInsertions,
      priority: rule.priority,
      isActive: rule.isActive,
      siteId: rule.siteId,
      utmParams: rule.utmParams || {}
    });
    setIsCreateDialogOpen(true);
  };

  const toggleRuleStatus = (rule: AutoLinkRule) => {
    updateRuleMutation.mutate({
      id: rule.id,
      data: { isActive: !rule.isActive }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Auto-Link Rules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automatically insert affiliate links based on keywords in your content
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {/* Site Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Filter & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="site-filter">Filter by Site</Label>
              <Select
                value={selectedSiteId?.toString() || "all"}
                onValueChange={(value) => setSelectedSiteId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites?.sites?.map((site: any) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Link className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Auto-Link Rules Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first auto-link rule to automatically insert affiliate links in your content.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule: AutoLinkRule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        "{rule.keyword}"
                      </span>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        Priority: {rule.priority}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <span className="font-medium">Links to:</span> {rule.affiliateUrl}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRuleStatus(rule)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Anchor Text:</span>
                    <p className="font-medium">{rule.anchorText || rule.keyword}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Max Insertions:</span>
                    <p className="font-medium">{rule.maxInsertions}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Usage Count:</span>
                    <p className="font-medium flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {rule.usageCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Last Used:</span>
                    <p className="font-medium">
                      {rule.lastUsed 
                        ? new Date(rule.lastUsed).toLocaleDateString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {rule.caseSensitive && (
                    <Badge variant="outline" className="text-xs">Case Sensitive</Badge>
                  )}
                  {rule.matchWholeWords && (
                    <Badge variant="outline" className="text-xs">Whole Words</Badge>
                  )}
                  {rule.utmParams && Object.keys(rule.utmParams).length > 0 && (
                    <Badge variant="outline" className="text-xs">UTM Tracking</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Auto-Link Rule" : "Create Auto-Link Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure automatic affiliate link insertion for specific keywords.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Basic Settings</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="keyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keyword/Phrase</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., best laptops" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site (Optional)</FormLabel>
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All sites" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All sites</SelectItem>
                            {sites?.sites?.map((site: any) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="affiliateUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliate URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://amazon.com/dp/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="anchorText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anchor Text (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Uses keyword if empty" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Title (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="For SEO and accessibility" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Advanced Settings</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxInsertions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Insertions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (1-100)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caseSensitive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Case Sensitive</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="matchWholeWords"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Match Whole Words</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAttribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Attribute</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_blank">_blank (New tab)</SelectItem>
                            <SelectItem value="_self">_self (Same tab)</SelectItem>
                            <SelectItem value="_parent">_parent</SelectItem>
                            <SelectItem value="_top">_top</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relAttribute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rel Attribute</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nofollow">nofollow</SelectItem>
                            <SelectItem value="nofollow sponsored">nofollow sponsored</SelectItem>
                            <SelectItem value="sponsored">sponsored</SelectItem>
                            <SelectItem value="">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* UTM Parameters */}
              <div className="space-y-4">
                <h4 className="font-medium">UTM Tracking Parameters (Optional)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="utmParams.utm_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Source</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., firekyt" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utmParams.utm_medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Medium</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., blog" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utmParams.utm_campaign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Campaign</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., affiliate-links" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utmParams.utm_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Term</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., best-laptops" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}