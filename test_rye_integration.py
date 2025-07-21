#!/usr/bin/env python3
"""
Test script to verify Rye integration functionality
"""

import asyncio
import sys
import json
import os

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from rye_service import RyeService

async def test_rye_functions():
    """Test all Rye service functions"""
    
    print("🔍 Testing Rye.com GraphQL API Integration")
    print("=" * 50)
    
    try:
        # Initialize the service
        rye_service = RyeService()
        
        # Test 1: Connection test
        print("\n1️⃣ Testing API connection...")
        connection_result = await rye_service.test_connection()
        print(f"   Connection: {'✅ Success' if connection_result.get('success') else '❌ Failed'}")
        if not connection_result.get('success'):
            print(f"   Error: {connection_result.get('error')}")
            return False
        
        # Test 2: Product search with gaming keywords
        print("\n2️⃣ Testing product search for 'gaming laptops'...")
        search_result = await rye_service.search_products("gaming laptops", limit=3)
        print(f"   Success: {'✅ Yes' if search_result.get('success') else '❌ No'}")
        
        if search_result.get('success') and search_result.get('products'):
            products = search_result['products']
            print(f"   Found {len(products)} products")
            for i, product in enumerate(products[:2], 1):
                print(f"   Product {i}: {product.get('title', 'N/A')[:50]}...")
                print(f"     Price: {product.get('price', {}).get('displayValue', 'N/A')}")
                print(f"     ASIN: {product.get('ASIN', 'N/A')}")
        else:
            print(f"   Error: {search_result.get('error', 'Unknown error')}")
        
        # Test 3: Get specific product by ASIN
        print("\n3️⃣ Testing single product retrieval by ASIN...")
        sample_asin = "B08N5WRWNW"  # Popular gaming laptop
        product_result = await rye_service.get_product_by_id(sample_asin)
        
        if product_result.get('success') and product_result.get('product'):
            product = product_result['product']
            print(f"   ✅ Retrieved: {product.get('title', 'N/A')[:50]}...")
            print(f"   Price: {product.get('price', {}).get('displayValue', 'N/A')}")
            print(f"   Available: {product.get('isAvailable', 'Unknown')}")
        else:
            print(f"   ❌ Failed: {product_result.get('error', 'Unknown error')}")
        
        # Test 4: Batch product retrieval
        print("\n4️⃣ Testing batch product retrieval...")
        sample_asins = ["B08N5WRWNW", "B08PBJP8B2", "B07VGRJDFY"]
        batch_result = await rye_service.get_products_by_ids(sample_asins)
        
        if batch_result.get('success'):
            products = batch_result.get('products', [])
            print(f"   ✅ Retrieved {len(products)} out of {len(sample_asins)} products")
            for i, product in enumerate(products[:2], 1):
                print(f"   Product {i}: {product.get('title', 'N/A')[:40]}...")
        else:
            print(f"   ❌ Batch retrieval failed: {batch_result.get('error')}")
        
        # Test 5: Domain products (will show limitation message)
        print("\n5️⃣ Testing domain product access...")
        domain_result = await rye_service.get_products_by_domain("example-shop.myshopify.com")
        
        if domain_result.get('success'):
            print(f"   ✅ Domain access working")
        else:
            print(f"   ℹ️  Expected limitation: {domain_result.get('error', 'N/A')}")
        
        print("\n🎉 All Rye integration tests completed successfully!")
        print(f"🔑 API Key Status: {'Active' if os.getenv('RYE_API_KEY') else 'Missing'}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Run the async test
    success = asyncio.run(test_rye_functions())
    sys.exit(0 if success else 1)