import os
import asyncio
import time
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
        """Enhanced intelligent scoring algorithm using Rye.com real-time data"""
        scored_products = []
        
        # Extract market benchmarks from Rye data
        avg_price = market_analysis.get("price_analysis", {}).get("avg_price", 0)
        max_price = market_analysis.get("price_analysis", {}).get("max_price", 1000)
        min_price = market_analysis.get("price_analysis", {}).get("min_price", 0)
        avg_rating = market_analysis.get("review_analysis", {}).get("avg_rating", 3.0)
        
        for product in products:
            # Enhanced scoring components with weighted importance
            score_components = {
                "availability_score": self._calculate_availability_score(product),
                "price_competitiveness": self._calculate_price_score(product, avg_price, min_price, max_price),
                "review_quality": self._calculate_review_score(product, avg_rating),
                "market_position": self._calculate_market_position_score(product, market_analysis),
                "affiliate_potential": self._calculate_affiliate_potential_score(product),
                "data_richness": self._calculate_data_richness_score(product),
                "brand_strength": self._calculate_brand_strength_score(product),
                "conversion_indicators": self._calculate_conversion_indicators(product)
            }
            
            # Weighted scoring algorithm optimized for affiliate marketing
            weights = {
                "availability_score": 0.20,      # 20% - Must be available to sell
                "price_competitiveness": 0.18,   # 18% - Competitive pricing drives conversions
                "affiliate_potential": 0.16,     # 16% - Commission and price range optimization
                "review_quality": 0.14,          # 14% - Social proof drives sales
                "conversion_indicators": 0.12,   # 12% - Features that indicate high conversion
                "market_position": 0.10,         # 10% - Market positioning and competition
                "brand_strength": 0.06,          # 6% - Brand recognition helps conversions
                "data_richness": 0.04            # 4% - Complete product information
            }
            
            # Calculate weighted intelligent score (0-100 scale)
            weighted_score = sum(
                score_components[component] * weights[component] * 100
                for component in score_components
            )
            
            # Apply marketplace-specific bonuses
            marketplace_bonus = self._calculate_marketplace_bonus(product)
            final_score = min(weighted_score + marketplace_bonus, 100)
            
            # Determine difficulty level for affiliate marketers
            if final_score >= 80:
                difficulty = "Easy"
                potential = "High"
            elif final_score >= 60:
                difficulty = "Medium" 
                potential = "Good"
            else:
                difficulty = "Hard"
                potential = "Low"
            
            # Enhanced product data with comprehensive scoring
            scored_product = {
                **product,
                "intelligent_score": round(final_score, 1),
                "difficulty": difficulty,
                "affiliate_potential": potential,
                "score_breakdown": {k: round(v * 100, 1) for k, v in score_components.items()},
                "market_insights": {
                    "price_vs_market": "competitive" if score_components["price_competitiveness"] > 0.7 else "average" if score_components["price_competitiveness"] > 0.4 else "expensive",
                    "review_strength": "excellent" if score_components["review_quality"] > 0.8 else "good" if score_components["review_quality"] > 0.6 else "fair",
                    "availability_status": "in_stock" if score_components["availability_score"] > 0.9 else "limited" if score_components["availability_score"] > 0.5 else "unavailable"
                },
                "rye_enhanced": True,  # Flag indicating Rye data integration
                "last_updated": time.time()
            }
            
            scored_products.append(scored_product)
        
        # Sort by intelligent score (highest first) with secondary sort by affiliate potential
        scored_products.sort(key=lambda x: (x["intelligent_score"], x["score_breakdown"]["affiliate_potential"]), reverse=True)
        
        return scored_products
    
    def _calculate_availability_score(self, product: Dict) -> float:
        """Calculate availability score based on Rye real-time data"""
        is_available = product.get("isAvailable", False)
        
        # Shopify variants availability check
        if product.get("variants"):
            available_variants = sum(1 for variant in product["variants"] if variant.get("isAvailable", False))
            total_variants = len(product["variants"])
            variant_availability = available_variants / total_variants if total_variants > 0 else 0
            return 0.8 * (1.0 if is_available else 0.0) + 0.2 * variant_availability
        
        return 1.0 if is_available else 0.0
    
    def _calculate_price_score(self, product: Dict, avg_price: float, min_price: float, max_price: float) -> float:
        """Enhanced price competitiveness scoring"""
        price_data = product.get("price", {})
        
        # Handle different price formats from Rye API
        if isinstance(price_data, dict):
            product_price = price_data.get("value")
            if product_price is None:
                display_value = price_data.get("displayValue", "")
                if display_value:
                    try:
                        product_price = float(display_value.replace("$", "").replace(",", ""))
                    except:
                        product_price = None
        else:
            # Handle string price format (some Shopify variants)
            try:
                product_price = float(str(price_data).replace("$", "").replace(",", ""))
            except:
                product_price = None
        
        if not product_price or not avg_price:
            return 0.5  # Neutral score if price unavailable
        
        # Optimal price ranges for affiliate marketing
        if 25 <= product_price <= 150:      # Sweet spot for conversions
            range_score = 1.0
        elif 15 <= product_price <= 300:    # Good range
            range_score = 0.8
        elif product_price < 15:            # Too low for meaningful commissions
            range_score = 0.3
        else:                               # High-ticket items (lower conversion but higher commission)
            range_score = 0.6
        
        # Price competitiveness vs market average
        if product_price <= avg_price * 0.9:        # 10% below average = excellent
            competitive_score = 1.0
        elif product_price <= avg_price * 1.1:      # Within 10% of average = good
            competitive_score = 0.8
        elif product_price <= avg_price * 1.3:      # Up to 30% above average = fair
            competitive_score = 0.5
        else:                                       # More than 30% above average = poor
            competitive_score = 0.2
        
        return (range_score * 0.6) + (competitive_score * 0.4)
    
    def _calculate_review_score(self, product: Dict, avg_rating: float) -> float:
        """Enhanced review quality scoring using Amazon/Shopify data"""
        # Amazon products
        if product.get("ratingsTotal") and product.get("reviewsTotal"):
            rating = float(product.get("ratingsTotal", 0))
            review_count = int(product.get("reviewsTotal", 0))
            
            # Rating quality (0-1 scale)
            rating_score = rating / 5.0 if rating > 0 else 0.6  # Default to neutral if no rating
            
            # Review volume score (more reviews = more social proof)
            if review_count >= 1000:
                volume_score = 1.0
            elif review_count >= 100:
                volume_score = 0.8
            elif review_count >= 50:
                volume_score = 0.6
            elif review_count >= 10:
                volume_score = 0.4
            else:
                volume_score = 0.2
            
            return (rating_score * 0.7) + (volume_score * 0.3)
        
        # Fallback for products without review data
        return 0.5
    
    def _calculate_market_position_score(self, product: Dict, market_analysis: Dict) -> float:
        """Calculate market positioning score"""
        vendor = product.get("vendor", "")
        category_info = product.get("categories", [])
        
        # Brand/vendor strength
        well_known_brands = ["apple", "sony", "nike", "amazon", "microsoft", "google", "samsung", "lg"]
        vendor_score = 0.8 if any(brand.lower() in vendor.lower() for brand in well_known_brands) else 0.5
        
        # Category competitiveness
        total_vendors = market_analysis.get("vendor_analysis", {}).get("total_vendors", 1)
        category_score = 1.0 if total_vendors <= 5 else 0.7 if total_vendors <= 10 else 0.4
        
        return (vendor_score * 0.6) + (category_score * 0.4)
    
    def _calculate_affiliate_potential_score(self, product: Dict) -> float:
        """Calculate affiliate marketing potential based on product characteristics"""
        price_data = product.get("price", {})
        
        # Extract price value
        product_price = None
        if isinstance(price_data, dict):
            product_price = price_data.get("value")
            if product_price is None:
                display_value = price_data.get("displayValue", "")
                try:
                    product_price = float(display_value.replace("$", "").replace(",", ""))
                except:
                    product_price = 0
        
        if not product_price:
            return 0.4
        
        # Commission potential (assuming typical rates)
        if 50 <= product_price <= 200:      # Optimal for affiliate commissions
            commission_score = 1.0
        elif 25 <= product_price <= 500:    # Good commission potential
            commission_score = 0.8
        elif product_price >= 500:          # High-ticket (good commission but lower conversion)
            commission_score = 0.7
        else:                               # Low-ticket items
            commission_score = 0.3
        
        # Feature bullets and specifications indicate detailed product information
        features_score = 0.8 if product.get("featureBullets") or product.get("specifications") else 0.4
        
        return (commission_score * 0.7) + (features_score * 0.3)
    
    def _calculate_data_richness_score(self, product: Dict) -> float:
        """Calculate data completeness and richness score"""
        data_factors = [
            bool(product.get("title")),
            bool(product.get("description")),
            bool(product.get("images") and len(product.get("images", [])) > 0),
            bool(product.get("price")),
            bool(product.get("vendor")),
            bool(product.get("featureBullets")),
            bool(product.get("specifications")),
            bool(product.get("categories"))
        ]
        
        return sum(data_factors) / len(data_factors)
    
    def _calculate_brand_strength_score(self, product: Dict) -> float:
        """Calculate brand recognition and strength"""
        vendor = product.get("vendor", "").lower()
        title = product.get("title", "").lower()
        
        # Premium brands that typically convert well
        premium_brands = ["apple", "sony", "nike", "adidas", "samsung", "lg", "microsoft", "google", "amazon"]
        
        brand_recognition = any(brand in vendor or brand in title for brand in premium_brands)
        
        return 0.9 if brand_recognition else 0.5
    
    def _calculate_conversion_indicators(self, product: Dict) -> float:
        """Calculate indicators that suggest high conversion potential"""
        indicators = []
        
        # High review count indicates popularity
        review_count = product.get("reviewsTotal", 0)
        indicators.append(1.0 if review_count >= 100 else 0.5)
        
        # High rating indicates quality
        rating = product.get("ratingsTotal", 0)
        indicators.append(1.0 if rating >= 4.0 else 0.5)
        
        # Multiple images suggest professional listing
        image_count = len(product.get("images", []))
        indicators.append(1.0 if image_count >= 3 else 0.5)
        
        # Feature bullets indicate detailed product information
        features = product.get("featureBullets", [])
        indicators.append(1.0 if features and len(features) >= 3 else 0.5)
        
        return sum(indicators) / len(indicators) if indicators else 0.5
    
    def _calculate_marketplace_bonus(self, product: Dict) -> float:
        """Apply marketplace-specific bonuses"""
        marketplace = product.get("marketplace", "")
        
        # Amazon products tend to have higher conversion rates
        if marketplace == "AMAZON":
            return 2.0  # 2-point bonus
        elif marketplace == "SHOPIFY":
            return 1.0  # 1-point bonus for direct-to-consumer brands
        
        return 0.0

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

