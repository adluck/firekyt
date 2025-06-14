#!/usr/bin/env python3
"""
Product Research Engine - Test Version
Demonstrates functionality with sample data for development and testing
"""

import json
import sys
import random
import time
from typing import List, Dict, Any

def generate_sample_products(niche: str, category: str = None, max_results: int = 10) -> List[Dict[str, Any]]:
    """Generate realistic sample products for testing"""
    
    # Sample product templates based on niche
    product_templates = {
        'fitness': [
            {'title': 'Adjustable Dumbbells Set', 'category': 'exercise equipment', 'base_price': 199.99},
            {'title': 'Resistance Bands Kit', 'category': 'exercise equipment', 'base_price': 29.99},
            {'title': 'Yoga Mat Premium', 'category': 'exercise equipment', 'base_price': 49.99},
            {'title': 'Protein Powder Whey', 'category': 'supplements', 'base_price': 39.99},
            {'title': 'Fitness Tracker Smart', 'category': 'electronics', 'base_price': 149.99},
        ],
        'tech': [
            {'title': 'Wireless Bluetooth Earbuds', 'category': 'electronics', 'base_price': 79.99},
            {'title': 'Smartphone Stand Adjustable', 'category': 'accessories', 'base_price': 24.99},
            {'title': 'USB-C Fast Charger', 'category': 'accessories', 'base_price': 19.99},
            {'title': 'Laptop Cooling Pad', 'category': 'accessories', 'base_price': 34.99},
            {'title': 'Wireless Mouse Ergonomic', 'category': 'accessories', 'base_price': 39.99},
        ],
        'home': [
            {'title': 'Essential Oil Diffuser', 'category': 'home decor', 'base_price': 45.99},
            {'title': 'Memory Foam Pillow', 'category': 'bedding', 'base_price': 29.99},
            {'title': 'LED Strip Lights', 'category': 'lighting', 'base_price': 22.99},
            {'title': 'Coffee Maker Single Serve', 'category': 'kitchen', 'base_price': 89.99},
            {'title': 'Air Purifier HEPA', 'category': 'appliances', 'base_price': 199.99},
        ]
    }
    
    # Get templates for the niche, fallback to tech if not found
    templates = product_templates.get(niche.lower(), product_templates['tech'])
    
    products = []
    for i in range(min(max_results, len(templates) * 2)):
        template = random.choice(templates)
        
        # Add variation to make each product unique
        variation_suffix = random.choice(['Pro', 'Max', 'Ultra', 'Premium', 'Advanced', '2024'])
        price_variation = random.uniform(0.8, 1.3)
        
        product = {
            'title': f"{template['title']} {variation_suffix}",
            'description': f"High-quality {template['title'].lower()} perfect for {niche} enthusiasts. Features advanced technology and premium materials.",
            'brand': random.choice(['TopBrand', 'ProGear', 'EliteChoice', 'PremiumTech', 'QualityFirst']),
            'category': category or template['category'],
            'niche': niche,
            'price': round(template['base_price'] * price_variation, 2),
            'original_price': round(template['base_price'] * price_variation * 1.2, 2),
            'commission_rate': round(random.uniform(3.0, 12.0), 1),
            'commission_amount': 0,  # Will be calculated
            'product_url': f"https://example-store.com/product/{i+1}",
            'affiliate_url': f"https://affiliate.example.com/link/{i+1}",
            'image_url': f"https://images.example.com/product-{i+1}.jpg",
            'asin': f"B0{random.randint(10000000, 99999999)}",
            'sku': f"SKU{random.randint(1000, 9999)}",
            'rating': round(random.uniform(3.5, 5.0), 1),
            'review_count': random.randint(50, 2000),
            'sales_rank': random.randint(1000, 50000),
            'trending_score': round(random.uniform(40, 95), 1),
            'competition_score': round(random.uniform(20, 80), 1),
            'research_score': 0,  # Will be calculated
            'keywords': generate_keywords(template['title'], niche),
            'search_volume': random.randint(1000, 50000),
            'difficulty': random.randint(30, 85),
            'api_source': 'test_data',
            'external_id': f"test_{i+1}",
            'tags': [niche, template['category'], 'bestseller']
        }
        
        # Calculate commission amount
        product['commission_amount'] = round(product['price'] * product['commission_rate'] / 100, 2)
        
        # Calculate research score
        product['research_score'] = calculate_research_score(product)
        
        products.append(product)
    
    # Sort by research score descending
    products.sort(key=lambda x: x['research_score'], reverse=True)
    
    return products[:max_results]

