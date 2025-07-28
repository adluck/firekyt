import { Router } from 'express';
import { LinkIntelligenceService } from '../LinkIntelligenceService';

const router = Router();

// Smart Link Assistant endpoint - works without database
router.post('/api/intelligent-links/match', async (req, res) => {
  try {
    const { content, keywords } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content is required for link matching' 
      });
    }

    console.log('🔍 Smart Link Assistant - Processing content for intelligent matching...');
    console.log('📝 Content length:', content.length, 'characters');
    console.log('🎯 Keywords provided:', keywords?.length || 0);

    // Create mock intelligent links for testing (no database required)
    const mockIntelligentLinks = [
      {
        id: 1,
        title: "Best Gaming Headsets 2024",
        keywords: ["gaming", "headset", "headphones", "audio", "gaming gear"],
        affiliateUrl: "https://amazon.com/gaming-headset?tag=firekyt-20",
        confidence: 0.92
      },
      {
        id: 2, 
        title: "Construction Tools Review",
        keywords: ["construction", "tools", "drill", "hammer", "building"],
        affiliateUrl: "https://homedepot.com/tools?ref=firekyt",
        confidence: 0.88
      },
      {
        id: 3,
        title: "Office Productivity Setup",
        keywords: ["office", "productivity", "desk", "chair", "workspace"],
        affiliateUrl: "https://amazon.com/office-supplies?tag=firekyt-20",
        confidence: 0.85
      },
      {
        id: 4,
        title: "Power Bank Comparison",
        keywords: ["power bank", "portable charger", "battery", "charging"],
        affiliateUrl: "https://amazon.com/power-banks?tag=firekyt-20",
        confidence: 0.90
      },
      {
        id: 5,
        title: "Coffee Maker Guide",
        keywords: ["coffee", "coffee maker", "espresso", "brewing", "kitchen"],
        affiliateUrl: "https://amazon.com/coffee-makers?tag=firekyt-20",
        confidence: 0.87
      }
    ];

    // Use LinkIntelligenceService for AI matching
    const linkIntelligenceService = new LinkIntelligenceService();
    const matches = await linkIntelligenceService.findIntelligentMatches(
      content, 
      mockIntelligentLinks,
      { keywords: keywords || [] }
    );

    console.log('✅ Smart Link Assistant - Found', matches.length, 'intelligent matches');
    
    res.json({
      success: true,
      matches: matches,
      totalLinks: mockIntelligentLinks.length,
      algorithm: 'enhanced_ai_matching_v2',
      confidenceThreshold: 35,
      debug: {
        contentAnalyzed: true,
        keywordsProcessed: keywords?.length || 0,
        matchingAlgorithm: 'gemini_ai_enhanced'
      }
    });

  } catch (error: any) {
    console.error('❌ Smart Link Assistant error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process intelligent link matching: ' + error.message 
    });
  }
});

export default router;