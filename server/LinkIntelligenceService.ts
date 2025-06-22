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
    console.log(`Generating suggestions for ${input.userLinks.length} links with keywords: ${input.keywords.join(', ')}`);
    
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
      
      console.log('Sending request to Google Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Received AI response, parsing suggestions...');
      // Parse AI response and generate suggestions
      const aiSuggestions = this.parseAISuggestions(text, input.userLinks);
      
      if (aiSuggestions.length > 0) {
        console.log(`AI generated ${aiSuggestions.length} suggestions`);
        return aiSuggestions;
      } else {
        console.log('AI returned no suggestions, falling back to rule-based');
        return this.generateRuleBasedSuggestions(input);
      }
    } catch (error) {
      console.error('AI link suggestion error:', error);
      console.log('Falling back to rule-based suggestions due to AI error');
      
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
    const contentLower = input.context.toLowerCase();
    const contentWords = contentLower.split(/\s+/);
    
    console.log(`Rule-based fallback: Analyzing ${input.userLinks.length} links against content`);
    
    for (const link of input.userLinks) {
      let relevanceScore = 0;
      let matchedKeywords: string[] = [];
      
      // Check keyword matches in content
      const linkKeywords = [...(link.keywords || []), ...(link.targetKeywords || [])];
      
      for (const keyword of linkKeywords) {
        const keywordLower = keyword.toLowerCase();
        if (contentLower.includes(keywordLower)) {
          relevanceScore += 0.4;
          matchedKeywords.push(keyword);
          console.log(`Found keyword "${keyword}" in content for link "${link.title}"`);
        }
      }
      
      // Check input keywords against link keywords
      for (const inputKeyword of input.keywords) {
        const inputLower = inputKeyword.toLowerCase().trim();
        for (const linkKeyword of linkKeywords) {
          const linkLower = linkKeyword.toLowerCase();
          if (linkLower.includes(inputLower) || inputLower.includes(linkLower)) {
            relevanceScore += 0.3;
            if (!matchedKeywords.includes(inputKeyword)) {
              matchedKeywords.push(inputKeyword);
            }
            console.log(`Keyword "${inputKeyword}" matches link keyword "${linkKeyword}"`);
          }
        }
      }
      
      // Title relevance check
      const titleWords = link.title.toLowerCase().split(/\s+/);
      for (const titleWord of titleWords) {
        if (titleWord.length > 3 && contentLower.includes(titleWord)) {
          relevanceScore += 0.2;
          if (!matchedKeywords.includes(titleWord)) {
            matchedKeywords.push(titleWord);
          }
        }
      }
      
      // Priority boost
      relevanceScore += (link.priority / 100) * 0.2;
      
      // Lower threshold for better testing
      if (relevanceScore > 0.2) {
        const position = this.findBestInsertionPosition(input.context, matchedKeywords);
        
        suggestions.push({
          linkId: link.id,
          anchorText: this.generateAnchorText(link, matchedKeywords),
          position,
          confidence: Math.min(relevanceScore, 0.95),
          reasoning: matchedKeywords.length > 0 
            ? `Strong match: ${matchedKeywords.slice(0, 3).join(', ')}`
            : `Priority-based suggestion for ${link.title}`,
          contextMatch: matchedKeywords.slice(0, 5)
        });
        
        console.log(`Added suggestion for "${link.title}" with confidence ${relevanceScore.toFixed(2)}`);
      }
    }
    
    console.log(`Generated ${suggestions.length} rule-based suggestions`);
    
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private findBestInsertionPosition(content: string, keywords: string[]): number {
    if (keywords.length === 0) {
      return Math.floor(content.length * 0.3); // 30% into content
    }
    
    // Find position near the first keyword mention
    const contentLower = content.toLowerCase();
    for (const keyword of keywords) {
      const index = contentLower.indexOf(keyword.toLowerCase());
      if (index !== -1) {
        // Find end of sentence after keyword
        const afterKeyword = content.substring(index + keyword.length);
        const sentenceEnd = afterKeyword.search(/[.!?]/);
        if (sentenceEnd !== -1) {
          return index + keyword.length + sentenceEnd + 1;
        }
        return index + keyword.length;
      }
    }
    
    return Math.floor(content.length * 0.4);
  }

  private generateAnchorText(link: IntelligentLink, matchedKeywords: string[]): string {
    if (matchedKeywords.length === 0) {
      return link.title;
    }

    const firstKeyword = matchedKeywords[0].toLowerCase();
    const linkTitle = link.title.toLowerCase();
    
    // Smart anchor text based on content and keywords
    const anchorOptions = [
      link.title,
      `best ${firstKeyword}`,
      `top ${firstKeyword}`,
      `${firstKeyword} guide`,
      `recommended ${firstKeyword}`,
      `check out this ${firstKeyword}`,
      `learn more about ${firstKeyword}`
    ];
    
    // Prefer shorter, more natural options
    const filteredOptions = anchorOptions.filter(option => 
      option.length <= 40 && option.length >= 10
    );
    
    return filteredOptions.length > 0 
      ? filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
      : link.title;
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