import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  TrendingUp, 
  DollarSign, 
  Star, 
  Eye, 
  Clock, 
  BarChart3, 
  Package, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Target,
  Filter,
  Download
} from 'lucide-react';

const researchFormSchema = z.object({
  niche: z.string().min(1, "Niche is required"),
  productCategory: z.string().optional(),
  minCommissionRate: z.number().min(0).max(100).default(3),
  minTrendingScore: z.number().min(0).max(100).default(50),
  maxResults: z.number().min(1).max(100).default(50),
  targetKeywords: z.string().optional(),
  minPrice: z.number().min(0).default(0),
  maxPrice: z.number().min(0).default(10000),
  saveToDatabase: z.boolean().default(true)
});

type ResearchFormData = z.infer<typeof researchFormSchema>;

interface Product {
  id: number;
  title: string;
  description: string;
  brand?: string;
  category: string;
  niche: string;
  price?: string;
  originalPrice?: string;
  commissionRate?: string;
  commissionAmount?: string;
  productUrl?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  asin?: string;
  rating?: string;
  reviewCount?: number;
  salesRank?: number;
  trendingScore?: string;
  competitionScore?: string;
  researchScore?: string;
  keywords?: string[];
  searchVolume?: number;
  difficulty?: number;
  apiSource: string;
  tags?: string[];
  createdAt: string;
}

interface ResearchSession {
  id: number;
  niche: string;
  productCategory?: string;
  totalProductsFound?: number;
  productsStored?: number;
  averageScore?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface SerpProduct {
  title: string;
  price: number;
  rating: number;
  reviews: number;
  source: string;
  link: string;
  thumbnail: string;
  delivery: string;
  extensions: string[];
}

interface AffiliateOpportunity {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface PriceAnalysis {
  min: number;
  max: number;
  average: number;
  count: number;
}

interface ProductSearchResult {
  success: boolean;
  query: string;
  products: SerpProduct[];
  affiliateOpportunities: AffiliateOpportunity[];
  priceAnalysis: PriceAnalysis | null;
  totalResults: number;
  searchMetadata: {
    timestamp: string;
    engine: string;
    location: string;
  };
}

export default function ProductResearch() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('research');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  const form = useForm<ResearchFormData>({
    resolver: zodResolver(researchFormSchema),
    defaultValues: {
      niche: '',
      productCategory: '',
      minCommissionRate: 3,
      minTrendingScore: 50,
      maxResults: 50,
      targetKeywords: '',
      minPrice: 0,
      maxPrice: 10000,
      saveToDatabase: true
    }
  });

