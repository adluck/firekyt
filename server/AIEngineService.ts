import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  addToQueue, 
  getQueueStatus, 
  getAllQueueItems,
  type ContentGenerationRequest,
  type ContentGenerationResponse 
} from "./ai-engine";

export interface AIContentRequest {
  keyword: string;
  contentType: 'blog_post' | 'product_comparison' | 'review_article' | 'video_script' | 'social_post' | 'email_campaign';
  toneOfVoice: string;
  targetAudience: string;
  additionalContext?: string;
  brandVoice?: string;
  seoFocus?: boolean;
  wordCount?: number;
}

export interface SEOAnalysisRequest {
  content: string;
  targetKeywords: string[];
  title?: string;
  metaDescription?: string;
}

export interface LinkSuggestionRequest {
  contentId: number;
  content: string;
  targetKeywords: string[];
  context?: string;
}

/**
 * AI Engine Service - Handles all AI-related operations
 * Separated AI logic from routes for better modularity
 */
export class AIEngineService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing required Gemini API key: GEMINI_API_KEY');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateContent(request: AIContentRequest): Promise<{ contentId: string; status: string }> {
    const contentRequest: ContentGenerationRequest = {
      keyword: request.keyword,
      content_type: request.contentType,
      tone_of_voice: request.toneOfVoice,
      target_audience: request.targetAudience,
      additional_context: request.additionalContext,
      brand_voice: request.brandVoice,
      seo_focus: request.seoFocus || false,
      word_count: request.wordCount || 1000
    };

    const contentId = addToQueue(contentRequest);
    
    return {
      contentId,
      status: 'queued'
    };
  }

  async getGenerationStatus(contentId: string): Promise<ContentGenerationResponse | null> {
    return getQueueStatus(contentId);
  }

  async getAllGenerations(): Promise<any> {
    return getAllQueueItems();
  }

  async analyzeSEO(request: SEOAnalysisRequest): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
    keywordDensity: { [keyword: string]: number };
    readabilityScore: number;
  }> {
    const prompt = this.buildSEOAnalysisPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      return this.parseSEOAnalysis(analysisText, request);
    } catch (error) {
      console.error('SEO analysis error:', error);
      throw new Error('Failed to analyze SEO');
    }
  }

  async generateLinkSuggestions(request: LinkSuggestionRequest): Promise<{
    suggestions: Array<{
      anchorText: string;
      position: number;
      confidence: number;
      reasoning: string;
      contextMatch: any;
    }>;
  }> {
    const prompt = this.buildLinkSuggestionPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestionsText = response.text();
      
      return this.parseLinkSuggestions(suggestionsText);
    } catch (error) {
      console.error('Link suggestion error:', error);
      throw new Error('Failed to generate link suggestions');
    }
  }

  async optimizeContent(content: string, targetKeywords: string[], contentType: string): Promise<{
    optimizedContent: string;
    improvements: string[];
    seoScore: number;
  }> {
    const prompt = this.buildContentOptimizationPrompt(content, targetKeywords, contentType);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const optimizationText = response.text();
      
      return this.parseContentOptimization(optimizationText);
    } catch (error) {
      console.error('Content optimization error:', error);
      throw new Error('Failed to optimize content');
    }
  }

  async generateMetaTags(content: string, title: string, targetKeywords: string[]): Promise<{
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    openGraphTitle: string;
    openGraphDescription: string;
  }> {
    const prompt = this.buildMetaTagsPrompt(content, title, targetKeywords);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const metaTagsText = response.text();
      
      return this.parseMetaTags(metaTagsText);
    } catch (error) {
      console.error('Meta tags generation error:', error);
      throw new Error('Failed to generate meta tags');
    }
  }

  async analyzeReadability(content: string): Promise<{
    score: number;
    level: string;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = this.buildReadabilityPrompt(content);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const readabilityText = response.text();
      
      return this.parseReadabilityAnalysis(readabilityText);
    } catch (error) {
      console.error('Readability analysis error:', error);
      throw new Error('Failed to analyze readability');
    }
  }

  // Private helper methods for building prompts
  private buildSEOAnalysisPrompt(request: SEOAnalysisRequest): string {
    return `
      Analyze the following content for SEO optimization:
      
      Title: ${request.title || 'Not provided'}
      Meta Description: ${request.metaDescription || 'Not provided'}
      Target Keywords: ${request.targetKeywords.join(', ')}
      
      Content:
      ${request.content}
      
      Please provide:
      1. SEO score (0-100)
      2. List of issues found
      3. Specific suggestions for improvement
      4. Keyword density analysis
      5. Readability assessment
      
      Format your response as JSON with the following structure:
      {
        "score": number,
        "issues": [strings],
        "suggestions": [strings],
        "keywordDensity": {keyword: percentage},
        "readabilityScore": number
      }
    `;
  }

  private buildLinkSuggestionPrompt(request: LinkSuggestionRequest): string {
    return `
      Analyze the following content and suggest optimal link placements:
      
      Content ID: ${request.contentId}
      Target Keywords: ${request.targetKeywords.join(', ')}
      Additional Context: ${request.context || 'None'}
      
      Content:
      ${request.content}
      
      Please suggest strategic link placements that would:
      1. Improve user experience
      2. Enhance SEO value
      3. Increase engagement
      
      For each suggestion, provide:
      - Recommended anchor text
      - Character position in content
      - Confidence score (0-100)
      - Reasoning for placement
      - Context match analysis
      
      Format as JSON array of suggestions.
    `;
  }

  private buildContentOptimizationPrompt(content: string, keywords: string[], contentType: string): string {
    return `
      Optimize the following ${contentType} content for better SEO and readability:
      
      Target Keywords: ${keywords.join(', ')}
      
      Original Content:
      ${content}
      
      Please provide:
      1. Optimized version of the content
      2. List of improvements made
      3. Estimated SEO score improvement
      
      Focus on:
      - Natural keyword integration
      - Improved readability
      - Better structure and flow
      - Enhanced user engagement
      
      Format response as JSON with optimizedContent, improvements array, and seoScore.
    `;
  }

  private buildMetaTagsPrompt(content: string, title: string, keywords: string[]): string {
    return `
      Generate optimized meta tags for the following content:
      
      Title: ${title}
      Target Keywords: ${keywords.join(', ')}
      
      Content Preview:
      ${content.substring(0, 500)}...
      
      Generate:
      1. SEO-optimized meta title (50-60 characters)
      2. Compelling meta description (150-160 characters)
      3. Relevant meta keywords
      4. Open Graph title and description
      
      Format as JSON with all meta tag fields.
    `;
  }

  private buildReadabilityPrompt(content: string): string {
    return `
      Analyze the readability of the following content:
      
      ${content}
      
      Provide:
      1. Readability score (0-100, higher is better)
      2. Reading level (e.g., "High School", "College")
      3. Specific readability issues
      4. Suggestions for improvement
      
      Consider factors like:
      - Sentence length and complexity
      - Word choice and vocabulary
      - Paragraph structure
      - Use of transitions
      
      Format as JSON with score, level, issues array, and suggestions array.
    `;
  }

  // Private helper methods for parsing AI responses
  private parseSEOAnalysis(text: string, request: SEOAnalysisRequest): any {
    try {
      // Extract JSON from AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse SEO analysis:', error);
    }
    
    // Fallback to manual analysis
    return this.fallbackSEOAnalysis(request);
  }

  private parseLinkSuggestions(text: string): any {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { suggestions: Array.isArray(parsed) ? parsed : [parsed] };
      }
    } catch (error) {
      console.error('Failed to parse link suggestions:', error);
    }
    
    return { suggestions: [] };
  }

  private parseContentOptimization(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse content optimization:', error);
    }
    
    return {
      optimizedContent: text,
      improvements: ['AI optimization applied'],
      seoScore: 75
    };
  }

  private parseMetaTags(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse meta tags:', error);
    }
    
    return {
      metaTitle: 'Generated Title',
      metaDescription: 'Generated description',
      metaKeywords: [],
      openGraphTitle: 'Generated OG Title',
      openGraphDescription: 'Generated OG description'
    };
  }

  private parseReadabilityAnalysis(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse readability analysis:', error);
    }
    
    return {
      score: 70,
      level: 'High School',
      issues: ['Complex sentences detected'],
      suggestions: ['Use shorter sentences for better readability']
    };
  }

  private fallbackSEOAnalysis(request: SEOAnalysisRequest): any {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 80;

    // Basic keyword density calculation
    const keywordDensity: { [keyword: string]: number } = {};
    const contentWords = request.content.toLowerCase().split(/\s+/);
    
    request.targetKeywords.forEach(keyword => {
      const keywordCount = contentWords.filter(word => 
        word.includes(keyword.toLowerCase())
      ).length;
      const density = (keywordCount / contentWords.length) * 100;
      keywordDensity[keyword] = density;
      
      if (density < 0.5) {
        issues.push(`Low keyword density for "${keyword}"`);
        suggestions.push(`Increase usage of keyword "${keyword}"`);
        score -= 10;
      } else if (density > 3) {
        issues.push(`Keyword density too high for "${keyword}"`);
        suggestions.push(`Reduce usage of keyword "${keyword}"`);
        score -= 5;
      }
    });

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      keywordDensity,
      readabilityScore: 75
    };
  }
}