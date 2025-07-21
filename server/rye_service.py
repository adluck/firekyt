import os
import asyncio
from typing import Dict, List, Optional, Any
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RyeGraphQLClient:
    """
    Dedicated service for Rye.com GraphQL API interactions.
    Handles product search, research, and intelligent scoring capabilities.
    """
    
    def __init__(self):
        self.api_key = os.getenv('RYE_API_KEY')
        if not self.api_key:
            raise ValueError("RYE_API_KEY environment variable is required")
        
        # Initialize GraphQL transport with authentication
        self.transport = AIOHTTPTransport(
            url="https://graphql.api.rye.com/v1/query",
            headers={
                "Authorization": f"Basic {self.api_key}",
                "Rye-Shopper-IP": "127.0.0.1",  # Required for fraud detection
                "Content-Type": "application/json"
            }
        )
        
        self.client = Client(
            transport=self.transport,
            fetch_schema_from_transport=False
        )
        
        logger.info("Rye GraphQL client initialized successfully")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection to Rye GraphQL API"""
        try:
            query = gql("""
                query TestConnection {
                    __type(name: "Product") {
                        name
                        description
                    }
                }
            """)
            
            async with self.client as session:
                result = await session.execute(query)
                logger.info("Rye API connection test successful")
                return {"success": True, "data": result}
                
        except Exception as e:
            logger.error(f"Rye API connection test failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def search_products(self, search_query: str, limit: int = 20, marketplace: str = "AMAZON") -> Dict[str, Any]:
        """
        Demonstrate Rye product access using sample Amazon ASINs
        
        Note: Rye API doesn't support traditional keyword search. 
        This method uses known Amazon ASINs for demonstration.
        
        Args:
            search_query: Product search keywords (for categorization)
            limit: Maximum number of products to return
            marketplace: Target marketplace (AMAZON, SHOPIFY)
        
        Returns:
            Dictionary containing products and metadata
        """
        try:
            # Rye API works with specific product IDs, not keyword searches
            # Using sample Amazon ASINs for different categories
            sample_asins = {
                "gaming": ["B08N5WRWNW", "B07VGRJDFY", "B08KHG4X7Q"],  # Gaming laptops, headsets
                "wireless headphones": ["B08PBJP8B2", "B0756CYWWD", "B07Q9MJKBV"],  # Popular headphones
                "laptops": ["B08N5WRWNW", "B08BNZVZBM", "B09DPBWNJ9"],  # Popular laptops
                "default": ["B07H2V5YLH", "B08N5WRWNW", "B08PBJP8B2"]  # Screen protector, laptop, headphones
            }
            
            # Select ASINs based on search query
            category_key = "default"
            for key in sample_asins.keys():
                if key in search_query.lower():
                    category_key = key
                    break
            
            selected_asins = sample_asins[category_key][:limit]
            
            # Fetch each product individually using productByID
            products = []
            
            async with self.client as session:
                for asin in selected_asins:
                    try:
                        query = gql("""
                            query GetAmazonProduct($input: ProductByIDInput!) {
                                productByID(input: $input) {
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
                                    marketplace
                                    ... on AmazonProduct {
                                        ASIN
                                        categories {
                                            name
                                            url
                                        }
                                        featureBullets
                                        specifications {
                                            name
                                            value
                                        }
                                        ratingsTotal
                                        reviewsTotal
                                    }
                                }
                            }
                        """)
                        
                        variables = {
                            "input": {
                                "id": asin,
                                "marketplace": "AMAZON"
                            }
                        }
                        
                        result = await session.execute(query, variable_values=variables)
                        
                        if result.get("productByID"):
                            products.append(result["productByID"])
                            
                    except Exception as product_error:
                        logger.warning(f"Failed to fetch product {asin}: {str(product_error)}")
                        continue
                
                logger.info(f"Successfully searched products: {len(products)} found for '{search_query}'")
                
                return {
                    "success": True,
                    "products": products,
                    "total_count": len(products),
                    "search_metadata": {
                        "query": search_query,
                        "marketplace": marketplace,
                        "limit": limit,
                        "note": "Using sample ASINs - Rye API requires specific product IDs"
                    }
                }
                
        except Exception as e:
            logger.error(f"Product search failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "products": [],
                "total_count": 0
            }
    
    async def get_product_by_id(self, product_id: str, marketplace: str = "AMAZON") -> Dict[str, Any]:
        """
        Get detailed product information by ID
        
        Args:
            product_id: Rye product ID
            marketplace: Product marketplace
        
        Returns:
            Dictionary containing product details
        """
        try:
            query = gql("""
                query ProductByID($input: ProductByIDInput!) {
                    product: productByID(input: $input) {
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
                        }
                        description
                        marketplace
                        ... on AmazonProduct {
                            ASIN
                            categories {
                                name
                                url
                            }
                            featureBullets
                            specifications {
                                name
                                value
                            }
                            ratingsTotal
                            reviewsTotal
                        }
                        ... on ShopifyProduct {
                            productType
                            tags
                            options {
                                name
                                values
                            }
                            variants {
                                id
                                title
                                ... on ShopifyVariant {
                                    price
                                    isAvailable
                                }
                            }
                        }
                    }
                }
            """)
            
            variables = {
                "input": {
                    "id": product_id,
                    "marketplace": marketplace
                }
            }
            
            async with self.client as session:
                result = await session.execute(query, variable_values=variables)
                
                if result.get("product"):
                    logger.info(f"Successfully retrieved product: {product_id}")
                    return {
                        "success": True,
                        "product": result["product"]
                    }
                else:
                    return {
                        "success": False,
                        "error": "Product not found",
                        "product": None
                    }
                    
        except Exception as e:
            logger.error(f"Get product by ID failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "product": None
            }

    async def get_products_by_ids(self, product_ids: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Get multiple products by their IDs in a single request
        
        Args:
            product_ids: List of dictionaries with 'id' and 'marketplace' keys
                        Example: [{"id": "prod123", "marketplace": "AMAZON"}]
        
        Returns:
            Dictionary containing products and metadata
        """
        try:
            # Validate input
            if not product_ids or len(product_ids) == 0:
                return {
                    "success": False,
                    "error": "Product IDs list cannot be empty",
                    "products": []
                }
            
            # Limit to 25 products as per Rye API constraints
            if len(product_ids) > 25:
                logger.warning(f"Limiting request to 25 products (requested: {len(product_ids)})")
                product_ids = product_ids[:25]
            
            # Validate each product ID entry
            validated_ids = []
            for item in product_ids:
                if isinstance(item, dict) and "id" in item:
                    validated_ids.append({
                        "id": item["id"],
                        "marketplace": item.get("marketplace", "AMAZON")
                    })
                elif isinstance(item, str):
                    # Accept plain ASIN strings for Amazon products
                    validated_ids.append({
                        "id": item,
                        "marketplace": "AMAZON"
                    })
                else:
                    logger.warning(f"Invalid product ID format: {item}")
            
            if not validated_ids:
                return {
                    "success": False,
                    "error": "No valid product IDs found",
                    "products": []
                }
            
            # Since Rye API doesn't have productsByIds, fetch products individually
            products = []
            
            async with self.client as session:
                for product_id_obj in validated_ids:
                    try:
                        query = gql("""
                            query ProductByID($input: ProductByIDInput!) {
                                productByID(input: $input) {
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
                                    }
                                    description
                                    marketplace
                                    ... on AmazonProduct {
                                        ASIN
                                        categories {
                                            name
                                            url
                                        }
                                        featureBullets
                                        specifications {
                                            name
                                            value
                                        }
                                        ratingsTotal
                                        reviewsTotal
                                    }
                                    ... on ShopifyProduct {
                                        productType
                                        tags
                                        options {
                                            name
                                            values
                                        }
                                        variants {
                                            id
                                            title
                                            ... on ShopifyVariant {
                                                price
                                                isAvailable
                                            }
                                        }
                                    }
                                }
                            }
                        """)
                        
                        variables = {
                            "input": {
                                "id": product_id_obj["id"],
                                "marketplace": product_id_obj["marketplace"]
                            }
                        }
                        
                        result = await session.execute(query, variable_values=variables)
                        
                        if result.get("productByID"):
                            products.append(result["productByID"])
                    
                    except Exception as product_error:
                        logger.warning(f"Failed to fetch product {product_id_obj.get('id', 'unknown')}: {str(product_error)}")
                        continue
            
            logger.info(f"Successfully retrieved {len(products)} out of {len(validated_ids)} products by IDs")
            
            return {
                "success": True,
                "products": products,
                "requested_count": len(validated_ids),
                "retrieved_count": len(products),
                "metadata": {
                    "requested_ids": [pid["id"] for pid in validated_ids],
                    "batch_size": len(products)
                }
            }
                
        except Exception as e:
            logger.error(f"Get products by IDs failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "products": [],
                "requested_count": len(product_ids) if product_ids else 0,
                "retrieved_count": 0
            }
    
    async def get_products_by_domain(self, domain: str, limit: int = 20) -> Dict[str, Any]:
        """
        Get products associated with a specific domain
        
        Args:
            domain: Domain name (e.g., "amazon.com", "shopify-store.com")
            limit: Maximum number of products to return
        
        Returns:
            Dictionary containing products from the specified domain
        """
        try:
            if not domain:
                return {
                    "success": False,
                    "error": "Domain cannot be empty",
                    "products": []
                }
            
            # Note: productsByDomainV2 is only available for specific Shopify domains 
            # that have the Rye app installed. For demonstration, we'll return sample data.
            
            logger.info(f"Domain search requested for: {domain}")
            
            # For now, return a message explaining Rye's domain-based access model
            return {
                "success": False,
                "error": "Domain-based product access requires Shopify merchants to install Rye app",
                "products": [],
                "note": "Rye's productsByDomainV2 only works with authorized Shopify domains that have the Rye app installed",
                "domain_requested": domain,
                "limit": limit
            }
                
        except Exception as e:
            logger.error(f"Get products by domain failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "domain": domain,
                "products": [],
                "total_count": 0
            }
    
    async def request_amazon_product_by_url(self, amazon_url: str) -> Dict[str, Any]:
        """
        Request a product to be indexed by Rye using Amazon URL
        
        Args:
            amazon_url: Amazon product URL
        
        Returns:
            Dictionary containing the requested product ID
        """
        try:
            mutation = gql("""
                mutation RequestAmazonProductByURL($input: RequestAmazonProductByURLInput!) {
                    requestAmazonProductByURL(input: $input) {
                        productId
                        isExistingProduct
                    }
                }
            """)
            
            variables = {
                "input": {
                    "url": amazon_url
                }
            }
            
            async with self.client as session:
                result = await session.execute(mutation, variable_values=variables)
                
                request_result = result.get("requestAmazonProductByURL", {})
                logger.info(f"Successfully requested Amazon product: {amazon_url}")
                
                return {
                    "success": True,
                    "product_id": request_result.get("productId"),
                    "is_existing": request_result.get("isExistingProduct", False)
                }
                
        except Exception as e:
            logger.error(f"Request Amazon product failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "product_id": None
            }
    
    async def analyze_product_research(self, search_query: str) -> Dict[str, Any]:
        """
        Comprehensive product research with market intelligence and scoring
        
        Args:
            search_query: Product category or keywords to research
        
        Returns:
            Dictionary containing market analysis and intelligent scoring
        """
        try:
            # Search for products in the category
            search_result = await self.search_products(search_query, limit=50)
            
            if not search_result["success"]:
                return search_result
            
            products = search_result["products"]
            
            # Perform market intelligence analysis
            market_analysis = self._analyze_market_data(products)
            
            # Apply intelligent scoring to each product
            scored_products = self._apply_intelligent_scoring(products, market_analysis)
            
            logger.info(f"Completed product research analysis for: {search_query}")
            
            return {
                "success": True,
                "search_query": search_query,
                "total_products": len(products),
                "products": scored_products,
                "market_intelligence": market_analysis,
                "research_metadata": {
                    "analysis_timestamp": asyncio.get_event_loop().time(),
                    "scoring_algorithm": "rye_v1",
                    "data_source": "rye_graphql_api"
                }
            }
            
        except Exception as e:
            logger.error(f"Product research analysis failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "products": []
            }
    
    def _analyze_market_data(self, products: List[Dict]) -> Dict[str, Any]:
        """Analyze market data from product list"""
        if not products:
            return {}
        
        # Extract pricing data
        prices = []
        vendors = set()
        categories = set()
        review_scores = []
        
        for product in products:
            if product.get("price", {}).get("value"):
                prices.append(float(product["price"]["value"]))
            
            if product.get("vendor"):
                vendors.add(product["vendor"])
            
            # Amazon-specific data
            if product.get("ASIN"):
                if product.get("category"):
                    categories.add(product["category"])
                if product.get("reviews", {}).get("rating"):
                    review_scores.append(float(product["reviews"]["rating"]))
        
        # Calculate market metrics
        market_analysis = {
            "price_analysis": {
                "min_price": min(prices) if prices else 0,
                "max_price": max(prices) if prices else 0,
                "avg_price": sum(prices) / len(prices) if prices else 0,
                "price_range": max(prices) - min(prices) if prices else 0,
                "total_products_with_pricing": len(prices)
            },
            "vendor_analysis": {
                "total_vendors": len(vendors),
                "top_vendors": list(vendors)[:10]
            },
            "review_analysis": {
                "avg_rating": sum(review_scores) / len(review_scores) if review_scores else 0,
                "total_reviewed_products": len(review_scores)
            },
            "category_analysis": {
                "categories": list(categories)
            }
        }
        
        return market_analysis
    
    def _apply_intelligent_scoring(self, products: List[Dict], market_analysis: Dict) -> List[Dict]:
        """Apply intelligent scoring algorithm to products"""
        scored_products = []
        avg_price = market_analysis.get("price_analysis", {}).get("avg_price", 0)
        avg_rating = market_analysis.get("review_analysis", {}).get("avg_rating", 0)
        
        for product in products:
            score_components = {
                "availability_score": 10 if product.get("isAvailable") else 0,
                "price_competitiveness": 0,
                "review_score": 0,
                "data_completeness": 0
            }
            
            # Price competitiveness (lower than average = better score)
            product_price = product.get("price", {}).get("value", 0)
            if product_price and avg_price:
                if product_price <= avg_price:
                    score_components["price_competitiveness"] = 10
                else:
                    score_components["price_competitiveness"] = max(0, 10 - ((product_price - avg_price) / avg_price) * 5)
            
            # Review score
            product_rating = product.get("reviews", {}).get("rating", 0)
            if product_rating:
                score_components["review_score"] = (product_rating / 5.0) * 10
            
            # Data completeness
            completeness_factors = [
                bool(product.get("title")),
                bool(product.get("description")),
                bool(product.get("images")),
                bool(product.get("price")),
                bool(product.get("vendor"))
            ]
            score_components["data_completeness"] = (sum(completeness_factors) / len(completeness_factors)) * 10
            
            # Calculate overall intelligent score
            total_score = sum(score_components.values()) / len(score_components)
            
            # Add scoring data to product
            scored_product = {
                **product,
                "intelligent_score": round(total_score, 2),
                "score_breakdown": score_components,
                "affiliate_potential": "high" if total_score >= 8 else "medium" if total_score >= 6 else "low"
            }
            
            scored_products.append(scored_product)
        
        # Sort by intelligent score (highest first)
        scored_products.sort(key=lambda x: x["intelligent_score"], reverse=True)
        
        return scored_products

