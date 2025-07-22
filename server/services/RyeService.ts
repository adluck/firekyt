import { GraphQLClient, gql } from 'graphql-request';

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
  products: RyeProduct[];
  totalCount: number;
}

export class RyeService {
  private client: GraphQLClient;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RYE_API_KEY || '';
    this.client = new GraphQLClient('https://graphql.api.rye.com/v1/query');
    
    if (!this.apiKey) {
      console.warn('RYE_API_KEY not found in environment variables');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Basic ${this.apiKey}`,
      'Rye-Shopper-IP': '127.0.0.1' // Required for fraud detection
    };
  }

  // Request product by Amazon URL
  async requestProductByURL(url: string): Promise<{ productId: string | null; error?: string }> {
    try {
      const mutation = gql`
        mutation RequestAmazonProductByURL($input: RequestAmazonProductByURLInput!) {
          requestAmazonProductByURL(input: $input) {
            productId
          }
        }
      `;

      const variables = {
        input: { url }
      };

      const data: any = await this.client.request(mutation, variables, this.getHeaders());
      return { productId: data.requestAmazonProductByURL.productId };
    } catch (error: any) {
      console.error('Rye requestProductByURL error:', error);
      return { productId: null, error: error.message };
    }
  }

  // Fetch product details by ID
  async getProductById(id: string, marketplace: 'AMAZON' | 'SHOPIFY' = 'AMAZON'): Promise<{ product: RyeProduct | null; error?: string }> {
    try {
      const query = gql`
        query ProductByID($input: ProductByIDInput!) {
          product: productByID(input: $input) {
            id
            title
            vendor
            url
            isAvailable
            images { url }
            price { 
              displayValue 
              value 
              currency 
            }
            description
            ... on AmazonProduct { 
              ASIN 
              reviews {
                rating
                count
              }
              features
              specifications {
                name
                value
              }
            }
            ... on ShopifyProduct { 
              productType 
              tags
              options {
                name
                values
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          id,
          marketplace
        }
      };

      const data: any = await this.client.request(query, variables, this.getHeaders());
      return { product: data.product };
    } catch (error: any) {
      console.error('Rye getProductById error:', error);
      return { product: null, error: error.message };
    }
  }

  // Search products by keyword
  async searchProducts(query: string, limit: number = 20): Promise<{ products: RyeProduct[]; error?: string }> {
    try {
      const searchQuery = gql`
        query SearchProducts($input: ProductsInput!) {
          products(input: $input) {
            edges {
              node {
                id
                title
                vendor
                url
                isAvailable
                images { 
                  url 
                }
                price { 
                  displayValue 
                  value 
                  currency 
                }
                ... on AmazonProduct { 
                  ASIN 
                }
                ... on ShopifyProduct { 
                  productType 
                }
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          query,
          first: limit,
          marketplace: 'AMAZON'
        }
      };

      const data: any = await this.client.request(searchQuery, variables, this.getHeaders());
      const products = data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        vendor: edge.node.vendor,
        url: edge.node.url,
        isAvailable: edge.node.isAvailable,
        images: edge.node.images || [],
        price: {
          displayValue: edge.node.price?.displayValue || '$0.00',
          value: edge.node.price?.value || 0,
          currency: edge.node.price?.currency || 'USD'
        },
        ASIN: edge.node.ASIN || undefined,
        productType: edge.node.productType || undefined,
        description: edge.node.description || undefined
      }));
      
      return { products };
    } catch (error: any) {
      console.error('Rye searchProducts error:', error);
      return { products: [], error: error.message };
    }
  }

  // Get product by Amazon URL (combines request and fetch)
  async getProductByAmazonURL(url: string): Promise<{ product: RyeProduct | null; error?: string }> {
    try {
      // First, request the product by URL to get the ID
      const requestResult = await this.requestProductByURL(url);
      if (requestResult.error || !requestResult.productId) {
        return { product: null, error: requestResult.error || 'Failed to request product' };
      }

      // Wait a moment for the product to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then fetch the full product details
      const productResult = await this.getProductById(requestResult.productId, 'AMAZON');
      return productResult;
    } catch (error: any) {
      console.error('Rye getProductByAmazonURL error:', error);
      return { product: null, error: error.message };
    }
  }

  // Get multiple products by their IDs
  async getProductsByIds(ids: string[], marketplace: 'AMAZON' | 'SHOPIFY' = 'AMAZON'): Promise<{ products: RyeProduct[]; errors: string[] }> {
    const results = await Promise.allSettled(
      ids.map(id => this.getProductById(id, marketplace))
    );

    const products: RyeProduct[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.product) {
        products.push(result.value.product);
      } else {
        const error = result.status === 'rejected' ? result.reason.message : result.value.error;
        errors.push(`Product ${ids[index]}: ${error || 'Unknown error'}`);
      }
    });

    return { products, errors };
  }

  // Parse ASIN from Amazon URL
  private extractASINFromURL(url: string): string | null {
    const asinRegex = /\/(?:dp|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})/;
    const match = url.match(asinRegex);
    return match ? match[1] : null;
  }

  // Enhanced product research with real Rye data
  async researchProducts(inputs: Array<{ url?: string; asin?: string }>): Promise<{
    products: Array<RyeProduct & {
      affiliateScore?: number;
      difficultyAssessment?: string;
      affiliatePotential?: string;
      scoringBreakdown?: {
        availability_score: number;
        price_score: number;
        review_score: number;
        market_score: number;
        affiliate_score: number;
        data_score: number;
        brand_score: number;
      };
    }>;
    marketInsights?: {
      totalProducts: number;
      averagePrice: number;
      priceRange: { min: number; max: number };
      topVendors: string[];
    };
    errors?: string[];
  }> {
    try {
      const productIds: string[] = [];
      const errors: string[] = [];

      // Process inputs to extract ASINs or product IDs
      for (const input of inputs) {
        if (input.asin) {
          productIds.push(input.asin);
        } else if (input.url) {
          const asin = this.extractASINFromURL(input.url);
          if (asin) {
            productIds.push(asin);
          } else {
            // Try to request product by URL first
            const requestResult = await this.requestProductByURL(input.url);
            if (requestResult.productId) {
              productIds.push(requestResult.productId);
            } else {
              errors.push(`Invalid URL or unable to extract product ID: ${input.url}`);
            }
          }
        }
      }

      if (productIds.length === 0) {
        return {
          products: [],
          errors: ['No valid product IDs or URLs provided']
        };
      }

      // Get real product data from Rye
      const { products: rawProducts, errors: fetchErrors } = await this.getProductsByIds(productIds);
      errors.push(...fetchErrors);

      // Add AI-powered affiliate scoring to each product
      const enhancedProducts = rawProducts.map(product => {
        // Calculate availability score
        const availabilityScore = product.isAvailable ? 18 : 5;
        
        // Calculate price score (lower prices get higher scores for affiliate potential)
        const priceValue = product.price?.value || 0;
        const priceScore = priceValue > 0 ? Math.min(20, Math.max(5, 25 - Math.floor(priceValue / 10))) : 5;
        
        // Calculate review score (if available)
        const reviewData = (product as any).reviews;
        const reviewScore = reviewData?.rating ? Math.floor(reviewData.rating * 4) : 12;
        
        // Market score based on vendor recognition
        const marketScore = this.calculateMarketScore(product.vendor);
        
        // Affiliate score based on product characteristics
        const affiliateScore = this.calculateAffiliateScore(product);
        
        // Data richness score
        const dataScore = this.calculateDataScore(product);
        
        // Brand strength score
        const brandScore = this.calculateBrandScore(product.vendor);

        const scoringBreakdown = {
          availability_score: availabilityScore,
          price_score: priceScore,
          review_score: reviewScore,
          market_score: marketScore,
          affiliate_score: affiliateScore,
          data_score: dataScore,
          brand_score: brandScore
        };

        const totalScore = Object.values(scoringBreakdown).reduce((sum, score) => sum + score, 0);

        return {
          ...product,
          affiliateScore: totalScore,
          difficultyAssessment: this.getDifficultyAssessment(totalScore),
          affiliatePotential: this.getAffiliatePotential(totalScore),
          scoringBreakdown
        };
      });

      // Calculate market insights
      const marketInsights = this.calculateMarketInsights(enhancedProducts);

      return {
        products: enhancedProducts,
        marketInsights,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error: any) {
      console.error('Rye researchProducts error:', error);
      return {
        products: [],
        errors: [error.message || 'Failed to research products']
      };
    }
  }

  private calculateMarketScore(vendor: string): number {
    // Score based on vendor name recognition
    const recognizedVendors = ['Apple', 'Samsung', 'Sony', 'Nike', 'Amazon', 'Microsoft'];
    return recognizedVendors.some(v => vendor.toLowerCase().includes(v.toLowerCase())) ? 15 : 10;
  }

  private calculateAffiliateScore(product: RyeProduct): number {
    let score = 10; // Base score
    
    // Higher score for electronics and popular categories
    if (product.title.toLowerCase().includes('electronics') || 
        product.title.toLowerCase().includes('headphone') ||
        product.title.toLowerCase().includes('laptop')) {
      score += 5;
    }
    
    // Bonus for Amazon products (higher conversion rates)
    if ((product as any).ASIN) {
      score += 3;
    }

    return Math.min(15, score);
  }

  private calculateDataScore(product: RyeProduct): number {
    let score = 5; // Base score
    
    if (product.description) score += 2;
    if (product.images && product.images.length > 1) score += 2;
    if ((product as any).features) score += 1;
    
    return Math.min(10, score);
  }

  private calculateBrandScore(vendor: string): number {
    // Simple brand recognition scoring
    const premiumBrands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Microsoft'];
    return premiumBrands.some(brand => vendor.toLowerCase().includes(brand.toLowerCase())) ? 8 : 5;
  }

  private getDifficultyAssessment(score: number): string {
    if (score >= 85) return 'Low Competition';
    if (score >= 70) return 'Medium Difficulty';
    return 'High Competition';
  }

  private getAffiliatePotential(score: number): string {
    if (score >= 85) return 'High';
    if (score >= 70) return 'Good';
    return 'Medium';
  }

  private calculateMarketInsights(products: any[]): any {
    if (products.length === 0) return null;

    const prices = products.map(p => p.price?.value || 0).filter(p => p > 0);
    const vendors = Array.from(new Set(products.map(p => p.vendor)));

    return {
      totalProducts: products.length,
      averagePrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
      priceRange: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : { min: 0, max: 0 },
      topVendors: vendors.slice(0, 5)
    };
  }

  // Check if service is properly configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Test connection to Rye API
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testQuery = gql`
        query TestQuery {
          __type(name: "Product") {
            name
          }
        }
      `;

      await this.client.request(testQuery, {}, this.getHeaders());
      return { success: true };
    } catch (error: any) {
      console.error('Rye test connection error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const ryeService = new RyeService();