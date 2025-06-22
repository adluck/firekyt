import { storage } from './storage';
import { linkTrackingService } from './LinkTrackingService';

export interface ContentLinkMapping {
  contentId: number;
  linkId: number;
  originalUrl: string;
  trackingUrl: string;
  anchorText: string;
  position: number;
  insertionType: 'retroactive';
}

export interface RetroactiveConversionResult {
  contentId: number;
  title: string;
  linksFound: number;
  linksConverted: number;
  trackingUrls: ContentLinkMapping[];
  updatedContent: string;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

export class RetroactiveTrackingService {
  
  /**
   * Convert all intelligent links in a piece of content to tracking URLs
   */
  async convertContentToTracking(contentId: number, userId: number): Promise<RetroactiveConversionResult> {
    try {
      // Get the content
      const userContent = await storage.getContent(userId);
      const content = userContent.find(c => c.id === contentId);
      
      if (!content) {
        throw new Error('Content not found');
      }

      // Get user's intelligent links
      const intelligentLinks = await storage.getUserIntelligentLinks(userId, content.siteId || undefined);
      
      if (intelligentLinks.length === 0) {
        return {
          contentId,
          title: content.title,
          linksFound: 0,
          linksConverted: 0,
          trackingUrls: [],
          updatedContent: content.content,
          status: 'success'
        };
      }

      const result = await this.processContentLinks(content, intelligentLinks, userId);
      
      // Update the content with tracking URLs if any conversions were made
      if (result.linksConverted > 0) {
        await storage.updateContent(contentId, userId, {
          content: result.updatedContent,
          updatedAt: new Date()
        });

        // Create link insertion records for tracking
        for (const mapping of result.trackingUrls) {
          await storage.createLinkInsertion({
            userId,
            contentId,
            linkId: mapping.linkId,
            siteId: content.siteId,
            insertionType: 'retroactive',
            insertionContext: 'content_body',
            anchorText: mapping.anchorText,
            position: mapping.position,
            isActive: true,
            performanceData: {}
          });
        }
      }

      return result;
    } catch (error: any) {
      console.error('Retroactive conversion error:', error);
      return {
        contentId,
        title: 'Unknown',
        linksFound: 0,
        linksConverted: 0,
        trackingUrls: [],
        updatedContent: '',
        status: 'failed',
        errors: [error.message]
      };
    }
  }

