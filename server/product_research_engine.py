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
import requests
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

class SerpApiResearcher:
    """SerpAPI integration for search trends and competition analysis"""
    
    def __init__(self):
        self.api_key = os.getenv('SERP_API_KEY')
        if not self.api_key:
            logger.warning("SerpAPI key not configured")
    
    async def search_products(self, params: ProductResearchParams) -> List[ProductData]:
        """Search products using SerpAPI Shopping engine"""
        if not self.api_key:
            logger.warning("SerpAPI key not configured")
            return []
        
        try:
            # Build search query from niche and category
            search_terms = [params.niche]
            if params.product_category:
                search_terms.append(params.product_category)
            if params.target_keywords:
                search_terms.extend(params.target_keywords[:3])
            
            query = ' '.join(search_terms)
            logger.info(f"Searching SerpAPI Shopping for: {query}")
            
            # Search using SerpAPI Shopping engine with requests
            search_params = {
                "q": query,
                "api_key": self.api_key,
                "engine": "google_shopping",
                "google_domain": "google.com",
                "gl": "us",
                "hl": "en",
                "num": min(params.max_results, 50)
            }
            
            response = requests.get('https://serpapi.com/search', params=search_params)
            response.raise_for_status()
            results = response.json()
            shopping_results = results.get('shopping_results', [])
            
            products = []
            for item in shopping_results:
                try:
                    product_data = self._parse_shopping_item(item, params)
                    if product_data and self._meets_criteria(product_data, params):
                        products.append(product_data)
                except Exception as e:
                    logger.error(f"Error parsing shopping item: {e}")
                    continue
            
            logger.info(f"Found {len(products)} products from SerpAPI Shopping")
            return products
            
        except Exception as e:
            logger.error(f"SerpAPI Shopping search error: {e}")
            return []
    
    def _parse_shopping_item(self, item: Dict, params: ProductResearchParams) -> Optional[ProductData]:
        """Parse SerpAPI shopping item into ProductData"""
        try:
            title = item.get('title', '')
            if not title:
                return None
            
            # Extract basic info
            description = item.get('snippet', '')
            brand = item.get('source', '').split('.')[0] if item.get('source') else None
            category = params.product_category or 'General'
            
            # Extract pricing
            price_str = item.get('price', '0')
            price = 0
            try:
                # Remove currency symbols and extract number
                price_clean = ''.join(c for c in price_str if c.isdigit() or c == '.')
                price = float(price_clean) if price_clean else 0
            except:
                price = 0
            
            original_price_str = item.get('compared_at_price', item.get('original_price'))
            original_price = None
            if original_price_str:
                try:
                    original_price_clean = ''.join(c for c in original_price_str if c.isdigit() or c == '.')
                    original_price = float(original_price_clean) if original_price_clean else None
                except:
                    original_price = None
            
            # Extract reviews
            rating = None
            review_count = None
            if item.get('rating'):
                try:
                    rating = float(item['rating'])
                except:
                    rating = None
            
            if item.get('reviews'):
                try:
                    review_count = int(item['reviews'])
                except:
                    review_count = None
            
            # Estimate commission rates based on source/category
            commission_rate = self._estimate_commission_rate(item.get('source', ''), category)
            commission_amount = price * (commission_rate / 100) if price else 0
            
            # Calculate trending and competition scores
            trending_score = self._calculate_trending_score_shopping(item, params)
            competition_score = self._calculate_competition_score_shopping(item, params)
            
            # Extract URLs and images
            product_url = item.get('link', '')
            # Generate affiliate URL with tracking parameters
            affiliate_url = self._generate_affiliate_url(product_url, item.get('source', ''), commission_rate)
            image_url = item.get('thumbnail', '')
            
            # Generate external ID
            external_id = item.get('product_id') or f"serp_{hash(product_url)}"
            
            return ProductData(
                title=title,
                description=description,
                brand=brand,
                category=category,
                niche=params.niche,
                price=price,
                original_price=original_price,
                commission_rate=commission_rate,
                commission_amount=commission_amount,
                product_url=product_url,
                affiliate_url=affiliate_url,
                image_url=image_url,
                asin=None,
                sku=external_id,
                rating=rating,
                review_count=review_count,
                sales_rank=None,
                trending_score=trending_score,
                competition_score=competition_score,
                research_score=0,  # Will be calculated later
                keywords=title.lower().split()[:10],
                search_volume=None,  # Will be enriched later
                difficulty=None,
                api_source='serpapi_live',  # Changed from 'serpapi_shopping' to 'serpapi_live'
                external_id=external_id,
                tags=[category.lower(), params.niche.lower()]
            )
            
        except Exception as e:
            logger.error(f"Error parsing shopping item: {e}")
            return None
    
    def _estimate_commission_rate(self, source: str, category: str) -> float:
        """Estimate commission rates based on source and category"""
        source_lower = source.lower()
        category_lower = category.lower()
        
        # Source-based rates
        if 'amazon' in source_lower:
            return self._get_amazon_commission_rate(category)
        elif any(store in source_lower for store in ['walmart', 'target', 'bestbuy']):
            return 4.0
        elif any(store in source_lower for store in ['ebay', 'etsy']):
            return 2.0
        elif any(store in source_lower for store in ['shopify', 'store']):
            return 5.0
        
        # Category-based fallback rates
        category_rates = {
            'electronics': 3.0,
            'beauty': 4.0,
            'fashion': 6.0,
            'home': 4.0,
            'sports': 3.0,
            'toys': 3.0,
            'books': 4.5,
            'health': 5.0
        }
        
        for key, rate in category_rates.items():
            if key in category_lower:
                return rate
        
        return 4.0  # Default rate
    
    def _generate_affiliate_url(self, product_url: str, source: str, commission_rate: float) -> str:
        """Generate affiliate URL with tracking parameters"""
        try:
            from urllib.parse import urlparse, urlencode, parse_qs
            import uuid
            
            if not product_url:
                return ""
            
            parsed_url = urlparse(product_url)
            source_lower = source.lower()
            
            # Generate tracking ID
            tracking_id = str(uuid.uuid4()).replace('-', '')[:16]
            
            # Source-specific affiliate URL generation
            if 'amazon' in source_lower:
                # Amazon affiliate link format
                affiliate_params = {
                    'tag': 'firekyt-20',  # Replace with actual Amazon Associates tag
                    'linkCode': 'as2',
                    'camp': '1634',
                    'creative': '6738',
                    'creativeASIN': tracking_id
                }
                base_url = product_url.split('?')[0]  # Remove existing parameters
                return f"{base_url}?{urlencode(affiliate_params)}"
            
            elif any(store in source_lower for store in ['walmart', 'target', 'bestbuy']):
                # Generic affiliate link with tracking
                affiliate_params = {
                    'utm_source': 'firekyt',
                    'utm_medium': 'affiliate',
                    'utm_campaign': 'product_research',
                    'utm_content': tracking_id,
                    'ref': 'firekyt'
                }
                separator = '&' if '?' in product_url else '?'
                return f"{product_url}{separator}{urlencode(affiliate_params)}"
            
            else:
                # Generic tracking for other sources
                affiliate_params = {
                    'utm_source': 'firekyt',
                    'utm_medium': 'affiliate',
                    'utm_campaign': 'research',
                    'ref': tracking_id
                }
                separator = '&' if '?' in product_url else '?'
                return f"{product_url}{separator}{urlencode(affiliate_params)}"
                
        except Exception as e:
            logger.error(f"Error generating affiliate URL: {e}")
            return product_url  # Return original URL if affiliate generation fails
    
    def _get_amazon_commission_rate(self, category: str) -> float:
        """Get typical Amazon Associates commission rates by category"""
        commission_rates = {
            'luxury beauty': 10.0,
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
    
    def _calculate_trending_score_shopping(self, item: Dict, params: ProductResearchParams) -> float:
        """Calculate trending score based on shopping data"""
        score = 50.0
        
        # Boost for high ratings
        if item.get('rating'):
            try:
                rating = float(item['rating'])
                score += (rating - 3.0) * 10  # +20 for 5-star, +10 for 4-star
            except:
                pass
        
        # Boost for review count
        if item.get('reviews'):
            try:
                review_count = int(item['reviews'])
                if review_count > 1000:
                    score += 20
                elif review_count > 100:
                    score += 10
                elif review_count > 10:
                    score += 5
            except:
                pass
        
        # Boost for price competitiveness
        if item.get('compared_at_price') or item.get('original_price'):
            score += 10  # Has discount/sale price
        
        return min(score, 100)
    
    def _calculate_competition_score_shopping(self, item: Dict, params: ProductResearchParams) -> float:
        """Calculate competition score for shopping items"""
        score = 50.0
        
        # More reviews often means more competition
        if item.get('reviews'):
            try:
                review_count = int(item['reviews'])
                if review_count > 5000:
                    score += 30
                elif review_count > 1000:
                    score += 20
                elif review_count > 100:
                    score += 10
            except:
                pass
        
        # High rating might indicate saturated market
        if item.get('rating'):
            try:
                rating = float(item['rating'])
                if rating > 4.5:
                    score += 10
            except:
                pass
        
        return min(score, 100)
    
    def _meets_criteria(self, product: ProductData, params: ProductResearchParams) -> bool:
        """Check if product meets research criteria"""
        if not product:
            return False
            
        if product.commission_rate < params.min_commission_rate:
            return False
        
        if product.trending_score < params.min_trending_score:
            return False
        
        if not (params.price_range[0] <= product.price <= params.price_range[1]):
            return False
        
        return True

    async def enrich_product_data(self, products: List[ProductData]) -> List[ProductData]:
        """Enrich products with search volume and competition data"""
        if not self.api_key:
            return products
        
        enriched_products = []
        
        for product in products:
            try:
                # Get search volume for main keywords
                search_data = await self._get_search_volume(product.title)
                if search_data:
                    product.search_volume = search_data.get('search_volume', 0)
                    product.difficulty = search_data.get('difficulty', 50)
                
                # Update competition score based on search results
                competition_data = await self._analyze_competition(product.keywords[:3])
                if competition_data:
                    # Adjust competition score based on SERP analysis
                    product.competition_score = min(
                        product.competition_score + competition_data.get('serp_competition', 0),
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
            search_params = {
                "q": query,
                "api_key": self.api_key,
                "engine": "google",
                "google_domain": "google.com",
                "gl": "us",
                "hl": "en"
            }
            
            response = requests.get('https://serpapi.com/search', params=search_params)
            response.raise_for_status()
            results = response.json()
            
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
            
            search_params = {
                "q": f"{query} review",
                "api_key": self.api_key,
                "engine": "google",
                "google_domain": "google.com",
                "gl": "us",
                "hl": "en",
                "num": 20
            }
            
            response = requests.get('https://serpapi.com/search', params=search_params)
            response.raise_for_status()
            results = response.json()
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
    
    def _generate_affiliate_url(self, product_url: str, source: str, commission_rate: float) -> str:
        """Generate affiliate URL with tracking parameters"""
        try:
            from urllib.parse import urlparse, urlencode, parse_qs
            import uuid
            
            if not product_url:
                return ""
            
            parsed_url = urlparse(product_url)
            source_lower = source.lower()
            
            # Generate tracking ID
            tracking_id = str(uuid.uuid4()).replace('-', '')[:16]
            
            # Source-specific affiliate URL generation
            if 'amazon' in source_lower:
                # Amazon affiliate link format
                affiliate_params = {
                    'tag': 'firekyt-20',  # Replace with actual Amazon Associates tag
                    'linkCode': 'as2',
                    'camp': '1634',
                    'creative': '6738',
                    'creativeASIN': tracking_id
                }
                base_url = product_url.split('?')[0]  # Remove existing parameters
                return f"{base_url}?{urlencode(affiliate_params)}"
            
            elif any(store in source_lower for store in ['walmart', 'target', 'bestbuy']):
                # Generic affiliate link with tracking
                affiliate_params = {
                    'utm_source': 'firekyt',
                    'utm_medium': 'affiliate',
                    'utm_campaign': 'product_research',
                    'utm_content': tracking_id,
                    'ref': 'firekyt'
                }
                separator = '&' if '?' in product_url else '?'
                return f"{product_url}{separator}{urlencode(affiliate_params)}"
            
            else:
                # Generic tracking for other sources
                affiliate_params = {
                    'utm_source': 'firekyt',
                    'utm_medium': 'affiliate',
                    'utm_campaign': 'research',
                    'ref': tracking_id
                }
                separator = '&' if '?' in product_url else '?'
                return f"{product_url}{separator}{urlencode(affiliate_params)}"
                
        except Exception as e:
            logger.error(f"Error generating affiliate URL: {e}")
            return product_url  # Return original URL if affiliate generation fails

class ProductResearchEngine:
    """Main product research orchestrator"""
    
    def __init__(self):
        self.amazon_researcher = AmazonProductResearcher()
        self.serp_researcher = SerpApiResearcher()
        self.scoring_engine = ProductScoringEngine()
    
    async def research_products(self, params: ProductResearchParams) -> Dict[str, Any]:
        """Main product research function"""
        start_time = time.time()
        
        try:
            # Collect products from different sources
            all_products = []
            api_sources = []
            api_calls = 0
            
            # Primary Source: SerpAPI Shopping Research
            if self.serp_researcher.api_key:
                logger.info(f"Searching SerpAPI Shopping for: {params.niche}")
                serp_products = await self.serp_researcher.search_products(params)
                all_products.extend(serp_products)
                api_sources.append('serpapi_shopping')
                api_calls += 1
                logger.info(f"Found {len(serp_products)} products from SerpAPI Shopping")
            else:
                logger.error("SerpAPI key not configured - cannot perform product research")
                return {
                    'products': [],
                    'session_data': {
                        'error': 'No affiliate networks configured. Please add your affiliate network credentials first.',
                        'research_duration_ms': int((time.time() - start_time) * 1000)
                    }
                }
            
            # Fallback: Amazon Research (if available and no SerpAPI results)
            if not all_products and self.amazon_researcher.amazon_api:
                logger.info(f"Fallback: Searching Amazon for: {params.niche}")
                amazon_products = await self.amazon_researcher.search_products(params)
                all_products.extend(amazon_products)
                api_sources.append('amazon')
                api_calls += 1
                logger.info(f"Found {len(amazon_products)} Amazon products")
            
            # Enrich with additional SerpAPI data (search volume, competition)
            if self.serp_researcher.api_key and all_products:
                logger.info("Enriching products with search data")
                all_products = await self.serp_researcher.enrich_product_data(all_products)
                if 'serpapi_enrichment' not in api_sources:
                    api_sources.append('serpapi_enrichment')
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
                    'data_source': 'live_data',  # Added to remove "Sample Data" tags
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
    import argparse
    import sys
    
    # Command line interface
    parser = argparse.ArgumentParser(description='Product Research Engine using SerpAPI')
    parser.add_argument('--niche', required=True, help='Product niche to research')
    parser.add_argument('--category', default='electronics', help='Product category')
    parser.add_argument('--min-commission', type=float, default=3.0, help='Minimum commission rate')
    parser.add_argument('--min-trending', type=float, default=50.0, help='Minimum trending score')
    parser.add_argument('--max-results', type=int, default=50, help='Maximum results to return')
    parser.add_argument('--min-price', type=float, default=0, help='Minimum price')
    parser.add_argument('--max-price', type=float, default=10000, help='Maximum price')
    parser.add_argument('--keywords', default='', help='Target keywords (comma-separated)')
    
    args = parser.parse_args()
    
    # Parse keywords
    target_keywords = [k.strip() for k in args.keywords.split(',') if k.strip()] if args.keywords else []
    
    async def main():
        try:
            result = await research_products_async(
                niche=args.niche,
                product_category=args.category,
                min_commission_rate=args.min_commission,
                min_trending_score=args.min_trending,
                max_results=args.max_results,
                target_keywords=target_keywords,
                price_range=(args.min_price, args.max_price)
            )
            
            # Convert ProductData objects to dictionaries for JSON serialization
            serialized_result = {
                'products': [],
                'session_data': result.get('session_data', {})
            }
            
            for product in result.get('products', []):
                if hasattr(product, '__dict__'):
                    # Convert ProductData object to dictionary
                    product_dict = {
                        'title': product.title,
                        'description': product.description,
                        'brand': product.brand,
                        'category': product.category,
                        'niche': product.niche,
                        'price': product.price,
                        'original_price': product.original_price,
                        'commission_rate': product.commission_rate,
                        'commission_amount': product.commission_amount,
                        'product_url': product.product_url,
                        'affiliate_url': product.affiliate_url,
                        'image_url': product.image_url,
                        'asin': product.asin,
                        'sku': product.sku,
                        'rating': product.rating,
                        'review_count': product.review_count,
                        'sales_rank': product.sales_rank,
                        'trending_score': product.trending_score,
                        'competition_score': product.competition_score,
                        'research_score': product.research_score,
                        'keywords': product.keywords,
                        'search_volume': product.search_volume,
                        'difficulty': product.difficulty,
                        'api_source': product.api_source,
                        'external_id': product.external_id,
                        'tags': product.tags
                    }
                    serialized_result['products'].append(product_dict)
                else:
                    # Already a dictionary
                    serialized_result['products'].append(product)
            
            # Output JSON result for Node.js to consume
            print(json.dumps(serialized_result, indent=2, default=str))
            
        except Exception as e:
            # Output error in JSON format
            error_result = {
                'products': [],
                'session_data': {
                    'error': str(e),
                    'research_duration_ms': 0
                }
            }
            print(json.dumps(error_result, indent=2))
            sys.exit(1)
    
    asyncio.run(main())