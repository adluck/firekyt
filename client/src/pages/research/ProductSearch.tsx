import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Star, DollarSign, ExternalLink, TrendingUp, Target, Package, ShoppingCart, BarChart3, AlertCircle, Filter, CheckCircle, XCircle, Clock, Store, Tag, Plus, Trash2, Link } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// SERP API Product Research Interfaces
interface ProductData {
  id: string;
  title: string;
  brand?: string;
  url: string;
  price?: {
    value: number;
    currency: string;
    displayValue: string;
  };
  image_url?: string;
  description?: string;
  source?: string;
  // Enhanced AI scoring fields
  affiliate_score?: number;
  difficulty_assessment?: string;
  affiliate_potential?: string;
  market_competitiveness?: string;
  trending_score?: number;
  commission_rate?: number;
  scoring_breakdown?: {
    availability_score: number;
    price_score: number;
    review_score: number;
    market_score: number;
    affiliate_score: number;
    data_score: number;
    brand_score: number;
  };
}

interface SearchResult {
  success: boolean;
  query?: string;
  keyword?: string;
  products: ProductData[];
  session_data?: {
    research_duration_ms: number;
    api_calls: number;
    api_sources: string[];
    total_products_found: number;
  };
  marketInsights?: {
    totalProducts: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    topVendors: string[];
    scoring_summary?: {
      average_score: number;
      high_potential_count: number;
      market_competitiveness: string;
    };
  };
  totalResults: number;
  source: string;
  researchDate?: string;
  scoring?: {
    average_score: number;
    high_potential_count: number;
    market_competitiveness: string;
  };
}

