import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Link, ExternalLink, TrendingUp, BarChart3, Target, 
  Plus, Edit, Trash2, Eye, MousePointer, DollarSign,
  Zap, Brain, Filter, Search, Globe, Sparkles
} from 'lucide-react';

interface IntelligentLink {
  id: number;
  title: string;
  originalUrl: string;
  shortenedUrl?: string;
  description?: string;
  keywords: string[];
  targetKeywords: string[];
  priority: number;
  isActive: boolean;
  insertionStrategy: string;
  affiliateData?: any;
  performanceGoals?: any;
  categoryId?: number;
  siteId?: number;
}

interface LinkCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export default function LinkDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<IntelligentLink | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSite, setFilterSite] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch link dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/links/dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/dashboard');
      return response.json();
    }
  });

  // Fetch intelligent links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['/api/links/intelligent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/intelligent');
      return response.json();
    }
  });

  // Fetch link categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/links/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/categories');
      return response.json();
    }
  });

  // Fetch user sites
  const { data: sites = [] } = useQuery({
    queryKey: ['/api/sites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sites');
      return response.json();
    }
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: (linkData: any) => apiRequest('POST', '/api/links/intelligent', linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/links/dashboard'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Success', description: 'Intelligent link created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: ({ id, ...linkData }: any) => apiRequest('PUT', `/api/links/intelligent/${id}`, linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/links/dashboard'] });
      setEditingLink(null);
      toast({ title: 'Success', description: 'Link updated successfully' });
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/links/intelligent/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/links/dashboard'] });
      toast({ title: 'Success', description: 'Link deleted successfully' });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: any) => apiRequest('POST', '/api/links/categories', categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/categories'] });
      setIsCreateCategoryOpen(false);
      toast({ title: 'Success', description: 'Category created successfully' });
    }
  });

  // Filter links
  const filteredLinks = links.filter((link: IntelligentLink) => {
    const matchesSearch = !searchTerm || 
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || 
      (filterCategory === 'uncategorized' && !link.categoryId) ||
      link.categoryId?.toString() === filterCategory;
    
    const matchesSite = filterSite === 'all' || 
      (filterSite === 'unassigned' && !link.siteId) ||
      link.siteId?.toString() === filterSite;
    
    return matchesSearch && matchesCategory && matchesSite;
  });

  const handleCreateLink = (formData: FormData) => {
    const linkData = {
      title: formData.get('title') as string,
      originalUrl: formData.get('originalUrl') as string,
      description: formData.get('description') as string,
      keywords: (formData.get('keywords') as string)?.split(',').map(k => k.trim()) || [],
      targetKeywords: (formData.get('targetKeywords') as string)?.split(',').map(k => k.trim()) || [],
      priority: parseInt(formData.get('priority') as string) || 50,
      insertionStrategy: formData.get('insertionStrategy') as string || 'manual',
      categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : null,
      siteId: formData.get('siteId') ? parseInt(formData.get('siteId') as string) : null,
      affiliateData: {
        commissionRate: formData.get('commissionRate') ? parseFloat(formData.get('commissionRate') as string) : null
      },
      isActive: true
    };
    createLinkMutation.mutate(linkData);
  };

  const handleUpdateLink = (formData: FormData) => {
    if (!editingLink) return;
    
    const linkData = {
      id: editingLink.id,
      title: formData.get('title') as string,
      originalUrl: formData.get('originalUrl') as string,
      description: formData.get('description') as string,
      keywords: (formData.get('keywords') as string)?.split(',').map(k => k.trim()) || [],
      targetKeywords: (formData.get('targetKeywords') as string)?.split(',').map(k => k.trim()) || [],
      priority: parseInt(formData.get('priority') as string) || 50,
      insertionStrategy: formData.get('insertionStrategy') as string || 'manual',
      categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : null,
      siteId: formData.get('siteId') ? parseInt(formData.get('siteId') as string) : null,
      affiliateData: {
        commissionRate: formData.get('commissionRate') ? parseFloat(formData.get('commissionRate') as string) : null
      }
    };
    updateLinkMutation.mutate(linkData);
  };

  const handleCreateCategory = (formData: FormData) => {
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      color: formData.get('color') as string || '#3b82f6',
      isActive: true
    };
    createCategoryMutation.mutate(categoryData);
  };

  if (dashboardLoading || linksLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Intelligent Link Management</h1>
          <p className="text-muted-foreground">
            Manage and optimize your affiliate links across all your sites
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Link Category</DialogTitle>
                <DialogDescription>
                  Organize your links with custom categories
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(new FormData(e.currentTarget)); }}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input id="name" name="name" placeholder="e.g., Tech Products" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Category description..." />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" type="color" defaultValue="#3b82f6" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Intelligent Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Intelligent Link</DialogTitle>
                <DialogDescription>
                  Add a new link with AI-powered insertion capabilities
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateLink(new FormData(e.currentTarget)); }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Link Title</Label>
                      <Input id="title" name="title" placeholder="Product or service name" required />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority (1-100)</Label>
                      <Input id="priority" name="priority" type="number" min="1" max="100" defaultValue="50" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="originalUrl">Original URL</Label>
                    <Input id="originalUrl" name="originalUrl" type="url" placeholder="https://..." required />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Link description and context..." />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input id="keywords" name="keywords" placeholder="smartphone, tech, gadget" />
                    </div>
                    <div>
                      <Label htmlFor="targetKeywords">Target Keywords</Label>
                      <Input id="targetKeywords" name="targetKeywords" placeholder="best phone, top smartphone" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="categoryId">Category</Label>
                      <Select name="categoryId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.map((cat: LinkCategory) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="siteId">Site</Label>
                      <Select name="siteId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sites</SelectItem>
                          {sites.map((site: any) => (
                            <SelectItem key={site.id} value={site.id.toString()}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="insertionStrategy">Insertion Strategy</Label>
                      <Select name="insertionStrategy" defaultValue="manual">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="ai-suggested">AI Suggested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input id="commissionRate" name="commissionRate" type="number" step="0.01" placeholder="5.00" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={createLinkMutation.isPending}>
                    {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Intelligent Links</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.summary?.totalLinks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active intelligent links
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.summary?.totalClicks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all links
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.summary?.avgCTR || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Average across all links
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData?.summary?.totalRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Affiliate commissions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Links */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Links</CardTitle>
              <CardDescription>Links with the highest click-through rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.topLinks?.slice(0, 5).map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{link.title}</h4>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{link.performance.totalClicks} clicks</div>
                      <div className="text-sm text-muted-foreground">
                        {link.performance.clickThroughRate.toFixed(1)}% CTR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search links..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((cat: LinkCategory) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSite} onValueChange={setFilterSite}>
                  <SelectTrigger className="w-[180px]">
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {sites.map((site: any) => (
                      <SelectItem key={site.id} value={site.id.toString()}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Links Grid */}
          <div className="grid gap-6">
            {filteredLinks.map((link: IntelligentLink) => (
              <Card key={link.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{link.title}</h3>
                        <Badge variant={link.isActive ? 'default' : 'secondary'}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {link.insertionStrategy}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Target className="w-3 h-3" />
                          Priority: {link.priority}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{link.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <a 
                          href={link.originalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Link
                        </a>
                        {link.keywords && link.keywords.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Keywords:</span>
                            <span>{link.keywords.slice(0, 3).join(', ')}</span>
                            {link.keywords.length > 3 && (
                              <span className="text-muted-foreground">+{link.keywords.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLink(link)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLinkMutation.mutate(link.id)}
                        disabled={deleteLinkMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-4">
            {categories.map((category: LinkCategory) => (
              <Card key={category.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Link Performance Analytics</CardTitle>
              <CardDescription>Detailed performance metrics for all your intelligent links</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboardData?.linkStats?.map((link: any) => (
                  <div key={link.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{link.title}</h4>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                      </div>
                      <Badge variant="outline">
                        {link.performance.clickThroughRate.toFixed(1)}% CTR
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{link.performance.totalViews}</div>
                        <div className="text-sm text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{link.performance.totalClicks}</div>
                        <div className="text-sm text-muted-foreground">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ${link.performance.totalRevenue.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {link.performance.clickThroughRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">CTR</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Click Performance</span>
                        <span>{link.performance.clickThroughRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={link.performance.clickThroughRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Link Dialog */}
      {editingLink && (
        <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Intelligent Link</DialogTitle>
              <DialogDescription>
                Update link details and settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateLink(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Link Title</Label>
                    <Input 
                      id="edit-title" 
                      name="title" 
                      defaultValue={editingLink.title}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority (1-100)</Label>
                    <Input 
                      id="edit-priority" 
                      name="priority" 
                      type="number" 
                      min="1" 
                      max="100" 
                      defaultValue={editingLink.priority}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-originalUrl">Original URL</Label>
                  <Input 
                    id="edit-originalUrl" 
                    name="originalUrl" 
                    type="url" 
                    defaultValue={editingLink.originalUrl}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    defaultValue={editingLink.description}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-keywords">Keywords</Label>
                    <Input 
                      id="edit-keywords" 
                      name="keywords" 
                      defaultValue={editingLink.keywords.join(', ')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-targetKeywords">Target Keywords</Label>
                    <Input 
                      id="edit-targetKeywords" 
                      name="targetKeywords" 
                      defaultValue={editingLink.targetKeywords.join(', ')}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-categoryId">Category</Label>
                    <Select name="categoryId" defaultValue={editingLink.categoryId?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((cat: LinkCategory) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-siteId">Site</Label>
                    <Select name="siteId" defaultValue={editingLink.siteId?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sites</SelectItem>
                        {sites.map((site: any) => (
                          <SelectItem key={site.id} value={site.id.toString()}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-insertionStrategy">Strategy</Label>
                    <Select name="insertionStrategy" defaultValue={editingLink.insertionStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="ai-suggested">AI Suggested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-commissionRate">Commission Rate (%)</Label>
                  <Input 
                    id="edit-commissionRate" 
                    name="commissionRate" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingLink.affiliateData?.commissionRate}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={updateLinkMutation.isPending}>
                  {updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}