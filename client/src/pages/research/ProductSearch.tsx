import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, DollarSign, ExternalLink, TrendingUp, Target, Package } from "lucide-react";
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

export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  const { data: searchResults, isLoading, error, refetch } = useQuery<ProductSearchResult>({
    queryKey: ['/api/search-affiliate-products', currentQuery],
    queryFn: () => apiRequest('POST', '/api/search-affiliate-products', { 
      query: currentQuery,
      category: 'general'
    }),
    enabled: !!currentQuery,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentQuery(searchQuery.trim());
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Affiliate Product Search</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Search for products and discover affiliate opportunities using real market data
        </p>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Product Search
          </CardTitle>
          <CardDescription>
            Enter a product or niche to find affiliate opportunities
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
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : 'Failed to search products'}
            </p>
          </CardContent>
        </Card>
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

      {searchResults && (
        <div className="space-y-6">
          {/* Search Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Search Results for "{searchResults.query}"
              </CardTitle>
              <CardDescription>
                Found {searchResults.totalResults.toLocaleString()} products • 
                Searched on {new Date(searchResults.searchMetadata.timestamp).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            {searchResults.priceAnalysis && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="text-sm text-gray-500">Products Analyzed</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Products Grid */}
          {searchResults.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({searchResults.products.length})
                </CardTitle>
                <CardDescription>
                  Popular products in this category with pricing and ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.products.map((product, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {product.thumbnail && (
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-800 rounded-lg"
                            />
                          )}
                          
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                              {product.title}
                            </h3>
                            
                            {product.price && (
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-bold text-lg text-green-600">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            )}

                            {product.rating && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                  {renderStars(product.rating)}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {product.rating} ({product.reviews} reviews)
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">{product.source}</Badge>
                              {product.link && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={product.link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                              )}
                            </div>

                            {product.delivery && (
                              <p className="text-xs text-gray-500 mt-2">
                                📦 {product.delivery}
                              </p>
                            )}
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
          {searchResults.affiliateOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Affiliate Opportunities ({searchResults.affiliateOpportunities.length})
                </CardTitle>
                <CardDescription>
                  Related affiliate programs and review sites in this niche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.affiliateOpportunities.map((opportunity, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-2 line-clamp-1">
                              {opportunity.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {opportunity.snippet}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{opportunity.position}</Badge>
                              <Button size="sm" variant="outline" asChild>
                                <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Explore
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
        </div>
      )}
    </div>
  );
}