// Enhanced Product Card Component with SERP API Integration
function EnhancedProductCard({ product }: { product: ProductData }) {
  const affiliateScore = product.affiliate_score || 0;
  const scoringBreakdown = product.scoring_breakdown;
  
  // Get color for score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-green-600";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-red-600";
  };

  // Determine marketplace from product data
  const getMarketplace = () => {
    if (product.source?.includes('amazon')) return { name: 'Amazon', color: 'bg-orange-100 text-orange-800', icon: '🛒' };
    if (product.source?.includes('walmart')) return { name: 'Walmart', color: 'bg-blue-100 text-blue-800', icon: '🏪' };
    if (product.source?.includes('ebay')) return { name: 'eBay', color: 'bg-yellow-100 text-yellow-800', icon: '🛍️' };
    return { name: product.source || 'Online Store', color: 'bg-gray-100 text-gray-800', icon: '📦' };
  };

  const marketplace = getMarketplace();

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {product.image_url && (
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border">
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-base line-clamp-2 flex-1">{product.title}</CardTitle>
              <div className="flex items-center gap-1 ml-2">
                {product.price ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Price Unavailable
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge className={marketplace.color} variant="secondary">
                <Store className="w-3 h-3 mr-1" />
                {marketplace.name}
              </Badge>
              {product.brand && (
                <Badge variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {product.brand}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">
                  {product.price?.displayValue || product.price?.value ? `$${product.price.value}` : 'Price not available'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {product.price.currency}
                </span>
              </div>
              {product.ASIN && (
                <Badge variant="outline" className="text-xs font-mono">
                  ASIN: {product.ASIN}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Enhanced Affiliate Score Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Affiliate Score</span>
            <span className={`text-lg font-bold ${getScoreColor(affiliateScore)}`}>
              {affiliateScore}/100
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(affiliateScore)} transition-all duration-300`}
              style={{ width: `${affiliateScore}%` }}
            />
          </div>

          {/* Difficulty Assessment & Affiliate Potential */}
          <div className="flex gap-2 flex-wrap">
            {product.difficulty_assessment && (
              <Badge variant="outline" className="text-xs">
                {product.difficulty_assessment}
              </Badge>
            )}
            {product.affiliate_potential && (
              <Badge variant="outline" className="text-xs">
                {product.affiliate_potential} Potential
              </Badge>
            )}
          </div>

          {/* Detailed Score Breakdown */}
          {scoringBreakdown && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <span className="font-medium">{scoringBreakdown.availability_score}/15</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">{scoringBreakdown.price_score}/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Reviews:</span>
                  <span className="font-medium">{scoringBreakdown.review_score}/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Market:</span>
                  <span className="font-medium">{scoringBreakdown.market_score}/15</span>
                </div>
                <div className="flex justify-between">
                  <span>Affiliate:</span>
                  <span className="font-medium">{scoringBreakdown.affiliate_score}/15</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span className="font-medium">{scoringBreakdown.data_score}/10</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button asChild size="sm" className="flex-1">
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Product
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Market Research Summary Component
function MarketResearchSummary({ searchResult }: { searchResult: SearchResult }) {
  const scoring = searchResult.scoring || searchResult.marketInsights?.scoring_summary;
  
  if (!scoring) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Market Research Summary
        </CardTitle>
        <CardDescription>
          Comprehensive analysis for "{searchResult.keyword || searchResult.query}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary mb-1">
              {scoring.average_score.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {scoring.high_potential_count}
            </div>
            <div className="text-sm text-muted-foreground">High Potential</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium text-center">
              {scoring.market_competitiveness}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Market Competitiveness</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");

  // SERP API Research with mutation
  const researchMutation = useMutation({
    mutationFn: async (query: string) => {
      if (!query.trim()) {
        throw new Error('Please enter a search keyword or product name');
      }

      const response = await apiRequest('POST', '/api/research-products', { 
        niche: query.trim(),
        max_results: 20,
        min_commission_rate: 3.0,
        min_trending_score: 50.0
      });
      return await response.json();
    }
  });

  const handleSearch = () => {
    setCurrentQuery(searchQuery);
    researchMutation.mutate(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter and sort products based on user selections
  const filteredProducts = researchMutation.data?.products ? 
    researchMutation.data.products
      .filter(product => {
        if (marketplaceFilter === "amazon" && !product.source?.includes('amazon')) return false;
        if (marketplaceFilter === "walmart" && !product.source?.includes('walmart')) return false;
        if (availabilityFilter === "available" && !product.price) return false;
        if (availabilityFilter === "unavailable" && product.price) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return (a.price?.value || 0) - (b.price?.value || 0);
          case "price-high":
            return (b.price?.value || 0) - (a.price?.value || 0);
          case "score":
            return (b.affiliate_score || 0) - (a.affiliate_score || 0);
          default:
            return 0;
        }
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Keyword Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Product Research with SERP API
          </CardTitle>
          <CardDescription>
            Search for affiliate products using keywords with intelligent AI scoring and market analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter product keywords (e.g., wireless headphones, gaming keyboards)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={researchMutation.isPending || !searchQuery.trim()}
              className="whitespace-nowrap"
            >
              {researchMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Research Products
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Research Results */}
      {researchMutation.isPending && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {researchMutation.error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {researchMutation.error instanceof Error 
              ? researchMutation.error.message 
              : "Failed to research products. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {researchMutation.data && (
        <div className="space-y-6">
          {/* Market Research Summary */}
          <MarketResearchSummary searchResult={researchMutation.data} />

          {/* Enhanced Filters and Controls */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter & Sort Results
              </CardTitle>
              <CardDescription>
                Refine your search results by marketplace, availability, and sorting preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Marketplace:</label>
                  <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="amazon">
                        <span className="flex items-center gap-2">
                          🛒 Amazon
                        </span>
                      </SelectItem>
                      <SelectItem value="shopify">
                        <span className="flex items-center gap-2">
                          🏪 Shopify
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Availability:</label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="available">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Available
                        </span>
                      </SelectItem>
                      <SelectItem value="unavailable">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Unavailable
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sort by:</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="score">Affiliate Score</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="secondary" className="text-sm">
                    {filteredProducts.length} products found
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Data Status */}
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Live Data Source:</strong> Product information, pricing, and availability updated from real-time marketplace APIs.
              {researchMutation.data?.source && ` Source: ${researchMutation.data.source}`}
            </AlertDescription>
          </Alert>

          {/* Enhanced Products Grid */}
          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Product Results ({filteredProducts.length})
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div className="grid gap-4">
                  {filteredProducts.map((product) => (
                    <EnhancedProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No products match your filters</p>
                <p className="text-sm">
                  Try adjusting your marketplace, availability, or sorting preferences
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!currentQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Your Product Research</h3>
            <p className="text-muted-foreground mb-4">
              Enter product keywords above to discover affiliate opportunities with enhanced AI scoring
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["wireless headphones", "gaming keyboards", "fitness trackers", "smart home devices"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setCurrentQuery(suggestion);
                    researchMutation.mutate(suggestion);
                  }}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}