import { GoogleGenAI } from "@google/genai";
import { db } from "../db.js";
import { adCopyCampaigns, adCopyVariations } from "../../shared/schema.js";
import type { InsertAdCopyCampaign, InsertAdCopyVariation } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AdCopyRequest {
  productName: string;
  productDescription?: string;
  targetAudience: string;
  primaryBenefit: string;
  toneOfVoice: string;
  platforms: string[];
  formats: { [platform: string]: string[] };
  variationCount: number;
  optimizeForConversion: boolean;
  affiliateUrl: string;
}

interface PlatformAdCopy {
  platform: string;
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  hashtags?: string[];
}

const platformLimits = {
  google_search: {
    headline: 30,
    description: 90,
    cta: 25
  },
  facebook_ads: {
    headline: 40,
    description: 125,
    cta: 20
  },
  instagram_stories: {
    headline: 40,
    description: 125,
    hashtag: 30
  },
  tiktok_video: {
    headline: 100,
    description: 300,
    hashtag: 20
  },
  youtube_shorts: {
    headline: 100,
    description: 150,
    hashtag: 30
  },
  pinterest_pins: {
    headline: 100,
    description: 500,
    hashtag: 20
  }
};

export class AdCopyService {
  private static formatPlatformName(platform: string): string {
    const platformNames = {
      google_search: 'Google Search',
      facebook_ads: 'Facebook',
      instagram_stories: 'Instagram',
      tiktok_video: 'TikTok',
      youtube_shorts: 'YouTube Shorts',
      pinterest_pins: 'Pinterest'
    };
    return platformNames[platform as keyof typeof platformNames] || platform;
  }

  private static buildPrompt(request: AdCopyRequest, platform: string, format: string): string {
    const platformName = this.formatPlatformName(platform);
    const limits = platformLimits[platform as keyof typeof platformLimits];
    
    if (format === 'complete_campaign') {
      return `Act as a professional ad copywriter specializing in high-converting ${platformName} advertisements.

Input:
- Product: "${request.productName}"
- Description: "${request.productDescription || 'High-quality product'}"
- Target audience: "${request.targetAudience}"
- Primary benefit: "${request.primaryBenefit}"
- Tone: ${request.toneOfVoice}

Create a complete ad campaign for ${platformName} with:

${platform === 'tiktok_video' ? `
**TikTok Captions (3 variations):**
- Maximum 150 characters each
- Hook viewers in first 3 seconds
- Include trending language for ${request.targetAudience}
- Focus on "${request.primaryBenefit}"
- Use ${request.toneOfVoice} tone

**Call-to-Actions (2 variations):**
- Maximum 20 characters each
- Action-oriented and urgent
- Examples: "Try Now!", "Get Yours!"

**Hashtags (8-12 total):**
- Mix of viral and niche hashtags
- Include ${request.targetAudience}-focused tags
- Relevant to ${request.productName}
` : ''}

${platform === 'pinterest_boards' ? `
**Pinterest Headlines (3 variations):**
- Maximum 100 characters each
- SEO-optimized for Pinterest search
- Focus on "${request.primaryBenefit}"
- Appeal to ${request.targetAudience}
- Use ${request.toneOfVoice} tone

**Pin Descriptions (2 variations):**
- Maximum 500 characters each
- Include relevant keywords
- Address pain points of ${request.targetAudience}

**Hashtags (10-15 total):**
- Mix of broad and specific hashtags
- Pinterest-optimized tags
- Include seasonal/trending options
` : ''}

${platform === 'facebook_ads' ? `
**Facebook Headlines (3 variations):**
- Maximum 40 characters each
- Attention-grabbing and benefit-focused
- Appeal to ${request.targetAudience}

**Ad Copy (3 variations):**
- Maximum 125 characters each
- Focus on "${request.primaryBenefit}"
- Include social proof elements

**Call-to-Actions (2 variations):**
- Maximum 20 characters each
- Clear action-oriented language
` : ''}

${platform === 'instagram_stories' ? `
**Instagram Captions (3 variations):**
- Maximum 125 characters each
- Visual storytelling approach
- Focus on "${request.primaryBenefit}"
- Appeal to ${request.targetAudience}

**Story CTAs (2 variations):**
- Maximum 15 characters each
- Swipe-up focused language

**Hashtags (10-15 total):**
- Instagram-trending hashtags
- Mix of popular and niche tags
` : ''}

Output in this exact JSON format:
{
  "headlines": ["headline1", "headline2", "headline3"],
  "descriptions": ["desc1", "desc2"],
  "ctas": ["cta1", "cta2"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "..."]
}`;
    }
    
    // Fallback to original format for backward compatibility
    let prompt = `Act as a professional ad copywriter specializing in high-converting ${platformName} advertisements.

Input:
- Product: "${request.productName}"
- Description: "${request.productDescription || 'High-quality product'}"
- Target audience: "${request.targetAudience}"
- Primary benefit: "${request.primaryBenefit}"
- Tone: ${request.toneOfVoice}
- Affiliate URL: ${request.affiliateUrl}

Generate ${request.variationCount} ${format} for ${platformName} ads.`;

    if (format === 'headlines') {
      prompt += `\n\nRequirements:
- Maximum ${limits?.headline || 40} characters per headline
- Focus on the primary benefit: "${request.primaryBenefit}"
- Use ${request.toneOfVoice} tone
- Include power words that drive action
- Make it compelling for ${request.targetAudience}`;
      
      if (request.optimizeForConversion) {
        prompt += `\n- Optimize for high click-through rates and conversions
- Use urgency or scarcity when appropriate
- Include benefit-focused language`;
      }
    } else if (format === 'descriptions') {
      prompt += `\n\nRequirements:
- Maximum ${limits?.description || 125} characters per description
- Expand on the primary benefit
- Include social proof or credibility elements
- Address target audience pain points
- Use ${request.toneOfVoice} tone`;
      
      if (request.optimizeForConversion) {
        prompt += `\n- Focus on benefits over features
- Include risk reduction elements
- Create desire and urgency`;
      }
    } else if (format === 'ctas') {
      const ctaLimit = (limits as any)?.cta || 25;
      prompt += `\n\nRequirements:
- Maximum ${ctaLimit} characters per CTA
- Action-oriented language
- Create urgency and desire
- Match ${request.toneOfVoice} tone
- Examples: "Shop Now", "Get Yours", "Limited Time"`;
    } else if (format === 'hashtags') {
      prompt += `\n\nRequirements:
- Provide ${Math.min(request.variationCount * 3, 10)} relevant hashtags
- Mix of popular and niche hashtags
- Relevant to ${request.productName} and ${request.targetAudience}
- Include trending hashtags for ${platformName}`;
    }

    prompt += `\n\nOutput format: Provide only the ${format}, one per line, without numbering or additional text.`;
    
    return prompt;
  }

