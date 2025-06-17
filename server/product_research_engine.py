"""
Advanced Affiliate Product Research & Scoring Engine
Integrates with Amazon PA-API, CJ Affiliate API, SerpAPI for comprehensive product research
"""

import os
import asyncio
import aiohttp
import requests
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from amazon_paapi import AmazonApi
# Removed SerpAPI dependency - using AI-powered analysis instead
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ProductResearchParams:
    """Parameters for product research"""
    niche: str
    product_category: Optional[str] = None
    min_commission_rate: float = 3.0
    min_trending_score: float = 50.0
    max_results: int = 50
    target_keywords: List[str] = None
    price_range: Tuple[float, float] = (0, 10000)

@dataclass
class ProductData:
    """Standardized product data structure"""
    title: str
    description: str
    brand: Optional[str]
    category: str
    niche: str
    price: float
    original_price: Optional[float]
    commission_rate: float
    commission_amount: float
    product_url: str
    affiliate_url: Optional[str]
    image_url: Optional[str]
    asin: Optional[str]
    sku: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    sales_rank: Optional[int]
    trending_score: float
    competition_score: float
    research_score: float
    keywords: List[str]
    search_volume: Optional[int]
    difficulty: Optional[int]
    api_source: str
    external_id: str
    tags: List[str]

class ProductScoringEngine:
    """Advanced scoring algorithm for affiliate products"""
    
    def __init__(self):
        self.weights = {
            'commission_rate': 0.25,      # 25% - Higher commission = better
            'trending_score': 0.20,       # 20% - Trending products = better
            'competition_score': 0.15,    # 15% - Lower competition = better
            'rating_score': 0.15,         # 15% - Higher rating = better
            'volume_score': 0.10,         # 10% - Higher search volume = better
            'price_score': 0.10,          # 10% - Optimal price range = better
            'review_score': 0.05          # 5% - More reviews = better
        }
    
    def calculate_score(self, product: ProductData, niche_data: Dict) -> float:
        """Calculate comprehensive product score (0-100)"""
        scores = {}
        
        # Commission Rate Score (0-100)
        commission_rate = float(product.commission_rate or 0)
        scores['commission_rate'] = min(commission_rate * 10, 100)  # 10% commission = 100 points
        
        # Trending Score (0-100) - based on search trends and sales velocity
        scores['trending_score'] = min(float(product.trending_score or 0), 100)
        
        # Competition Score (0-100) - inverted, lower competition is better
        competition = float(product.competition_score or 50)
        scores['competition_score'] = max(100 - competition, 0)
        
        # Rating Score (0-100)
        rating = float(product.rating or 3.0)
        scores['rating_score'] = (rating / 5.0) * 100
        
        # Search Volume Score (0-100)
        search_volume = product.search_volume or 1000
        # Normalize based on niche average
        niche_avg_volume = niche_data.get('avg_search_volume', 5000)
        scores['volume_score'] = min((search_volume / niche_avg_volume) * 50, 100)
        
        # Price Score (0-100) - optimal price ranges for affiliate marketing
        price = float(product.price or 0)
        if 20 <= price <= 200:      # Sweet spot for affiliate conversions
            scores['price_score'] = 100
        elif 10 <= price <= 500:    # Good range
            scores['price_score'] = 80
        elif price <= 10:           # Too low commission
            scores['price_score'] = 30
        else:                       # Too expensive, lower conversion
            scores['price_score'] = max(60 - (price - 500) / 100, 20)
        
        # Review Count Score (0-100)
        review_count = product.review_count or 0
        scores['review_score'] = min(review_count / 100, 100)  # 100+ reviews = max score
        
        # Calculate weighted final score
        final_score = sum(
            scores[metric] * self.weights[metric] 
            for metric in scores
        )
        
        # Apply niche-specific bonuses
        if product.niche.lower() in ['tech', 'electronics', 'software']:
            final_score *= 1.1  # Tech products often have higher conversion
        
        return min(final_score, 100)

