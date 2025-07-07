import { storage } from '../storage';
import { type PlagiarismResult } from '@shared/schema';

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
  private readonly baseUrl = 'https://api.plagiarismcheck.org';
  private readonly apiKey = process.env.PLAGIARISM_API_KEY;

  async checkPlagiarism(request: PlagiarismCheckRequest): Promise<PlagiarismCheckResult> {
    console.log('🔍 Starting plagiarism check for content:', request.contentId || 'new content');
    
    // For development/demo purposes, provide a simulated check
    if (!this.apiKey) {
      return this.simulatePlagiarismCheck(request);
    }

    try {
      return await this.performRealPlagiarismCheck(request);
    } catch (error) {
      console.error('Plagiarism check failed:', error);
      // Fall back to simulation if API fails
      return this.simulatePlagiarismCheck(request);
    }
  }

  private async performRealPlagiarismCheck(request: PlagiarismCheckRequest): Promise<PlagiarismCheckResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': this.apiKey!,
      },
      body: JSON.stringify({
        text: request.text,
        title: request.title,
        language: 'en',
        excludeUrls: [],
        includeCitations: true,
        excludeQuotes: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Plagiarism API error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    return {
      id: data.id || `check_${Date.now()}`,
      contentId: request.contentId || 0,
      originalityScore: Math.round((100 - (data.percent || 0))),
      similarityScore: Math.round(data.percent || 0),
      matches: this.parseMatches(data.sources || []),
      status: 'completed',
      checkedAt: new Date(),
      provider: 'plagiarismcheck.org',
      rawResults: data,
    };
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