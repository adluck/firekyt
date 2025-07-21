import { GraphQLClient, gql } from 'graphql-request';
import { db } from '../db';
import { ryeProducts } from '../../shared/schema';
import { ilike, sql } from 'drizzle-orm';

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

  // Search products using local database
  async searchProducts(query: string, limit: number = 20): Promise<{ products: RyeProduct[]; error?: string }> {
    try {
      console.log(`🔍 Searching local database for: "${query}" (limit: ${limit})`);
      
      // Split query into individual words for more flexible matching
      const words = query.toLowerCase().split(' ').filter(word => word.length > 2);
      console.log(`🔤 Search words: ${words.join(', ')}`);
      
      if (words.length === 0) {
        return { products: [], error: 'Search query too short' };
      }
      
      // Build dynamic search conditions for each word
      let whereConditions = [];
      for (const word of words) {
        whereConditions.push(
          sql`(${ilike(ryeProducts.title, `%${word}%`)} OR ${ilike(ryeProducts.category, `%${word}%`)})`
        );
      }
      
      // Combine all conditions with OR (match any word) and ensure active products
      const finalCondition = sql`(${sql.join(whereConditions, sql` OR `)}) AND ${ryeProducts.isActive} = true`;
      
      const dbProducts = await db
        .select()
        .from(ryeProducts)
        .where(finalCondition)
        .limit(limit);

      console.log(`📦 Found ${dbProducts.length} products in local database`);

      // Convert database format to RyeProduct format
      const products: RyeProduct[] = dbProducts.map(product => {
        // Generate a placeholder image if no image URL is available
        const placeholderImage = `https://via.placeholder.com/300x300/f97316/white?text=${encodeURIComponent(product.title?.substring(0, 20) || 'Product')}`;
        const imageUrl = product.imageUrl || placeholderImage;
        
        return {
          id: product.id,
          title: product.title,
          vendor: 'Local Database',
          url: product.url,
          isAvailable: product.isActive,
          images: [{ url: imageUrl }], // Always provide at least one image
          price: {
            displayValue: product.price ? `${product.currencyCode} ${product.price}` : 'N/A',
            value: product.price || 0,
            currency: product.currencyCode
          },
          description: product.description || '',
          productType: product.category || undefined,
          category: product.category || '',
          imageUrl: imageUrl // Add this for compatibility
        };
      });

      return { products };
    } catch (error: any) {
      console.error('Local database search error:', error);
      return { 
        products: [], 
        error: `Database search failed: ${error.message}` 
      };
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

  // Helper method to determine if input is a URL or keyword
  isUrl(input: string): boolean {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }

  // Search RYE API using GraphQL for live product data
  async searchRyeAPI(query: string, limit: number = 20): Promise<{ products: RyeProduct[]; error?: string }> {
    if (!this.apiKey) {
      return { products: [], error: 'RYE API key not configured' };
    }

    try {
      console.log(`🌐 Searching RYE GraphQL API for: "${query}" (limit: ${limit})`);
      
      const graphqlQuery = gql`
        query searchProducts($query: String!, $limit: Int!) {
          products(
            first: $limit
            filter: {
              query: $query
            }
          ) {
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
                description
                productType
                category
              }
            }
          }
        }
      `;

      const data = await this.client.request(graphqlQuery, { 
        query: query, 
        limit: limit 
      }, this.getHeaders());

      const products = data.products?.edges || [];
      console.log(`📦 RYE GraphQL API returned ${products.length} products`);

      // Convert GraphQL response to our format
      const formattedProducts = products.map((edge: any) => {
        const product = edge.node;
        return {
          id: product.id,
          title: product.title,
          vendor: product.vendor || 'RYE Network',
          url: product.url,
          isAvailable: product.isAvailable,
          images: product.images || [],
          price: {
            displayValue: product.price?.displayValue || 'N/A',
            value: parseFloat(product.price?.value?.toString() || '0'),
            currency: product.price?.currency || 'USD'
          },
          description: product.description || '',
          productType: product.productType || '',
          category: product.category || product.productType || '',
          imageUrl: product.images?.[0]?.url || null
        };
      });

      return { products: formattedProducts };
    } catch (error: any) {
      console.error('❌ Error searching RYE GraphQL API:', error);
      return { products: [], error: `RYE GraphQL API search failed: ${error.message}` };
    }
  }

  // Unified search method that handles both URLs and keywords
  async searchProductsUnified(query: string, limit: number = 20): Promise<{ products: RyeProduct[]; error?: string }> {
    if (this.isUrl(query)) {
      // Handle URL - use Rye API
      console.log(`🔗 Processing URL: ${query}`);
      const result = await this.getProductByAmazonURL(query);
      if (result.error || !result.product) {
        return { products: [], error: result.error || 'Failed to fetch product from URL' };
      }
      return { products: [result.product] };
    } else {
      // Handle keyword - first try local database, then fall back to RYE API
      console.log(`🔍 Processing keyword: ${query}`);
      const localResult = await this.searchProducts(query, limit);
      
      if (localResult.products.length > 0) {
        console.log(`✅ Found ${localResult.products.length} products in local database`);
        return localResult;
      } else {
        console.log(`📡 Local database empty, trying RYE API...`);
        return await this.searchRyeAPI(query, limit);
      }
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