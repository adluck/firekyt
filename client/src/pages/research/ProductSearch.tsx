import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Star, DollarSign, ExternalLink, TrendingUp, Target, Package, ShoppingCart, BarChart3, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Enhanced Scoring Interfaces
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
  // Enhanced scoring fields
  affiliate_score?: number;
  difficulty_assessment?: string;
  affiliate_potential?: string;
  market_competitiveness?: string;
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

// Enhanced Product Card Component
function EnhancedProductCard({ product }: { product: RyeProduct }) {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {product.images?.[0]?.url && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2">{product.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {product.vendor}
              </Badge>
              <span className="text-lg font-semibold text-primary">
                {product.price.displayValue}
              </span>
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
function MarketResearchSummary({ searchResult }: { searchResult: RyeSearchResult }) {
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

  // Rye.com Enhanced Research API
  const { 
    data: ryeResearchResults, 
    isLoading: ryeResearchLoading, 
    error: ryeResearchError 
  } = useQuery<RyeSearchResult>({
    queryKey: ['/api/rye/research-product', currentQuery],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/rye/research-product', { 
        keyword: currentQuery 
      });
      return await response.json();
    },
    enabled: !!currentQuery,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentQuery(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Real-Time Product Search
          </CardTitle>
          <CardDescription>
            Search for affiliate products using live market data with enhanced AI scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. wireless headphones, gaming keyboards, fitness trackers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={!searchQuery.trim() || ryeResearchLoading}
              className="px-6"
            >
              {ryeResearchLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {ryeResearchLoading && (
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

      {ryeResearchError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {ryeResearchError instanceof Error 
              ? ryeResearchError.message 
              : "Failed to search products. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {ryeResearchResults && (
        <div className="space-y-6">
          {/* Market Research Summary */}
          <MarketResearchSummary searchResult={ryeResearchResults} />

          {/* Products Grid */}
          {ryeResearchResults.products && ryeResearchResults.products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Enhanced Research Results ({ryeResearchResults.products.length})
                </h3>
                <Badge variant="outline">
                  {ryeResearchResults.source} API
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {ryeResearchResults.products.map((product) => (
                  <EnhancedProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {ryeResearchResults.products && ryeResearchResults.products.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try searching for a different product category or keyword
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!currentQuery && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Your Product Research</h3>
            <p className="text-muted-foreground mb-4">
              Enter a product keyword above to discover affiliate opportunities with enhanced AI scoring
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