class AmazonProductResearcher:
    """Amazon Product Advertising API integration"""
    
    def __init__(self):
        self.api_key = os.getenv('AMAZON_ACCESS_KEY')
        self.secret_key = os.getenv('AMAZON_SECRET_KEY')
        self.partner_tag = os.getenv('AMAZON_PARTNER_TAG')
        self.country = os.getenv('AMAZON_COUNTRY', 'US')
        
        if all([self.api_key, self.secret_key, self.partner_tag]):
            self.amazon_api = AmazonApi(
                key=self.api_key,
                secret=self.secret_key,
                tag=self.partner_tag,
                country=self.country
            )
        else:
            self.amazon_api = None
            logger.warning("Amazon PA-API credentials not configured")
    
    async def search_products(self, params: ProductResearchParams) -> List[ProductData]:
        """Search Amazon products using PA-API"""
        if not self.amazon_api:
            return []
        
        try:
            # Build search terms from niche and category
            search_terms = [params.niche]
            if params.product_category:
                search_terms.append(params.product_category)
            if params.target_keywords:
                search_terms.extend(params.target_keywords[:3])
            
            query = ' '.join(search_terms)
            
            # Search products
            result = self.amazon_api.search_items(
                keywords=query,
                item_count=min(params.max_results, 50),
                resources=[
                    'ItemInfo.Title',
                    'ItemInfo.Features',
                    'ItemInfo.ProductInfo',
                    'Offers.Listings.Price',
                    'Images.Primary.Large',
                    'CustomerReviews.StarRating',
                    'CustomerReviews.Count',
                    'BrowseNodeInfo.BrowseNodes'
                ]
            )
            
            products = []
            for item in result.get('SearchResult', {}).get('Items', []):
                try:
                    product_data = self._parse_amazon_item(item, params)
                    if self._meets_criteria(product_data, params):
                        products.append(product_data)
                except Exception as e:
                    logger.error(f"Error parsing Amazon item: {e}")
                    continue
            
            return products
            
        except Exception as e:
            logger.error(f"Amazon API search error: {e}")
            return []
    
    def _parse_amazon_item(self, item: Dict, params: ProductResearchParams) -> ProductData:
        """Parse Amazon API item into ProductData"""
        asin = item.get('ASIN', '')
        
        # Extract basic info
        title = item.get('ItemInfo', {}).get('Title', {}).get('DisplayValue', '')
        features = item.get('ItemInfo', {}).get('Features', {}).get('DisplayValues', [])
        description = ' '.join(features[:3]) if features else ''
        
        # Extract pricing
        offers = item.get('Offers', {}).get('Listings', [])
        price = 0
        original_price = None
        
        if offers:
            price_info = offers[0].get('Price', {})
            if price_info.get('Amount'):
                price = price_info['Amount'] / 100  # Convert cents to dollars
            
            savings = offers[0].get('SavingBasis', {})
            if savings and savings.get('Amount'):
                original_price = savings['Amount'] / 100
        
        # Extract reviews
        reviews = item.get('CustomerReviews', {})
        rating = None
        review_count = None
        
        if reviews.get('StarRating'):
            rating = float(reviews['StarRating']['Value'])
        if reviews.get('Count'):
            review_count = reviews['Count']
        
        # Extract category
        browse_nodes = item.get('BrowseNodeInfo', {}).get('BrowseNodes', [])
        category = params.product_category or 'General'
        if browse_nodes:
            category = browse_nodes[0].get('DisplayName', category)
        
        # Calculate commission (Amazon Associates typical rates)
        commission_rate = self._get_amazon_commission_rate(category)
        commission_amount = price * (commission_rate / 100)
        
        # Calculate trending and competition scores
        trending_score = self._calculate_trending_score(item, params)
        competition_score = self._calculate_competition_score(item, params)
        
        # Extract image
        image_url = None
        images = item.get('Images', {}).get('Primary', {})
        if images.get('Large'):
            image_url = images['Large']['URL']
        
        return ProductData(
            title=title,
            description=description,
            brand=item.get('ItemInfo', {}).get('ByLineInfo', {}).get('Brand', {}).get('DisplayValue'),
            category=category,
            niche=params.niche,
            price=price,
            original_price=original_price,
            commission_rate=commission_rate,
            commission_amount=commission_amount,
            product_url=f"https://amazon.com/dp/{asin}",
            affiliate_url=f"https://amazon.com/dp/{asin}?tag={self.partner_tag}",
            image_url=image_url,
            asin=asin,
            sku=asin,
            rating=rating,
            review_count=review_count,
            sales_rank=item.get('SalesRank'),
            trending_score=trending_score,
            competition_score=competition_score,
            research_score=0,  # Will be calculated later
            keywords=title.lower().split()[:10],
            search_volume=None,  # Will be enriched by other APIs
            difficulty=None,
            api_source='amazon',
            external_id=asin,
            tags=[category.lower(), params.niche.lower()]
        )
    
    def _get_amazon_commission_rate(self, category: str) -> float:
        """Get typical Amazon Associates commission rates by category"""
        commission_rates = {
            'luxury beauty': 10.0,
            'amazon coins': 10.0,
            'digital music': 10.0,
            'physical music': 8.0,
            'handmade': 8.0,
            'digital video games': 8.0,
            'physical video games': 6.0,
            'pc components': 5.0,
            'headphones': 4.0,
            'beauty': 4.0,
            'musical instruments': 4.0,
            'business products': 4.0,
            'wireless products': 4.0,
            'electronics': 3.0,
            'cameras': 3.0,
            'toys': 3.0,
            'kitchen': 3.0,
            'automotive': 3.0,
            'sports': 3.0
        }
        
        category_lower = category.lower()
        for key, rate in commission_rates.items():
            if key in category_lower:
                return rate
        
        return 3.0  # Default rate
    
    def _calculate_trending_score(self, item: Dict, params: ProductResearchParams) -> float:
        """Calculate trending score based on Amazon data"""
        # Base score
        score = 50.0
        
        # Boost for high ratings
        reviews = item.get('CustomerReviews', {})
        if reviews.get('StarRating'):
            rating = float(reviews['StarRating']['Value'])
            score += (rating - 3.0) * 10  # +20 for 5-star, +10 for 4-star
        
        # Boost for review velocity (more recent reviews)
        if reviews.get('Count'):
            review_count = reviews['Count']
            if review_count > 1000:
                score += 20
            elif review_count > 100:
                score += 10
        
        # Check for Amazon's Choice or Best Seller badges
        if item.get('ItemInfo', {}).get('Classifications', {}):
            classifications = item['ItemInfo']['Classifications']
            if any('choice' in str(c).lower() or 'bestseller' in str(c).lower() 
                   for c in classifications.values()):
                score += 15
        
        return min(score, 100)
    
    def _calculate_competition_score(self, item: Dict, params: ProductResearchParams) -> float:
        """Calculate competition score (higher = more competitive)"""
        # Base competition score
        score = 50.0
        
        # More reviews often means more competition
        reviews = item.get('CustomerReviews', {})
        if reviews.get('Count'):
            review_count = reviews['Count']
            if review_count > 5000:
                score += 30
            elif review_count > 1000:
                score += 20
            elif review_count > 100:
                score += 10
        
        # Price competition indicator
        offers = item.get('Offers', {}).get('Listings', [])
        if len(offers) > 1:  # Multiple sellers = more competition
            score += 15
        
        return min(score, 100)
    
    def _meets_criteria(self, product: ProductData, params: ProductResearchParams) -> bool:
        """Check if product meets research criteria"""
        if product.commission_rate < params.min_commission_rate:
            return False
        
        if product.trending_score < params.min_trending_score:
            return False
        
        if not (params.price_range[0] <= product.price <= params.price_range[1]):
            return False
        
        return True