async def research_products_async(niche: str, product_category: str = None, max_results: int = 50) -> Dict[str, Any]:
    """Enhanced async wrapper for comprehensive product research with intelligent scoring"""
    service = get_rye_service()
    
    # Use niche as search query for product research
    search_query = f"{niche} {product_category}" if product_category and product_category != 'General' else niche
    
    logger.info(f"Starting enhanced product research for: {search_query}")
    
    result = await service.analyze_product_research(search_query)
    
    if result.get("success"):
        # Add enhanced metadata for affiliate marketers
        result["research_metadata"].update({
            "niche": niche,
            "category": product_category,
            "max_results": max_results,
            "enhanced_scoring": True,
            "rye_integration": "v2_enhanced"
        })
        
        # Add summary insights based on enhanced scoring
        products = result.get("products", [])
        if products:
            high_potential = len([p for p in products if p.get("affiliate_potential") == "High"])
            avg_score = sum(p.get("intelligent_score", 0) for p in products) / len(products)
            
            result["research_insights"] = {
                "total_analyzed": len(products),
                "high_potential_count": high_potential,
                "average_score": round(avg_score, 1),
                "top_opportunity": products[0].get("title") if products else None,
                "market_competitiveness": "high" if avg_score < 60 else "medium" if avg_score < 75 else "low"
            }
    
    return result

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