  static async generateAdCopy(userId: number, request: AdCopyRequest): Promise<any> {
    try {
      // Create campaign record
      const campaignData: InsertAdCopyCampaign = {
        userId,
        name: `${request.productName} Campaign`,
        productName: request.productName,
        productDescription: request.productDescription || '',
        productCategory: 'general', // Could be enhanced with category detection
        targetAudience: request.targetAudience,
        keyBenefits: [request.primaryBenefit],
        callToAction: 'Shop Now',
        brandVoice: request.toneOfVoice,
        campaignGoal: request.optimizeForConversion ? 'conversion' : 'awareness',
        affiliateUrl: request.affiliateUrl,
      };

      const [campaign] = await db.insert(adCopyCampaigns).values(campaignData).returning();

      const allVariations: InsertAdCopyVariation[] = [];
      const results: PlatformAdCopy[] = [];

      // Generate copy for each platform using complete campaign format
      for (const platform of request.platforms) {
        try {
          const prompt = this.buildPrompt(request, platform, 'complete_campaign');
          
          const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  headlines: {
                    type: "array",
                    items: { type: "string" }
                  },
                  descriptions: {
                    type: "array", 
                    items: { type: "string" }
                  },
                  ctas: {
                    type: "array",
                    items: { type: "string" }
                  },
                  hashtags: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["headlines", "descriptions", "ctas", "hashtags"]
              }
            },
            contents: prompt,
          });

          const generatedText = response.text || '{}';
          let platformData;
          
          try {
            platformData = JSON.parse(generatedText);
          } catch (e) {
            console.error('JSON parsing error:', e, 'Response:', generatedText);
            // Fallback to basic structure
            platformData = {
              headlines: [`${request.primaryBenefit} for ${request.targetAudience}`],
              descriptions: [`Discover ${request.productName} and ${request.primaryBenefit}`],
              ctas: ["Shop Now", "Get Yours"],
              hashtags: [`#${request.productName.replace(/\s+/g, '')}`, `#${request.targetAudience}`]
            };
          }