  /**
   * Process content and find/convert intelligent links
   */
  private async processContentLinks(
    content: any, 
    intelligentLinks: any[], 
    userId: number
  ): Promise<RetroactiveConversionResult> {
    let updatedContent = content.content;
    const trackingUrls: ContentLinkMapping[] = [];
    const errors: string[] = [];
    let linksFound = 0;
    let linksConverted = 0;

    for (const link of intelligentLinks) {
      if (!link.originalUrl) continue;

      // Find all occurrences of this link in the content
      const linkMatches = this.findLinkOccurrences(content.content, link);
      linksFound += linkMatches.length;

      for (const match of linkMatches) {
        try {
          // Generate tracking URL
          const trackingUrl = linkTrackingService.generateTrackingUrl(
            link.id,
            link.originalUrl,
            {
              contentId: content.id,
              siteId: content.siteId,
              userId: userId
            }
          );

          // Replace the original URL with tracking URL
          updatedContent = updatedContent.replace(match.originalHtml, match.htmlWithTracking(trackingUrl));

          trackingUrls.push({
            contentId: content.id,
            linkId: link.id,
            originalUrl: link.originalUrl,
            trackingUrl,
            anchorText: match.anchorText,
            position: match.position,
            insertionType: 'retroactive'
          });

          linksConverted++;
        } catch (error: any) {
          errors.push(`Failed to convert link ${link.id}: ${error.message}`);
        }
      }
    }

    return {
      contentId: content.id,
      title: content.title,
      linksFound,
      linksConverted,
      trackingUrls,
      updatedContent,
      status: errors.length === 0 ? 'success' : (linksConverted > 0 ? 'partial' : 'failed'),
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Find all occurrences of a link in content
   */
  private findLinkOccurrences(content: string, link: any): Array<{
    originalHtml: string;
    anchorText: string;
    position: number;
    htmlWithTracking: (trackingUrl: string) => string;
  }> {
    const matches: Array<{
      originalHtml: string;
      anchorText: string;
      position: number;
      htmlWithTracking: (trackingUrl: string) => string;
    }> = [];

    // Escape special regex characters in URL
    const escapedUrl = link.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Find HTML anchor tags with this URL
    const linkRegex = new RegExp(
      `<a[^>]*href\\s*=\\s*["']?${escapedUrl}["']?[^>]*>(.*?)<\\/a>`,
      'gi'
    );

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const originalHtml = match[0];
      const anchorText = match[1].replace(/<[^>]*>/g, ''); // Remove any HTML tags from anchor text
      const position = match.index;

      matches.push({
        originalHtml,
        anchorText,
        position,
        htmlWithTracking: (trackingUrl: string) => {
          return originalHtml.replace(link.originalUrl, trackingUrl);
        }
      });
    }

    // Also find plain text URLs (not in anchor tags)
    const plainUrlRegex = new RegExp(
      `(?<!href\\s*=\\s*["']?)${escapedUrl}(?!["']?[^>]*>)`,
      'gi'
    );

    let plainMatch;
    while ((plainMatch = plainUrlRegex.exec(content)) !== null) {
      const originalHtml = plainMatch[0];
      const position = plainMatch.index;

      matches.push({
        originalHtml,
        anchorText: link.title || 'Link',
        position,
        htmlWithTracking: (trackingUrl: string) => {
          return `<a href="${trackingUrl}">${link.title || originalHtml}</a>`;
        }
      });
    }

    return matches;
  }

  /**
   * Convert multiple pieces of content in batch
   */
  async convertMultipleContent(
    contentIds: number[], 
    userId: number
  ): Promise<RetroactiveConversionResult[]> {
    const results: RetroactiveConversionResult[] = [];

    for (const contentId of contentIds) {
      const result = await this.convertContentToTracking(contentId, userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Get conversion status for user's content
   */
  async getConversionStatus(userId: number): Promise<{
    totalContent: number;
    contentWithTracking: number;
    contentNeedingConversion: number;
    intelligentLinksAvailable: number;
  }> {
    try {
      const userContent = await storage.getContent(userId);
      const intelligentLinks = await storage.getUserIntelligentLinks(userId);
      
      // Get content that already has link insertions
      const contentWithInsertions = new Set<number>();
      for (const content of userContent) {
        const insertions = await storage.getContentLinkInsertions(content.id);
        if (insertions.length > 0) {
          contentWithInsertions.add(content.id);
        }
      }

      return {
        totalContent: userContent.length,
        contentWithTracking: contentWithInsertions.size,
        contentNeedingConversion: userContent.length - contentWithInsertions.size,
        intelligentLinksAvailable: intelligentLinks.length
      };
    } catch (error) {
      console.error('Error getting conversion status:', error);
      return {
        totalContent: 0,
        contentWithTracking: 0,
        contentNeedingConversion: 0,
        intelligentLinksAvailable: 0
      };
    }
  }

  /**
   * Preview what would be converted without making changes
   */
  async previewConversion(contentId: number, userId: number): Promise<{
    linksFound: Array<{
      linkId: number;
      linkTitle: string;
      originalUrl: string;
      anchorText: string;
      occurrences: number;
    }>;
    conversionPreview: string;
  }> {
    try {
      const userContent = await storage.getContent(userId);
      const content = userContent.find(c => c.id === contentId);
      
      if (!content) {
        throw new Error('Content not found');
      }

      const intelligentLinks = await storage.getUserIntelligentLinks(userId, content.siteId || undefined);
      const linksFound: Array<{
        linkId: number;
        linkTitle: string;
        originalUrl: string;
        anchorText: string;
        occurrences: number;
      }> = [];

      let previewContent = content.content;

      for (const link of intelligentLinks) {
        if (!link.originalUrl) continue;

        const matches = this.findLinkOccurrences(content.content, link);
        if (matches.length > 0) {
          linksFound.push({
            linkId: link.id,
            linkTitle: link.title,
            originalUrl: link.originalUrl,
            anchorText: matches[0].anchorText,
            occurrences: matches.length
          });

          // For preview, show what tracking URLs would look like
          const sampleTrackingUrl = `/api/track/click/${link.id}?url=${encodeURIComponent(link.originalUrl)}`;
          for (const match of matches) {
            previewContent = previewContent.replace(
              match.originalHtml,
              match.htmlWithTracking(sampleTrackingUrl)
            );
          }
        }
      }

      return {
        linksFound,
        conversionPreview: previewContent
      };
    } catch (error: any) {
      console.error('Preview conversion error:', error);
      return {
        linksFound: [],
        conversionPreview: ''
      };
    }
  }
}

export const retroactiveTrackingService = new RetroactiveTrackingService();