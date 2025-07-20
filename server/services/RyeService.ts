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

      const data = await this.client.request(mutation, variables, this.getHeaders()) as any;
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

      const data = await this.client.request(query, variables, this.getHeaders()) as any;
      return { product: data.product };
    } catch (error: any) {
      console.error('Rye getProductById error:', error);
      return { product: null, error: error.message };
    }
  }

  // Note: Rye API doesn't support direct keyword search
  // This method returns a helpful error message
  async searchProducts(query: string, limit: number = 20): Promise<{ products: RyeProduct[]; error?: string }> {
    return { 
      products: [], 
      error: 'Rye API does not support direct keyword search. Please use product URLs or specific product IDs instead.' 
    };
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

  // Enhanced product research with multiple data points
  async researchProduct(keyword: string): Promise<{
    products: Array<RyeProduct & {
      competitorAnalysis?: {
        priceRange: { min: number; max: number; average: number };
        topFeatures: string[];
        reviewScores: number[];
      }
    }>;
    marketInsights?: {
      totalProducts: number;
      averagePrice: number;
      priceRange: { min: number; max: number };
      topVendors: string[];
    };
    error?: string;
  }> {
    try {
      const searchResult = await this.searchProducts(keyword, 50);
      if (searchResult.error) {
        return { products: [], error: searchResult.error };
      }

      const products = searchResult.products;
      
      // Generate market insights
      const prices = products.map(p => p.price.value).filter(p => p > 0);
      const marketInsights = prices.length > 0 ? {
        totalProducts: products.length,
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        topVendors: Array.from(new Set(products.map(p => p.vendor))).slice(0, 10)
      } : undefined;

      // Add competitor analysis for each product
      const enhancedProducts = products.map(product => ({
        ...product,
        competitorAnalysis: {
          priceRange: marketInsights?.priceRange ? { 
            min: marketInsights.priceRange.min, 
            max: marketInsights.priceRange.max, 
            average: marketInsights.averagePrice 
          } : { min: 0, max: 0, average: 0 },
          topFeatures: [], // Could be enhanced with AI analysis
          reviewScores: [] // Could be populated from Amazon reviews
        }
      }));

      return {
        products: enhancedProducts,
        marketInsights
      };
    } catch (error: any) {
      console.error('Rye researchProduct error:', error);
      return { products: [], error: error.message };
    }
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