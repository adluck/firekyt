import { storage } from '../storage';
import { type PlagiarismResult } from '@shared/schema';
import { GoogleGenAI } from '@google/genai';

export interface PlagiarismCheckResult {
  id: string;
  contentId: number;
  originalityScore: number; // 0-100, higher = more original
  similarityScore: number; // 0-100, higher = more similar to existing content
  matches: PlagiarismMatch[];
  status: 'pending' | 'completed' | 'failed';
  checkedAt: Date;
  provider: string;
  rawResults?: any;
}

export interface PlagiarismMatch {
  url?: string;
  title?: string;
  matchedText: string;
  similarity: number;
  startIndex: number;
  endIndex: number;
}

export interface PlagiarismCheckRequest {
  text: string;
  title?: string;
  contentId?: number;
  userId: number;
}

class PlagiarismService {
  private readonly geminiAI: GoogleGenAI;
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;

  constructor() {
    this.geminiAI = new GoogleGenAI({ apiKey: this.geminiApiKey || '' });
  }

  async checkPlagiarism(request: PlagiarismCheckRequest): Promise<PlagiarismCheckResult> {
    console.log('🔍 Starting Gemini AI plagiarism check for content:', request.contentId || 'new content');
    
    // Use Gemini AI for plagiarism detection
    if (this.geminiApiKey) {
      return await this.performGeminiPlagiarismCheck(request);
    }

    // Fall back to simulation if no API key
    console.log('⚠️ No Gemini API key found, using simulation');
    return this.simulatePlagiarismCheck(request);
  }

