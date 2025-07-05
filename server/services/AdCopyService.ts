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

      // Generate copy for each platform and format
      for (const platform of request.platforms) {
        const platformFormats = request.formats[platform] || [];
        const platformResult: PlatformAdCopy = {
          platform: this.formatPlatformName(platform),
          headlines: [],
          descriptions: [],
          ctas: [],
          hashtags: []
        };

        for (const format of platformFormats) {
          try {
            const prompt = this.buildPrompt(request, platform, format);
            
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });

            const generatedText = response.text || '';
            const lines = generatedText.split('\n').filter(line => line.trim());

            // Store variations in database
            for (const line of lines) {
              if (line.trim()) {
                const variation: InsertAdCopyVariation = {
                  campaignId: campaign.id,
                  platform,
                  adFormat: format,
                  headline: format === 'headlines' ? line.trim() : platformResult.headlines[0] || request.productName,
                  description: format === 'descriptions' ? line.trim() : platformResult.descriptions[0] || request.primaryBenefit,
                  callToAction: format === 'ctas' ? line.trim() : platformResult.ctas[0] || 'Shop Now',
                  hashtags: format === 'hashtags' ? [line.trim()] : [],
                  characterCount: line.trim().length,
                  platformSpecs: platformLimits[platform as keyof typeof platformLimits] || {},
                };
                allVariations.push(variation);
              }
            }

            // Add to results for immediate response
            if (format === 'headlines') {
              platformResult.headlines = lines.map(line => line.trim()).slice(0, request.variationCount);
            } else if (format === 'descriptions') {
              platformResult.descriptions = lines.map(line => line.trim()).slice(0, request.variationCount);
            } else if (format === 'ctas') {
              platformResult.ctas = lines.map(line => line.trim()).slice(0, request.variationCount);
            } else if (format === 'hashtags') {
              platformResult.hashtags = lines.map(line => line.trim());
            }

          } catch (error) {
            console.error(`Error generating ${format} for ${platform}:`, error);
            // Add fallback content
            if (format === 'headlines') {
              platformResult.headlines = [`${request.productName} - ${request.primaryBenefit}`];
            } else if (format === 'descriptions') {
              platformResult.descriptions = [`Discover ${request.productName}. ${request.primaryBenefit}. Perfect for ${request.targetAudience}.`];
            } else if (format === 'ctas') {
              platformResult.ctas = ['Shop Now', 'Learn More'];
            }
          }
        }

        results.push(platformResult);
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