class AIProductResearcher:
    """AI-powered product research and competition analysis"""
    
    def __init__(self):
        self.ai_engine = None
        try:
            from .AIEngineService import AIEngineService
            self.ai_engine = AIEngineService()
        except ImportError:
            logger.warning("AI Engine not available")
    
    async def enrich_product_data(self, products: List[ProductData]) -> List[ProductData]:
        """Enrich products with AI-powered search volume and competition data"""
        if not self.ai_engine:
            return products
        
        enriched_products = []
        
        for product in products:
            try:
                # Use AI to estimate search volume and competition
                search_data = await self._estimate_search_metrics(product.title)
                if search_data:
                    product.search_volume = search_data.get('search_volume', 0)
                    product.difficulty = search_data.get('difficulty', 50)
                
                # AI-powered competition analysis
                competition_data = await self._analyze_ai_competition(product.keywords[:3])
                if competition_data:
                    product.competition_score = min(
                        product.competition_score + competition_data.get('ai_competition', 0),
                        100
                    )
                
                enriched_products.append(product)
                
                # Rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error enriching product {product.title}: {e}")
                enriched_products.append(product)
        
        return enriched_products
    
    async def _get_search_volume(self, query: str) -> Optional[Dict]:
        """Get search volume data for a query"""
        try:
            search = GoogleSearch({
                "q": query,
                "api_key": self.api_key,
                "engine": "google",
                "google_domain": "google.com",
                "gl": "us",
                "hl": "en"
            })
            
            results = search.get_dict()
            
            # Extract search volume indicators
            search_info = results.get('search_information', {})
            total_results = search_info.get('total_results', 0)
            
            # Estimate search volume based on total results and other factors
            estimated_volume = min(total_results // 1000, 50000)
            
            # Calculate difficulty based on top results
            organic_results = results.get('organic_results', [])
            difficulty = self._calculate_serp_difficulty(organic_results)
            
            return {
                'search_volume': estimated_volume,
                'difficulty': difficulty,
                'total_results': total_results
            }
            
        except Exception as e:
            logger.error(f"SerpAPI search volume error: {e}")
            return None
    
    async def _analyze_competition(self, keywords: List[str]) -> Optional[Dict]:
        """Analyze competition for keywords"""
        try:
            query = ' '.join(keywords[:3])
            
            search = GoogleSearch({
                "q": f"{query} review",
                "api_key": self.api_key,
                "engine": "google",
                "google_domain": "google.com",
                "gl": "us",
                "hl": "en",
                "num": 20
            })
            
            results = search.get_dict()
            organic_results = results.get('organic_results', [])
            
            # Analyze competition indicators
            competition_score = 0
            
            # Count affiliate/review sites in top results
            affiliate_domains = ['amazon.com', 'bestbuy.com', 'walmart.com', 'target.com']
            review_indicators = ['review', 'best', 'top', 'comparison', 'vs']
            
            for result in organic_results[:10]:
                title = result.get('title', '').lower()
                link = result.get('link', '').lower()
                
                # High competition indicators
                if any(domain in link for domain in affiliate_domains):
                    competition_score += 5
                
                if any(indicator in title for indicator in review_indicators):
                    competition_score += 3
            
            return {
                'serp_competition': min(competition_score, 50),
                'top_competitors': len([r for r in organic_results[:5] 
                                      if any(ind in r.get('title', '').lower() 
                                           for ind in review_indicators)])
            }
            
        except Exception as e:
            logger.error(f"Competition analysis error: {e}")
            return None
    
    def _calculate_serp_difficulty(self, organic_results: List[Dict]) -> int:
        """Calculate SEO difficulty based on SERP analysis"""
        difficulty = 30  # Base difficulty
        
        # Analyze top 10 results
        for i, result in enumerate(organic_results[:10]):
            title = result.get('title', '').lower()
            link = result.get('link', '').lower()
            
            # High authority domains increase difficulty
            authority_domains = ['amazon.com', 'wikipedia.org', 'reddit.com']
            if any(domain in link for domain in authority_domains):
                difficulty += (10 - i)  # Higher weight for top positions
            
            # Commercial intent keywords
            commercial_terms = ['buy', 'best', 'top', 'review', 'price']
            if any(term in title for term in commercial_terms):
                difficulty += 5
        
        return min(difficulty, 100)

class ProductResearchEngine:
    """Main product research orchestrator"""
    
    def __init__(self):
        self.amazon_researcher = AmazonProductResearcher()
        self.ai_researcher = AIProductResearcher()
        self.scoring_engine = ProductScoringEngine()
    
    async def research_products(self, params: ProductResearchParams) -> Dict[str, Any]:
        """Main product research function"""
        start_time = time.time()
        
        try:
            # Collect products from different sources
            all_products = []
            api_sources = []
            api_calls = 0
            
            # Amazon Research
            if self.amazon_researcher.amazon_api:
                logger.info(f"Searching Amazon for: {params.niche}")
                amazon_products = await self.amazon_researcher.search_products(params)
                all_products.extend(amazon_products)
                api_sources.append('amazon')
                api_calls += 1
                logger.info(f"Found {len(amazon_products)} Amazon products")
            
            # Enrich with SerpAPI data
            if self.serp_researcher.api_key and all_products:
                logger.info("Enriching products with search data")
                all_products = await self.serp_researcher.enrich_product_data(all_products)
                api_sources.append('serpapi')
                api_calls += len(all_products)
            
            # Calculate niche data for scoring context
            niche_data = self._calculate_niche_context(all_products, params)
            
            # Score all products
            for product in all_products:
                product.research_score = self.scoring_engine.calculate_score(product, niche_data)
            
            # Sort by research score
            sorted_products = sorted(all_products, key=lambda p: p.research_score, reverse=True)
            
            # Limit results
            final_products = sorted_products[:params.max_results]
            
            # Calculate session statistics
            duration_ms = int((time.time() - start_time) * 1000)
            avg_score = sum(p.research_score for p in final_products) / len(final_products) if final_products else 0
            top_product = final_products[0] if final_products else None
            
            return {
                'products': final_products,
                'session_data': {
                    'total_products_found': len(all_products),
                    'products_returned': len(final_products),
                    'average_score': round(avg_score, 2),
                    'top_product': top_product,
                    'api_calls_made': api_calls,
                    'api_sources': api_sources,
                    'research_duration_ms': duration_ms,
                    'niche_insights': niche_data
                }
            }
            
        except Exception as e:
            logger.error(f"Product research error: {e}")
            return {
                'products': [],
                'session_data': {
                    'error': str(e),
                    'research_duration_ms': int((time.time() - start_time) * 1000)
                }
            }
    
    def _calculate_niche_context(self, products: List[ProductData], params: ProductResearchParams) -> Dict:
        """Calculate niche-specific context data for scoring"""
        if not products:
            return {'avg_price': 100, 'avg_commission': 5.0, 'avg_search_volume': 1000}
        
        prices = [float(p.price) for p in products if p.price]
        commissions = [float(p.commission_rate) for p in products if p.commission_rate]
        volumes = [p.search_volume for p in products if p.search_volume]
        
        return {
            'avg_price': sum(prices) / len(prices) if prices else 100,
            'avg_commission': sum(commissions) / len(commissions) if commissions else 5.0,
            'avg_search_volume': sum(volumes) / len(volumes) if volumes else 1000,
            'price_range': (min(prices), max(prices)) if prices else (0, 1000),
            'total_products': len(products),
            'niche': params.niche,
            'category': params.product_category
        }

# Main function for external calls
async def research_products_async(
    niche: str,
    product_category: str = None,
    min_commission_rate: float = 3.0,
    min_trending_score: float = 50.0,
    max_results: int = 50,
    target_keywords: List[str] = None,
    price_range: Tuple[float, float] = (0, 10000)
) -> Dict[str, Any]:
    """Async entry point for product research"""
    
    params = ProductResearchParams(
        niche=niche,
        product_category=product_category,
        min_commission_rate=min_commission_rate,
        min_trending_score=min_trending_score,
        max_results=max_results,
        target_keywords=target_keywords or [],
        price_range=price_range
    )
    
    engine = ProductResearchEngine()
    return await engine.research_products(params)

def research_products_sync(*args, **kwargs):
    """Synchronous wrapper for product research"""
    return asyncio.run(research_products_async(*args, **kwargs))

if __name__ == "__main__":
    # Test the research engine
    async def test_research():
        result = await research_products_async(
            niche="wireless headphones",
            product_category="electronics",
            min_commission_rate=3.0,
            max_results=10
        )
        print(json.dumps(result['session_data'], indent=2, default=str))
        
        if result['products']:
            print(f"\nTop product: {result['products'][0].title}")
            print(f"Score: {result['products'][0].research_score}")
            print(f"Commission: ${result['products'][0].commission_amount:.2f}")
    
    asyncio.run(test_research())