  // Fetch existing products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: activeTab === 'results'
  });

  // Fetch research sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/research-sessions'],
    enabled: activeTab === 'history'
  });

  // SerpAPI Product Search
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery<ProductSearchResult>({
    queryKey: ['/api/search-affiliate-products', currentQuery],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/search-affiliate-products', { 
        query: currentQuery,
        category: 'general'
      });
      return response.json();
    },
    enabled: !!currentQuery,
  });

  // Research mutation
  const researchMutation = useMutation({
    mutationFn: async (data: ResearchFormData) => {
      const params = new URLSearchParams({
        niche: data.niche,
        ...(data.productCategory && { product_category: data.productCategory }),
        min_commission_rate: data.minCommissionRate.toString(),
        min_trending_score: data.minTrendingScore.toString(),
        max_results: data.maxResults.toString(),
        ...(data.targetKeywords && { target_keywords: data.targetKeywords }),
        min_price: data.minPrice.toString(),
        max_price: data.maxPrice.toString(),
        save_to_database: data.saveToDatabase.toString()
      });

      const response = await apiRequest('GET', `/api/public/research-products?${params}`);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Research data received:', data);
      setResearchResults(data);
      setIsResearching(false);
      toast({
        title: "Research Complete",
        description: `Found ${data.products?.length || 0} products with average score of ${data.session_data?.average_score || 'N/A'}`
      });
      // Force refresh the products list to show new research results
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/research-sessions'] });
      setActiveTab('results');
    },
    onError: (error: any) => {
      setIsResearching(false);
      toast({
        title: "Research Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ResearchFormData) => {
    setIsResearching(true);
    setResearchResults(null);
    researchMutation.mutate(data);
  };

  const getScoreColor = (score: string | undefined) => {
    if (!score) return 'text-gray-500';
    const numScore = parseFloat(score);
    if (numScore >= 80) return 'text-green-600';
    if (numScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: string | undefined) => {
    if (!score) return 'secondary';
    const numScore = parseFloat(score);
    if (numScore >= 80) return 'default';
    if (numScore >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Research Engine</h1>
          <p className="text-muted-foreground">Advanced AI-powered affiliate product discovery and scoring</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Target className="w-4 h-4 mr-1" />
          Beta
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="research">AI Research</TabsTrigger>
          <TabsTrigger value="search">Product Search</TabsTrigger>
          <TabsTrigger value="results">Results ({Array.isArray(products) ? products.length : 0})</TabsTrigger>
          <TabsTrigger value="history">History ({Array.isArray(sessions) ? sessions.length : 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Research Configuration
              </CardTitle>
              <CardDescription>
                Configure parameters for AI-powered product research with real API data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="niche"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Niche *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., fitness, tech gadgets, home decor" {...field} />
                          </FormControl>
                          <FormDescription>
                            Primary market niche to research
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="productCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="saas">SaaS & Software</SelectItem>
                              <SelectItem value="health">Health & Fitness</SelectItem>
                              <SelectItem value="home">Home & Garden</SelectItem>
                              <SelectItem value="fashion">Fashion</SelectItem>
                              <SelectItem value="sports">Sports & Outdoors</SelectItem>
                              <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                              <SelectItem value="books">Books</SelectItem>
                              <SelectItem value="automotive">Automotive</SelectItem>
                              <SelectItem value="toys">Toys & Games</SelectItem>
                              <SelectItem value="kitchen">Kitchen & Dining</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="targetKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Keywords</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="smartphone, wireless, portable, premium (comma separated)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Specific keywords to focus the research
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="minCommissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Commission Rate: {field.value}%</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={20}
                              step={0.5}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum commission percentage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minTrendingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Trending Score: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum trend popularity score
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="minPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Price ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 10000)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxResults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Results</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="saveToDatabase"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Save Results</FormLabel>
                          <FormDescription>
                            Save research results to your product database
                          </FormDescription>
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

                  <Button type="submit" disabled={isResearching} className="w-full">
                    {isResearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Researching Products...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Start Product Research
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {researchResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Research Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{researchResults.total_found}</div>
                    <div className="text-sm text-muted-foreground">Products Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {researchResults.session_data?.average_score || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {researchResults.session_data?.api_sources?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">API Sources</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round((researchResults.session_data?.research_duration_ms || 0) / 1000)}s
                    </div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Research session #{researchResults.research_session_id} completed successfully.
                    {researchResults.saved_to_database && ' Results saved to your product database.'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Real-Time Product Search
              </CardTitle>
              <CardDescription>
                Search for affiliate products using live market data from Google Shopping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search for products (e.g., wireless headphones, fitness trackers)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentQuery(searchQuery);
                    }
                  }}
                />
                <Button 
                  onClick={() => setCurrentQuery(searchQuery)}
                  disabled={!searchQuery || searchLoading}
                >
                  {searchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {searchError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Search failed: {searchError.message}
                  </AlertDescription>
                </Alert>
              )}

              {searchResults && (
                <div className="space-y-6">
                  {/* Price Analysis Summary */}
                  {searchResults.priceAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Price Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              ${searchResults.priceAnalysis.min.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Min Price</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              ${searchResults.priceAnalysis.average.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Price</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">
                              ${searchResults.priceAnalysis.max.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Max Price</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              {searchResults.priceAnalysis.count}
                            </div>
                            <div className="text-sm text-muted-foreground">Products</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Products Grid */}
                  {searchResults.products && searchResults.products.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Product Results</span>
                          <Badge variant="outline">{searchResults.products.length} found</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.products.map((product: any, index: number) => (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex flex-col h-full">
                                  {product.thumbnail && (
                                    <img 
                                      src={product.thumbnail} 
                                      alt={product.title}
                                      className="w-full h-32 object-cover rounded-md mb-2"
                                    />
                                  )}
                                  <h3 className="font-medium text-sm mb-2 line-clamp-2">
                                    {product.title}
                                  </h3>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-bold text-green-600">
                                      ${product.price}
                                    </span>
                                    {product.rating > 0 && (
                                      <div className="flex items-center">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm ml-1">{product.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-2">
                                    {product.source} • {product.reviews} reviews
                                  </div>
                                  {product.delivery && (
                                    <div className="text-xs text-blue-600 mb-2">
                                      {product.delivery}
                                    </div>
                                  )}
                                  <div className="mt-auto pt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => window.open(product.link, '_blank')}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      View Product
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Affiliate Opportunities */}
                  {searchResults.affiliateOpportunities && searchResults.affiliateOpportunities.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <DollarSign className="w-5 h-5 mr-2" />
                          Affiliate Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {searchResults.affiliateOpportunities.map((opportunity: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3 hover:bg-muted/50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm mb-1">{opportunity.title}</h4>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {opportunity.snippet}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    Position #{opportunity.position}
                                  </Badge>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(opportunity.link, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {currentQuery && !searchLoading && !searchResults && !searchError && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No results found for "{currentQuery}"</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Research Results
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {researchResults?.products?.length || 0} products
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={
                      researchResults?.session_data?.data_source === 'live_data'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-100"
                    }
                  >
                    {researchResults?.session_data?.data_source === 'live_data' ? '🔴 Live Data' : '📝 Sample Data'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!researchResults?.products || researchResults.products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No research results yet. Run a research session to discover products.
                </div>
              ) : (
                <div className="grid gap-4">
                  {researchResults.products.map((product: any, index: number) => (
                    <Card key={product.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {product.description?.substring(0, 120)}...
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="outline">{product.niche}</Badge>
                              <Badge variant="outline">{product.category}</Badge>
                              {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                              <Badge 
                                variant="outline" 
                                className={product.apiSource === 'serpapi_live' 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100" 
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-100"
                                }
                              >
                                {product.apiSource === 'serpapi_live' ? 'Live Data' : 'Sample Data'}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-20 h-20 rounded ml-4 flex-shrink-0 overflow-hidden border border-blue-200 dark:border-blue-700">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex flex-col items-center justify-center text-blue-600 dark:text-blue-300">
                                        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                        </svg>
                                        <span class="text-xs font-medium">Product</span>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex flex-col items-center justify-center text-blue-600 dark:text-blue-300">
                                <Package className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">Product</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-green-600">
                              ${product.price || 'N/A'}
                            </div>
                            <div className="text-muted-foreground">Price</div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {product.commissionRate ? `${product.commissionRate}%` : 'N/A'}
                            </div>
                            <div className="text-muted-foreground">Commission</div>
                          </div>
                          <div>
                            <div className={`font-medium ${getScoreColor(product.researchScore)}`}>
                              {product.researchScore || 'N/A'}
                            </div>
                            <div className="text-muted-foreground">Research Score</div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {product.rating ? `${product.rating}⭐` : 'N/A'}
                            </div>
                            <div className="text-muted-foreground">Rating</div>
                          </div>
                          <div className="flex gap-2">
                            {product.affiliateUrl && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                                <a 
                                  href={product.affiliateUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-xs font-medium">Earn ${product.commissionAmount}</span>
                                </a>
                              </Button>
                            )}
                            {(product.productUrl || product.affiliateUrl) && (
                              <Button size="sm" variant="outline" asChild>
                                <a 
                                  href={product.productUrl || product.affiliateUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="text-xs">View Product</span>
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        {product.keywords && product.keywords.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex flex-wrap gap-1">
                              {product.keywords.slice(0, 5).map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                              {product.keywords.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{product.keywords.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Research History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No research sessions found.
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session: ResearchSession) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{session.niche}</Badge>
                            {session.productCategory && (
                              <Badge variant="secondary">{session.productCategory}</Badge>
                            )}
                            <Badge 
                              variant={
                                session.status === 'completed' ? 'default' :
                                session.status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {session.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{session.totalProductsFound || 0}</div>
                            <div className="text-muted-foreground">Products Found</div>
                          </div>
                          <div>
                            <div className="font-medium">{session.productsStored || 0}</div>
                            <div className="text-muted-foreground">Products Saved</div>
                          </div>
                          <div>
                            <div className="font-medium">{session.averageScore || 'N/A'}</div>
                            <div className="text-muted-foreground">Avg Score</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}