          const platformResult: PlatformAdCopy = {
            platform: this.formatPlatformName(platform),
            headlines: platformData.headlines || [],
            descriptions: platformData.descriptions || [],
            ctas: platformData.ctas || [],
            hashtags: platformData.hashtags || []
          };

          // Store variations in database for each type
          const headlines = platformData.headlines || [];
          const descriptions = platformData.descriptions || [];
          const ctas = platformData.ctas || [];
          
          // Create variations for each combination
          for (let i = 0; i < Math.max(headlines.length, descriptions.length, ctas.length); i++) {
            allVariations.push({
              campaignId: campaign.id,
              platform: platform,
              adFormat: 'text_ad',
              headline: headlines[i] || headlines[0] || request.productName,
              description: descriptions[i] || descriptions[0] || request.primaryBenefit,
              callToAction: ctas[i] || ctas[0] || 'Shop Now',
              hashtags: platformData.hashtags || [],
              characterCount: (headlines[i] || '').length + (descriptions[i] || '').length,
              platformSpecs: platformLimits[platform as keyof typeof platformLimits] || {},
              isActive: true
            });
          }

          results.push(platformResult);

        } catch (error) {
          console.error(`Error generating campaign for ${platform}:`, error);
          // Add fallback content
          const fallbackResult: PlatformAdCopy = {
            platform: this.formatPlatformName(platform),
            headlines: [`${request.productName} - ${request.primaryBenefit}`],
            descriptions: [`Discover ${request.productName}. ${request.primaryBenefit}. Perfect for ${request.targetAudience}.`],
            ctas: ['Shop Now', 'Learn More'],
            hashtags: [`#${request.productName.replace(/\s+/g, '')}`, `#${request.targetAudience}`]
          };
          
          results.push(fallbackResult);
          
          // Add fallback variations to database
          for (let i = 0; i < Math.max(fallbackResult.headlines.length, fallbackResult.descriptions.length, fallbackResult.ctas.length); i++) {
            allVariations.push({
              campaignId: campaign.id,
              platform: platform,
              adFormat: 'text_ad',
              headline: fallbackResult.headlines[i] || fallbackResult.headlines[0] || request.productName,
              description: fallbackResult.descriptions[i] || fallbackResult.descriptions[0] || request.primaryBenefit,
              callToAction: fallbackResult.ctas[i] || fallbackResult.ctas[0] || 'Shop Now',
              hashtags: fallbackResult.hashtags || [],
              characterCount: (fallbackResult.headlines[i] || '').length + (fallbackResult.descriptions[i] || '').length,
              platformSpecs: platformLimits[platform as keyof typeof platformLimits] || {},
              isActive: true
            });
          }
        }
      }

      // Save all variations to database
      if (allVariations.length > 0) {
        await db.insert(adCopyVariations).values(allVariations);
      }

      return {
        success: true,
        campaignId: campaign.id,
        campaignName: campaign.name,
        platforms: results,
        totalVariations: allVariations.length
      };

    } catch (error) {
      console.error('Error generating ad copy:', error);
      throw new Error('Failed to generate ad copy. Please try again.');
    }
  }

  static async getCampaigns(userId: number) {
    return await db
      .select()
      .from(adCopyCampaigns)
      .where(eq(adCopyCampaigns.userId, userId))
      .orderBy(adCopyCampaigns.createdAt);
  }

  static async getCampaignWithVariations(campaignId: number, userId: number) {
    const campaign = await db
      .select()
      .from(adCopyCampaigns)
      .where(eq(adCopyCampaigns.id, campaignId))
      .limit(1);

    if (!campaign.length || campaign[0].userId !== userId) {
      throw new Error('Campaign not found');
    }

    const variations = await db
      .select()
      .from(adCopyVariations)
      .where(eq(adCopyVariations.campaignId, campaignId))
      .orderBy(adCopyVariations.platform, adCopyVariations.adFormat);

    return {
      campaign: campaign[0],
      variations
    };
  }

  static async deleteCampaign(campaignId: number, userId: number) {
    const campaign = await db
      .select()
      .from(adCopyCampaigns)
      .where(eq(adCopyCampaigns.id, campaignId))
      .limit(1);

    if (!campaign.length || campaign[0].userId !== userId) {
      throw new Error('Campaign not found');
    }

    await db.delete(adCopyCampaigns).where(eq(adCopyCampaigns.id, campaignId));
    return { success: true };
  }
}