import { storage } from './storage';
import { insertContentSchema, type Content } from '@shared/schema';
import { z } from 'zod';

export interface CreateContentRequest {
  title: string;
  content: string;
  contentType: 'blog_post' | 'product_comparison' | 'review_article' | 'video_script' | 'social_post' | 'email_campaign';
  siteId: number;
  targetKeywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateContentRequest {
  title?: string;
  content?: string;
  contentType?: string;
  targetKeywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface ContentFilters {
  status?: string;
  contentType?: string;
  siteId?: number;
  search?: string;
}

/**
 * Content Service - Handles all content-related business logic
 * Separated from routes to maintain clean architecture
 */
export class ContentService {
  
  async createContent(userId: number, request: CreateContentRequest): Promise<Content> {
    this.validateContentRequest(request);
    
    const contentData = insertContentSchema.parse({
      userId,
      siteId: request.siteId,
      title: request.title,
      content: request.content,
      contentType: request.contentType,
      targetKeywords: request.targetKeywords || [],
      seoTitle: request.seoTitle || null,
      seoDescription: request.seoDescription || null,
      status: request.status || 'draft',
      views: 0,
      uniqueViews: 0,
      averageTimeOnPage: 0,
      bounceRate: 0,
      seoScore: null,
      readabilityScore: null,
      wordCount: this.calculateWordCount(request.content),
      publishedAt: request.status === 'published' ? new Date() : null,
    });

    return await storage.createContent(contentData);
  }

  async getContentById(contentId: number, userId: number): Promise<Content | null> {
    const content = await storage.getContentById(contentId);
    
    if (!content || content.userId !== userId) {
      return null;
    }
    
    return content;
  }

  async getUserContent(userId: number, filters: ContentFilters = {}, page: number = 1, limit: number = 20): Promise<{
    content: Content[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const result = await storage.getUserContent(userId, {
      status: filters.status,
      contentType: filters.contentType,
      siteId: filters.siteId,
      search: filters.search,
      limit,
      offset
    });

    return {
      content: result.content,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async updateContent(contentId: number, userId: number, request: UpdateContentRequest): Promise<Content> {
    console.log('🔍 ContentService.updateContent - Received request.targetKeywords:', JSON.stringify(request.targetKeywords));
    
    const existingContent = await this.getContentById(contentId, userId);
    if (!existingContent) {
      throw new Error('Content not found or access denied');
    }

    const updateData: Partial<Content> = {
      ...request,
      updatedAt: new Date()
    };
    
    console.log('🔍 ContentService.updateContent - updateData.targetKeywords:', JSON.stringify(updateData.targetKeywords));

    if (request.content) {
      updateData.wordCount = this.calculateWordCount(request.content);
    }

    if (request.status === 'published' && existingContent.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    return await storage.updateContent(contentId, userId, updateData);
  }

  async deleteContent(contentId: number, userId: number): Promise<void> {
    const content = await this.getContentById(contentId, userId);
    if (!content) {
      throw new Error('Content not found or access denied');
    }

    await storage.deleteContent(contentId);
  }

  async getContentAnalytics(contentId: number, userId: number): Promise<{
    views: number;
    uniqueViews: number;
    averageTimeOnPage: number;
    bounceRate: number;
    seoScore: number | null;
    readabilityScore: number | null;
    performanceMetrics: any;
  }> {
    const content = await this.getContentById(contentId, userId);
    if (!content) {
      throw new Error('Content not found or access denied');
    }

    // Get additional analytics from storage
    const analytics = await storage.getContentAnalytics(contentId);

    return {
      views: content.views || 0,
      uniqueViews: content.uniqueViews || 0,
      averageTimeOnPage: content.averageTimeOnPage || 0,
      bounceRate: content.bounceRate || 0,
      seoScore: content.seoScore,
      readabilityScore: content.readabilityScore,
      performanceMetrics: analytics
    };
  }

  async updateContentMetrics(contentId: number, metrics: {
    views?: number;
    uniqueViews?: number;
    averageTimeOnPage?: number;
    bounceRate?: number;
    seoScore?: number;
    readabilityScore?: number;
  }): Promise<void> {
    await storage.updateContent(contentId, {
      ...metrics,
      updatedAt: new Date()
    });
  }

  async getTopPerformingContent(userId: number, limit: number = 10): Promise<Content[]> {
    return await storage.getTopPerformingContent(userId, limit);
  }

  async getContentByStatus(userId: number, status: string): Promise<Content[]> {
    const result = await storage.getUserContent(userId, { status });
    return result.content;
  }

  async duplicateContent(contentId: number, userId: number): Promise<Content> {
    const originalContent = await this.getContentById(contentId, userId);
    if (!originalContent) {
      throw new Error('Content not found or access denied');
    }

    const duplicateData = {
      title: `${originalContent.title} (Copy)`,
      content: originalContent.content,
      contentType: originalContent.contentType,
      siteId: originalContent.siteId,
      targetKeywords: originalContent.targetKeywords,
      seoTitle: originalContent.seoTitle,
      seoDescription: originalContent.seoDescription,
      status: 'draft' as const
    };

    return await this.createContent(userId, duplicateData);
  }

  // Business Logic Methods
  private validateContentRequest(request: CreateContentRequest): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (!request.content || request.content.trim().length === 0) {
      throw new Error('Content is required');
    }

    if (request.title.length > 500) {
      throw new Error('Title must be less than 500 characters');
    }

    const validContentTypes = [
      'blog_post', 'product_comparison', 'review_article', 
      'video_script', 'social_post', 'email_campaign'
    ];
    
    if (!validContentTypes.includes(request.contentType)) {
      throw new Error('Invalid content type');
    }
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  calculateReadingTime(wordCount: number): number {
    const wordsPerMinute = 200; // Average reading speed
    return Math.ceil(wordCount / wordsPerMinute);
  }

  extractKeywords(content: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  validateSEO(content: Content): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Title length check
    if (!content.seoTitle || content.seoTitle.length < 30) {
      issues.push('SEO title too short');
      suggestions.push('Add a descriptive SEO title (30-60 characters)');
      score -= 15;
    } else if (content.seoTitle.length > 60) {
      issues.push('SEO title too long');
      suggestions.push('Shorten SEO title to under 60 characters');
      score -= 10;
    }

    // Meta description check
    if (!content.seoDescription || content.seoDescription.length < 120) {
      issues.push('Meta description too short');
      suggestions.push('Add a compelling meta description (120-160 characters)');
      score -= 15;
    } else if (content.seoDescription.length > 160) {
      issues.push('Meta description too long');
      suggestions.push('Shorten meta description to under 160 characters');
      score -= 10;
    }

    // Content length check
    if (content.wordCount && content.wordCount < 300) {
      issues.push('Content too short');
      suggestions.push('Expand content to at least 300 words for better SEO');
      score -= 20;
    }

    // Keywords check
    if (!content.targetKeywords || content.targetKeywords.length === 0) {
      issues.push('No target keywords defined');
      suggestions.push('Define target keywords for better SEO optimization');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }
}