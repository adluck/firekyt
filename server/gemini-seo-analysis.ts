import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" });

export interface GeminiSeoAnalysis {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  competitionLevel: 'low' | 'medium' | 'high';
  cpcEstimate: number;
  commercialIntent: 'low' | 'medium' | 'high';
  seasonality: string;
  relatedKeywords: string[];
  suggestedTitles: string[];
  suggestedDescriptions: string[];
  suggestedHeaders: string[];
  contentStrategy: string;
  targetAudience: string;
  competitorInsights: string[];
  seoOpportunities: string[];
  contentIdeas: string[];
}

export async function analyzeKeywordWithGemini(keyword: string, targetRegion: string = 'US'): Promise<GeminiSeoAnalysis> {
  try {
    const prompt = `Perform a comprehensive SEO keyword analysis for "${keyword}" targeting ${targetRegion} market.

Please provide a detailed analysis in JSON format with the following structure:

{
  "keyword": "${keyword}",
  "searchVolume": (estimated monthly searches as integer, realistic range 100-100000),
  "keywordDifficulty": (1-100 scale, where 1 is easy and 100 is very hard),
  "competitionLevel": "low|medium|high",
  "cpcEstimate": (estimated cost per click in USD, realistic range 0.10-50.00),
  "commercialIntent": "low|medium|high",
  "seasonality": "description of seasonal trends",
  "relatedKeywords": ["array of 8-12 closely related keywords"],
  "suggestedTitles": ["array of 5 SEO-optimized title suggestions"],
  "suggestedDescriptions": ["array of 3 meta description suggestions (150-160 chars each)"],
  "suggestedHeaders": ["array of 6 H2/H3 header suggestions for content"],
  "contentStrategy": "detailed content strategy recommendation",
  "targetAudience": "description of primary target audience",
  "competitorInsights": ["array of 4-5 competitor analysis points"],
  "seoOpportunities": ["array of 5-6 specific SEO opportunities"],
  "contentIdeas": ["array of 8-10 content ideas for this keyword"]
}

Consider:
- Search intent analysis (informational, navigational, transactional, commercial)
- Keyword difficulty based on domain authority requirements
- Competition analysis for organic and paid search
- Content gap opportunities
- Long-tail keyword variations
- User search behavior patterns
- Mobile vs desktop search trends
- Local search considerations if relevant

Provide realistic estimates based on current SEO best practices and market conditions.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keyword: { type: "string" },
            searchVolume: { type: "number" },
            keywordDifficulty: { type: "number" },
            competitionLevel: { type: "string", enum: ["low", "medium", "high"] },
            cpcEstimate: { type: "number" },
            commercialIntent: { type: "string", enum: ["low", "medium", "high"] },
            seasonality: { type: "string" },
            relatedKeywords: { type: "array", items: { type: "string" } },
            suggestedTitles: { type: "array", items: { type: "string" } },
            suggestedDescriptions: { type: "array", items: { type: "string" } },
            suggestedHeaders: { type: "array", items: { type: "string" } },
            contentStrategy: { type: "string" },
            targetAudience: { type: "string" },
            competitorInsights: { type: "array", items: { type: "string" } },
            seoOpportunities: { type: "array", items: { type: "string" } },
            contentIdeas: { type: "array", items: { type: "string" } }
          },
          required: ["keyword", "searchVolume", "keywordDifficulty", "competitionLevel", "cpcEstimate", "commercialIntent"]
        }
      },
      contents: prompt,
    });

    const analysisText = response.text;
    if (!analysisText) {
      throw new Error("No response from Gemini AI");
    }

    const analysis: GeminiSeoAnalysis = JSON.parse(analysisText);
    
    // Validate and sanitize the response
    analysis.searchVolume = Math.max(10, Math.min(1000000, analysis.searchVolume));
    analysis.keywordDifficulty = Math.max(1, Math.min(100, analysis.keywordDifficulty));
    analysis.cpcEstimate = Math.max(0.01, Math.min(100, analysis.cpcEstimate));
    
    return analysis;

  } catch (error) {
    console.error('Gemini SEO analysis error:', error);
    throw new Error(`Failed to analyze keyword with Gemini AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateKeywordVariations(baseKeyword: string, count: number = 20): Promise<string[]> {
  try {
    const prompt = `Generate ${count} keyword variations for "${baseKeyword}" that are:
- Closely related and semantically relevant
- Include long-tail variations
- Mix of informational, commercial, and transactional intent
- Include question-based keywords
- Consider common modifiers (best, top, cheap, review, vs, how to, etc.)

Return only a JSON array of strings, no additional text:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        }
      },
      contents: prompt,
    });

    const variationsText = response.text;
    if (!variationsText) {
      throw new Error("No response from Gemini AI");
    }

    return JSON.parse(variationsText);
  } catch (error) {
    console.error('Gemini keyword variations error:', error);
    return [];
  }
}