import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, DollarSign, ExternalLink, TrendingUp, Target, Package, ShoppingCart, BarChart3, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Product {
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
  products: Product[];
  affiliateOpportunities: AffiliateOpportunity[];
  priceAnalysis: PriceAnalysis | null;
  totalResults: number;
  searchMetadata: {
    timestamp: string;
    engine: string;
    location: string;
  };
}

// Rye.com API interfaces
interface RyeProduct {
  id: string;
  title: string;
  vendor: string;
  url: string;
  isAvailable: boolean;
  images: Array<{ url: string }>;
  price: {
    displayValue: string;
    value: number;
    currency: string;
  };
  ASIN?: string;
  productType?: string;
  description?: string;
}

interface RyeSearchResult {
  success: boolean;
  query?: string;
  keyword?: string;
  products: RyeProduct[];
  marketInsights?: {
    totalProducts: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    topVendors: string[];
  };
  totalResults: number;
  source: string;
  researchDate?: string;
}

export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [searchEngine, setSearchEngine] = useState<'serp' | 'rye' | 'both'>('rye');
  const [activeTab, setActiveTab] = useState('search');

  // SERP API Search
  const { data: searchResults, isLoading: serpLoading, error: serpError } = useQuery<ProductSearchResult>({
    queryKey: ['/api/search-affiliate-products', currentQuery],
    queryFn: () => apiRequest('POST', '/api/search-affiliate-products', { 
      query: currentQuery,
      category: 'general'
    }),
    enabled: false, // Disabled SERP API for Rye-only optimization
  });

  // Rye API Search
  const { data: ryeSearchResults, isLoading: ryeLoading, error: ryeError } = useQuery<RyeSearchResult>({
    queryKey: ['/api/rye/search-products', currentQuery],
    queryFn: () => apiRequest('POST', '/api/rye/search-products', { 
      query: currentQuery,
      limit: 20
    }),
    enabled: !!currentQuery, // Always enabled for Rye-only optimization
  });

  // Rye Product Research (Advanced)
  const { data: ryeResearchResults, isLoading: ryeResearchLoading, error: ryeResearchError } = useQuery<RyeSearchResult>({
    queryKey: ['/api/rye/research-product', currentQuery],
    queryFn: () => apiRequest('POST', '/api/rye/research-product', { 
      keyword: currentQuery
    }),
    enabled: !!currentQuery && activeTab === 'research',
  });

  // Test Rye Connection
  const { data: ryeConnection } = useQuery({
    queryKey: ['/api/rye/test-connection'],
    queryFn: () => apiRequest('GET', '/api/rye/test-connection'),
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentQuery(searchQuery.trim());
    }
  };

  const isLoading = ryeLoading || ryeResearchLoading;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  const renderRyeProduct = (product: RyeProduct) => (
    <Card key={product.id} className="h-full">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {product.images[0] && (
            <img 
              src={product.images[0].url} 
              alt={product.title}
              className="w-20 h-20 object-cover rounded-md flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{product.vendor}</Badge>
              {product.ASIN && <Badge variant="outline" className="text-xs">Amazon</Badge>}
              {product.isAvailable ? (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">{product.price.displayValue}</span>
              <Button size="sm" variant="outline" asChild>
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enhanced Product Research</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Fast product research powered by Rye.com's multi-marketplace data with real-time inventory and pricing
        </p>
        
        {/* Rye Connection Status */}
        {ryeConnection && (
          <Alert className={`mt-4 ${ryeConnection.success ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={ryeConnection.success ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}>
              {ryeConnection.success 
                ? 'Rye.com API connected successfully - Enhanced product research available'
                : 'Rye.com API not configured - Add RYE_API_KEY to enable advanced features'
              }
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Product Search</TabsTrigger>
          <TabsTrigger value="research">Market Research</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Rye.com Product Search
              </CardTitle>
              <CardDescription>
                Fast multi-marketplace search with real-time inventory, pricing, and vendor data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., wireless headphones, gaming keyboards, fitness trackers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={!searchQuery.trim() || isLoading}>
                  {isLoading ? 'Searching...' : 'Search Products'}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="outline" className="text-xs">Optimized for Speed</Badge>
                <span>•</span>
                <span>Powered by Rye.com multi-marketplace data</span>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          {ryeError && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-600 dark:text-red-400">
                Product search failed: {ryeError instanceof Error ? ryeError.message : 'Please try again or check your connection'}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rye API Results - Primary */}
          {ryeSearchResults && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Product Results for "{currentQuery}"
                  </CardTitle>
                  <CardDescription>
                    Found {ryeSearchResults.totalResults} products from multiple e-commerce platforms
                  </CardDescription>
                </CardHeader>
              </Card>

              {ryeSearchResults.products && ryeSearchResults.products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Available Products ({ryeSearchResults.products.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ryeSearchResults.products.map((product) => renderRyeProduct(product))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* SERP API Results - Secondary/Optional */}
          {searchResults && searchEngine !== 'rye' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    SERP API Results for "{searchResults.query}"
                  </CardTitle>
                  <CardDescription>
                    Found {searchResults.totalResults.toLocaleString()} products from {searchResults.searchMetadata.engine}
                  </CardDescription>
                </CardHeader>
                {searchResults.priceAnalysis && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(searchResults.priceAnalysis.min)}
                        </div>
                        <div className="text-sm text-gray-500">Lowest Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPrice(searchResults.priceAnalysis.average)}
                        </div>
                        <div className="text-sm text-gray-500">Average Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {formatPrice(searchResults.priceAnalysis.max)}
                        </div>
                        <div className="text-sm text-gray-500">Highest Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {searchResults.priceAnalysis.count}
                        </div>
                        <div className="text-sm text-gray-500">Total Products</div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {searchResults.products && searchResults.products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Results ({searchResults.products.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.products.map((product, index) => (
                        <Card key={index} className="h-full">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {product.thumbnail && (
                                <img 
                                  src={product.thumbnail} 
                                  alt={product.title}
                                  className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.title}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">{product.source}</Badge>
                                  {product.delivery && <Badge variant="outline" className="text-xs">{product.delivery}</Badge>}
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {renderStars(product.rating)}
                                  <span className="text-sm text-gray-600">({product.reviews})</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {searchResults.affiliateOpportunities && searchResults.affiliateOpportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Affiliate Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {searchResults.affiliateOpportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                          <Badge className="mt-1">{opportunity.position}</Badge>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{opportunity.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">{opportunity.snippet}</p>
                            <Button size="sm" variant="outline" asChild>
                              <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Explore Opportunity
                              </a>
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


        </TabsContent>

        {/* Market Research Tab */}
        <TabsContent value="research" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Market Research
              </CardTitle>
              <CardDescription>
                Deep market insights and competitor analysis powered by Rye.com
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., gaming laptops, fitness equipment, smart home"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={!searchQuery.trim() || ryeResearchLoading}>
                  {ryeResearchLoading ? 'Researching...' : 'Research Market'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {ryeResearchError && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-600 dark:text-red-400">
                Research Error: {ryeResearchError instanceof Error ? ryeResearchError.message : 'Market research failed'}
              </AlertDescription>
            </Alert>
          )}

          {ryeResearchLoading && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3">Analyzing market data...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {ryeResearchResults && ryeResearchResults.marketInsights && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Insights for "{ryeResearchResults.keyword}"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {ryeResearchResults.marketInsights.totalProducts}
                      </div>
                      <div className="text-sm text-gray-500">Total Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${ryeResearchResults.marketInsights.averagePrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Average Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ${ryeResearchResults.marketInsights.priceRange.min} - ${ryeResearchResults.marketInsights.priceRange.max}
                      </div>
                      <div className="text-sm text-gray-500">Price Range</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {ryeResearchResults.marketInsights.topVendors.length}
                      </div>
                      <div className="text-sm text-gray-500">Top Vendors</div>
                    </div>
                  </div>
                  
                  {ryeResearchResults.marketInsights.topVendors.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Top Vendors</h4>
                      <div className="flex flex-wrap gap-2">
                        {ryeResearchResults.marketInsights.topVendors.map((vendor, index) => (
                          <Badge key={index} variant="outline">{vendor}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {ryeResearchResults.products && ryeResearchResults.products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Research Products ({ryeResearchResults.products.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ryeResearchResults.products.map((product) => renderRyeProduct(product))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}