def generate_keywords(title: str, niche: str) -> List[str]:
    """Generate relevant keywords for a product"""
    base_keywords = title.lower().split()
    niche_keywords = [niche.lower()]
    
    additional_keywords = {
        'fitness': ['workout', 'exercise', 'gym', 'training', 'health'],
        'tech': ['technology', 'gadget', 'device', 'smart', 'digital'],
        'home': ['household', 'decor', 'comfort', 'lifestyle', 'interior']
    }
    
    keywords = base_keywords + niche_keywords
    if niche.lower() in additional_keywords:
        keywords.extend(random.sample(additional_keywords[niche.lower()], 2))
    
    return list(set(keywords))[:8]

def calculate_research_score(product: Dict[str, Any]) -> float:
    """Calculate a comprehensive research score for the product"""
    
    # Scoring factors
    commission_score = min(product['commission_rate'] * 5, 50)  # Max 50 points
    trending_score = product['trending_score'] * 0.3  # Max 30 points
    rating_score = (product['rating'] - 3) * 10  # Max 20 points for 5-star rating
    
    # Competition factor (lower is better)
    competition_factor = max(0, (100 - product['competition_score']) * 0.2)  # Max 20 points
    
    # Volume factor
    volume_score = min(product['search_volume'] / 1000, 30)  # Max 30 points
    
    # Combine scores
    total_score = commission_score + trending_score + rating_score + competition_factor + volume_score
    
    # Add some randomness for realism
    total_score += random.uniform(-5, 5)
    
    return round(max(0, min(100, total_score)), 1)

def main():
    """Main function to handle research requests"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            raise ValueError("No input data provided")
        
        params = json.loads(input_data)
        
        # Extract parameters
        niche = params.get('niche', 'tech')
        category = params.get('product_category')
        max_results = min(params.get('max_results', 10), 50)
        min_commission = params.get('min_commission_rate', 3.0)
        min_trending = params.get('min_trending_score', 50.0)
        
        # Simulate processing time
        time.sleep(random.uniform(1, 3))
        
        # Generate sample products
        all_products = generate_sample_products(niche, category, max_results * 2)
        
        # Filter products based on criteria
        filtered_products = []
        for product in all_products:
            if (product['commission_rate'] >= min_commission and 
                product['trending_score'] >= min_trending):
                filtered_products.append(product)
        
        # Limit to max results
        filtered_products = filtered_products[:max_results]
        
        # Calculate session statistics
        avg_score = sum(p['research_score'] for p in filtered_products) / len(filtered_products) if filtered_products else 0
        
        # Prepare response
        response = {
            'products': filtered_products,
            'session_data': {
                'total_products_found': len(filtered_products),
                'average_score': round(avg_score, 1),
                'api_sources': ['test_data'],
                'api_calls_made': 1,
                'research_duration_ms': random.randint(1500, 4000),
                'niche_insights': {
                    'top_categories': [category or 'mixed'],
                    'avg_commission_rate': round(sum(p['commission_rate'] for p in filtered_products) / len(filtered_products), 1) if filtered_products else 0,
                    'competition_level': 'medium'
                }
            }
        }
        
        # Output JSON response
        print(json.dumps(response))
        
    except Exception as e:
        # Error response
        error_response = {
            'error': str(e),
            'products': [],
            'session_data': {
                'total_products_found': 0,
                'average_score': 0,
                'api_sources': [],
                'api_calls_made': 0,
                'research_duration_ms': 0
            }
        }
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()