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
        Search for products using Rye's GraphQL API
        
        Args:
            search_query: Product search keywords
            limit: Maximum number of products to return
            marketplace: Target marketplace (AMAZON, SHOPIFY)
        
        Returns:
            Dictionary containing products and metadata
        """
        try:
            query = gql("""
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
                                    altText
                                }
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
                                    category
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
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            startCursor
                            endCursor
                        }
                        totalCount
                    }
                }
            """)
            
            variables = {
                "input": {
                    "query": search_query,
                    "first": limit,
                    "marketplace": marketplace
                }
            }
            
            async with self.client as session:
                result = await session.execute(query, variable_values=variables)
                
                products = []
                if result.get("products") and result["products"].get("edges"):
                    products = [edge["node"] for edge in result["products"]["edges"]]
                
                logger.info(f"Successfully searched products: {len(products)} found for '{search_query}'")
                
                return {
                    "success": True,
                    "products": products,
                    "total_count": result.get("products", {}).get("totalCount", 0),
                    "page_info": result.get("products", {}).get("pageInfo", {}),
                    "search_metadata": {
                        "query": search_query,
                        "marketplace": marketplace,
                        "limit": limit
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
                            altText
                        }
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
                            category
                            brand
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
                                price {
                                    displayValue
                                    value
                                    currency
                                }
                                isAvailable
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