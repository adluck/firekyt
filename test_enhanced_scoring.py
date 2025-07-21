#!/usr/bin/env python3
"""
Test script for Enhanced Intelligent Scoring with Rye.com Integration
Tests the complete API endpoint flow with real-time product data scoring
"""

import asyncio
import sys
import json
import time

# Add server directory to path
sys.path.append('server')

from rye_service import research_products_async

async def test_enhanced_api_scoring():
    """Test enhanced scoring system as it would be called from the API endpoint"""
    
    print("🧪 Testing Enhanced Intelligent Scoring System")
    print("=" * 60)
    
    # Test parameters matching API endpoint
    test_cases = [
        {
            "niche": "gaming laptops",
            "product_category": "Electronics",
            "max_results": 10
        },
        {
            "niche": "wireless headphones",
            "product_category": "Audio",
            "max_results": 15
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 Test Case {i}: {test_case['niche']}")
        print("-" * 40)
        
        start_time = time.time()
        
        try:
            # Call the enhanced research function
            result = await research_products_async(
                niche=test_case["niche"],
                product_category=test_case["product_category"],
                max_results=test_case["max_results"]
            )
            
            end_time = time.time()
            
            # Verify enhanced scoring results
            if result.get("success"):
                products = result.get("products", [])
                research_insights = result.get("research_insights", {})
                research_metadata = result.get("research_metadata", {})
                
                print(f"✅ SUCCESS - Analysis completed in {end_time - start_time:.2f}s")
                print(f"📊 Products Found: {len(products)}")
                print(f"🚀 High Potential Products: {research_insights.get('high_potential_count', 0)}")
                print(f"📈 Average Score: {research_insights.get('average_score', 'N/A')}")
                print(f"🎯 Market Competitiveness: {research_insights.get('market_competitiveness', 'N/A')}")
                print(f"🏆 Top Opportunity: {research_insights.get('top_opportunity', 'N/A')}")
                
                # Verify enhanced scoring data structure
                if products:
                    top_product = products[0]
                    print(f"\n🔬 Enhanced Scoring Analysis:")
                    print(f"   • Intelligent Score: {top_product.get('intelligent_score', 'N/A')}/100")
                    print(f"   • Difficulty: {top_product.get('difficulty', 'N/A')}")
                    print(f"   • Affiliate Potential: {top_product.get('affiliate_potential', 'N/A')}")
                    print(f"   • Rye Enhanced: {top_product.get('rye_enhanced', False)}")
                    
                    # Market insights
                    market_insights = top_product.get('market_insights', {})
                    print(f"   • Price vs Market: {market_insights.get('price_vs_market', 'N/A')}")
                    print(f"   • Review Strength: {market_insights.get('review_strength', 'N/A')}")
                    print(f"   • Availability: {market_insights.get('availability_status', 'N/A')}")
                    
                    # Score breakdown
                    score_breakdown = top_product.get('score_breakdown', {})
                    if score_breakdown:
                        print(f"\n📋 Score Breakdown:")
                        for metric, score in score_breakdown.items():
                            print(f"   • {metric.replace('_', ' ').title()}: {score}/100")
                
                # Verify metadata
                print(f"\n🔧 Integration Status:")
                print(f"   • Rye Integration: {research_metadata.get('rye_integration', 'N/A')}")
                print(f"   • Enhanced Scoring: {research_metadata.get('enhanced_scoring', False)}")
                print(f"   • Scoring Algorithm: {research_metadata.get('scoring_algorithm', 'N/A')}")
                print(f"   • Data Source: {research_metadata.get('data_source', 'N/A')}")
                
            else:
                print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"💥 ERROR: {str(e)}")
        
        print()

if __name__ == "__main__":
    print("🚀 Starting Enhanced Intelligent Scoring Test Suite")
    print("Testing real-time Rye.com data integration and scoring algorithms")
    print()
    
    asyncio.run(test_enhanced_api_scoring())
    
    print("\n✅ Enhanced Scoring Test Suite Completed")
    print("💡 The scoring system now provides comprehensive affiliate marketing insights")
    print("   using real-time product data from Rye.com's marketplace APIs")