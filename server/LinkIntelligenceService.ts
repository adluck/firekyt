import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IntelligentLink } from '@shared/schema';

interface LinkSuggestionInput {
  contentId: number;
  userLinks: IntelligentLink[];
  keywords: string[];
  context: string;
  userId: number;
}

interface LinkSuggestion {
  linkId: number;
  anchorText: string;
  position: number;
  confidence: number;
  reasoning: string;
  contextMatch: any;
}

export class LinkIntelligenceService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is required for AI link suggestions');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }

  async generateLinkSuggestions(input: LinkSuggestionInput): Promise<LinkSuggestion[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Prepare context for AI analysis
      const linkData = input.userLinks.map(link => ({
        id: link.id,
        title: link.title,
        description: link.description,
        keywords: link.keywords,
        targetKeywords: link.targetKeywords,
        priority: link.priority,
        affiliateData: link.affiliateData
      }));

      const prompt = this.buildSuggestionPrompt(input.context, input.keywords, linkData);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response and generate suggestions
      return this.parseAISuggestions(text, input.userLinks);
    } catch (error) {
      console.error('AI link suggestion error:', error);
      
      // Fallback to rule-based suggestions
      return this.generateRuleBasedSuggestions(input);
    }
  }

  private buildSuggestionPrompt(content: string, keywords: string[], availableLinks: any[]): string {
    return `
As an AI affiliate marketing specialist, analyze this content and suggest the most relevant affiliate links to insert.

CONTENT TO ANALYZE:
${content.substring(0, 2000)}...

TARGET KEYWORDS: ${keywords.join(', ')}

AVAILABLE AFFILIATE LINKS:
${availableLinks.map(link => 
  `- ID: ${link.id}
  - Title: ${link.title}
  - Description: ${link.description}
  - Keywords: ${link.keywords?.join(', ') || 'None'}
  - Priority: ${link.priority}`
).join('\n')}

INSTRUCTIONS:
1. Analyze the content for natural insertion points
2. Match affiliate links to relevant content sections
3. Suggest specific anchor text that feels natural
4. Consider user intent and content flow
5. Prioritize links with higher priority scores
6. Ensure suggestions enhance rather than disrupt reading experience

RESPONSE FORMAT (JSON):
{
  "suggestions": [
    {
      "linkId": number,
      "anchorText": "natural anchor text",
      "position": character_position_estimate,
      "confidence": 0.0-1.0,
      "reasoning": "why this link fits here",
      "contextMatch": ["matching", "keywords"]
    }
  ]
}

Provide 3-5 high-quality suggestions maximum.
    `;
  }

  private parseAISuggestions(aiResponse: string, userLinks: IntelligentLink[]): LinkSuggestion[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const suggestions = parsed.suggestions || [];

      return suggestions
        .filter((s: any) => s.linkId && s.confidence > 0.3)
        .map((s: any) => ({
          linkId: s.linkId,
          anchorText: s.anchorText || 'Click here',
          position: s.position || 0,
          confidence: Math.min(Math.max(s.confidence, 0), 1),
          reasoning: s.reasoning || 'AI suggested this link',
          contextMatch: s.contextMatch || []
        }))
        .slice(0, 5); // Limit to top 5 suggestions
    } catch (error) {
      console.error('Failed to parse AI suggestions:', error);
      return [];
    }
  }

  private generateRuleBasedSuggestions(input: LinkSuggestionInput): LinkSuggestion[] {
    const suggestions: LinkSuggestion[] = [];
    const contentWords = input.context.toLowerCase().split(/\s+/);
    
    for (const link of input.userLinks) {
      let relevanceScore = 0;
      let matchedKeywords: string[] = [];
      
      // Check keyword matches
      const linkKeywords = [...(link.keywords || []), ...(link.targetKeywords || [])];
      
      for (const keyword of linkKeywords) {
        if (input.context.toLowerCase().includes(keyword.toLowerCase())) {
          relevanceScore += 0.3;
          matchedKeywords.push(keyword);
        }
      }
      
      // Check input keywords
      for (const keyword of input.keywords) {
        if (linkKeywords.some(lk => lk.toLowerCase().includes(keyword.toLowerCase()))) {
          relevanceScore += 0.2;
          matchedKeywords.push(keyword);
        }
      }
      
      // Priority boost
      relevanceScore += (link.priority / 100) * 0.3;
      
      if (relevanceScore > 0.4) {
        suggestions.push({
          linkId: link.id,
          anchorText: this.generateAnchorText(link, matchedKeywords),
          position: Math.floor(Math.random() * Math.max(100, contentWords.length)),
          confidence: Math.min(relevanceScore, 0.95),
          reasoning: `Keyword match with: ${matchedKeywords.join(', ')}`,
          contextMatch: matchedKeywords
        });
      }
    }
    
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private generateAnchorText(link: IntelligentLink, matchedKeywords: string[]): string {
    const anchorOptions = [
      link.title,
      `Learn more about ${matchedKeywords[0] || 'this product'}`,
      `Check out ${link.title}`,
      `${matchedKeywords[0] || 'This'} recommendation`,
      `Best ${matchedKeywords[0] || 'option'} here`
    ];
    
    return anchorOptions[Math.floor(Math.random() * anchorOptions.length)];
  }

  async analyzeContentContext(content: string): Promise<{
    topics: string[];
    intent: string;
    readabilityScore: number;
    suggestedInsertionPoints: number[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
Analyze this content for affiliate link optimization:

CONTENT:
${content.substring(0, 1500)}

Provide analysis in JSON format:
{
  "topics": ["main", "topic", "keywords"],
  "intent": "informational|commercial|navigational",
  "readabilityScore": 0.0-1.0,
  "suggestedInsertionPoints": [character_positions]
}
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    }
    
    // Fallback analysis
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    
    return {
      topics: this.extractTopics(content),
      intent: this.detectIntent(content),
      readabilityScore: Math.min(words.length / sentences.length / 20, 1),
      suggestedInsertionPoints: this.findInsertionPoints(content)
    };
  }

  private extractTopics(content: string): string[] {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private detectIntent(content: string): string {
    const commercialKeywords = ['buy', 'purchase', 'price', 'cost', 'deal', 'discount', 'sale'];
    const informationalKeywords = ['what', 'how', 'why', 'guide', 'tutorial', 'learn'];
    
    const lowerContent = content.toLowerCase();
    const commercialScore = commercialKeywords.reduce((score, keyword) => 
      score + (lowerContent.includes(keyword) ? 1 : 0), 0
    );
    const informationalScore = informationalKeywords.reduce((score, keyword) => 
      score + (lowerContent.includes(keyword) ? 1 : 0), 0
    );
    
    if (commercialScore > informationalScore) return 'commercial';
    if (informationalScore > 0) return 'informational';
    return 'navigational';
  }

  private findInsertionPoints(content: string): number[] {
    const points: number[] = [];
    const sentences = content.split(/[.!?]+/);
    let position = 0;
    
    sentences.forEach((sentence, index) => {
      position += sentence.length + 1;
      
      // Suggest insertion after every 2-3 sentences
      if (index > 0 && index % 3 === 0) {
        points.push(position);
      }
    });
    
    return points.slice(0, 5); // Limit to 5 insertion points
  }
}

// Helper function for route handlers
export async function generateAILinkSuggestions(input: LinkSuggestionInput): Promise<LinkSuggestion[]> {
  const service = new LinkIntelligenceService();
  return await service.generateLinkSuggestions(input);
}

export async function analyzeContentForLinks(content: string) {
  const service = new LinkIntelligenceService();
  return await service.analyzeContentContext(content);
}