  private async performGeminiPlagiarismCheck(request: PlagiarismCheckRequest): Promise<PlagiarismCheckResult> {
    try {
      console.log('🤖 Using Gemini AI for plagiarism analysis...');
      
      const prompt = `You are an expert plagiarism detector. Analyze the following content for originality and potential plagiarism issues.

Content to analyze:
Title: ${request.title || 'Untitled'}
Text: ${request.text}

Please provide a comprehensive analysis including:
1. Originality score (0-100, where 100 is completely original)
2. Similarity concerns (identify any phrases that seem commonly used or potentially plagiarized)
3. Writing quality assessment
4. Recommendations for improvement

Respond with a JSON object in this exact format:
{
  "originalityScore": number,
  "similarityScore": number,
  "analysis": "detailed analysis text",
  "concerns": ["list of specific concerns"],
  "recommendations": ["list of recommendations"],
  "potentialMatches": [
    {
      "text": "potentially problematic text",
      "reason": "why this might be plagiarized",
      "similarity": number
    }
  ]
}`;

      const response = await this.geminiAI.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              originalityScore: { type: "number" },
              similarityScore: { type: "number" },
              analysis: { type: "string" },
              concerns: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              potentialMatches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    reason: { type: "string" },
                    similarity: { type: "number" }
                  }
                }
              }
            },
            required: ["originalityScore", "similarityScore", "analysis"]
          }
        },
        contents: prompt,
      });

      const analysisData = JSON.parse(response.text || '{}');
      
      // Convert Gemini analysis to our format
      const matches: PlagiarismMatch[] = (analysisData.potentialMatches || []).map((match: any, index: number) => ({
        url: undefined,
        title: 'AI Analysis',
        matchedText: match.text || '',
        similarity: match.similarity || 0,
        startIndex: index * 10,
        endIndex: (index * 10) + (match.text?.length || 0),
      }));

      return {
        id: `gemini_${Date.now()}`,
        contentId: request.contentId || 0,
        originalityScore: Math.min(100, Math.max(0, analysisData.originalityScore || 85)),
        similarityScore: Math.min(100, Math.max(0, analysisData.similarityScore || 15)),
        matches,
        status: 'completed',
        checkedAt: new Date(),
        provider: 'Gemini AI',
        rawResults: analysisData,
      };
    } catch (error) {
      console.error('Gemini plagiarism check failed:', error);
      throw error;
    }
  }

  private parseMatches(sources: any[]): PlagiarismMatch[] {
    return sources.map((source: any) => ({
      url: source.url,
      title: source.title,
      matchedText: source.matchedWords?.join(' ') || '',
      similarity: Math.round(source.percent || 0),
      startIndex: source.startWords?.[0] || 0,
      endIndex: source.endWords?.[0] || 0,
    }));
  }

  private async simulatePlagiarismCheck(request: PlagiarismCheckRequest): Promise<PlagiarismCheckResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const wordCount = request.text.split(' ').length;
    const hasCommonPhrases = request.text.toLowerCase().includes('affiliate marketing') || 
                           request.text.toLowerCase().includes('best products') ||
                           request.text.toLowerCase().includes('click here');

    // Simulate originality based on content characteristics
    const baseScore = Math.max(75, Math.min(95, 80 + Math.random() * 15));
    const originalityScore = hasCommonPhrases ? baseScore - 10 : baseScore;
    const similarityScore = 100 - originalityScore;

    const simulatedMatches: PlagiarismMatch[] = [];
    
    if (hasCommonPhrases) {
      simulatedMatches.push({
        url: 'https://example-affiliate-blog.com/guide',
        title: 'The Ultimate Affiliate Marketing Guide',
        matchedText: 'affiliate marketing strategies and best practices',
        similarity: 15,
        startIndex: request.text.toLowerCase().indexOf('affiliate marketing'),
        endIndex: request.text.toLowerCase().indexOf('affiliate marketing') + 30,
      });
    }

    if (wordCount < 100) {
      simulatedMatches.push({
        url: 'https://content-library.com/snippets',
        title: 'Common Marketing Phrases',
        matchedText: 'click here to learn more',
        similarity: 8,
        startIndex: request.text.toLowerCase().indexOf('click'),
        endIndex: request.text.toLowerCase().indexOf('click') + 20,
      });
    }

    return {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: request.contentId || 0,
      originalityScore: Math.round(originalityScore),
      similarityScore: Math.round(similarityScore),
      matches: simulatedMatches,
      status: 'completed',
      checkedAt: new Date(),
      provider: 'simulation',
    };
  }

  async getStoredResult(contentId: number): Promise<PlagiarismResult | null> {
    try {
      const result = await storage.getPlagiarismResult(contentId);
      return result;
    } catch (error) {
      console.error('Error fetching stored plagiarism result:', error);
      return null;
    }
  }

  async storeResult(result: PlagiarismCheckResult): Promise<void> {
    try {
      // Convert PlagiarismCheckResult to database format
      const dbResult = {
        id: result.id,
        contentId: result.contentId,
        userId: 0, // Will be set by the calling function
        originalityScore: result.originalityScore,
        similarityScore: result.similarityScore,
        status: result.status,
        provider: result.provider,
        totalMatches: result.matches.length,
        matches: result.matches,
        rawResults: result.rawResults,
        checkedAt: result.checkedAt,
      };
      await storage.savePlagiarismResult(dbResult);
      console.log('✅ Plagiarism result stored successfully');
    } catch (error) {
      console.error('Error storing plagiarism result:', error);
    }
  }

  interpretScore(originalityScore: number): {
    level: 'excellent' | 'good' | 'moderate' | 'poor';
    color: string;
    message: string;
    recommendations: string[];
  } {
    if (originalityScore >= 90) {
      return {
        level: 'excellent',
        color: 'green',
        message: 'Excellent originality! Your content is highly unique.',
        recommendations: [
          'Your content shows excellent originality',
          'Continue creating unique, valuable content',
          'Consider this content ready for publication'
        ]
      };
    } else if (originalityScore >= 75) {
      return {
        level: 'good',
        color: 'blue',
        message: 'Good originality with minor similarities detected.',
        recommendations: [
          'Review highlighted sections for potential improvements',
          'Consider rephrasing common industry terms',
          'Add more unique insights and personal experience'
        ]
      };
    } else if (originalityScore >= 60) {
      return {
        level: 'moderate',
        color: 'orange',
        message: 'Moderate originality. Some content may need revision.',
        recommendations: [
          'Rewrite sections with high similarity scores',
          'Add more original research and insights',
          'Restructure content organization',
          'Include more personal examples and case studies'
        ]
      };
    } else {
      return {
        level: 'poor',
        color: 'red',
        message: 'Low originality detected. Significant revision recommended.',
        recommendations: [
          'Substantially rewrite content to improve originality',
          'Research from primary sources instead of existing content',
          'Add unique data, insights, and analysis',
          'Consider creating completely new content approach',
          'Ensure proper citations for any referenced material'
        ]
      };
    }
  }
}

export const plagiarismService = new PlagiarismService();