# Initialize global service instance
rye_service = None

def get_rye_service() -> RyeGraphQLClient:
    """Get or create Rye service instance"""
    global rye_service
    if rye_service is None:
        rye_service = RyeGraphQLClient()
    return rye_service

# Async wrapper functions for easy integration
async def search_products_async(query: str, limit: int = 20) -> Dict[str, Any]:
    """Async wrapper for product search"""
    service = get_rye_service()
    return await service.search_products(query, limit)

async def research_products_async(query: str) -> Dict[str, Any]:
    """Async wrapper for comprehensive product research"""
    service = get_rye_service()
    return await service.analyze_product_research(query)

async def get_product_by_id_async(product_id: str) -> Dict[str, Any]:
    """Async wrapper for getting product by ID"""
    service = get_rye_service()
    return await service.get_product_by_id(product_id)

async def request_amazon_product_async(url: str) -> Dict[str, Any]:
    """Async wrapper for requesting Amazon product"""
    service = get_rye_service()
    return await service.request_amazon_product_by_url(url)

async def get_products_by_ids_async(product_ids: List[Dict[str, str]]) -> Dict[str, Any]:
    """Async wrapper for getting multiple products by IDs"""
    service = get_rye_service()
    return await service.get_products_by_ids(product_ids)

async def get_products_by_domain_async(domain: str, limit: int = 20) -> Dict[str, Any]:
    """Async wrapper for getting products by domain"""
    service = get_rye_service()
    return await service.get_products_by_domain(domain, limit)

# Alias for compatibility
RyeService = RyeGraphQLClient