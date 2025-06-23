/**
 * Content formatting utilities for publishing platforms
 */

export class ContentFormatter {
  /**
   * Clean and format HTML content for publishing
   */
  static formatForPublishing(content: string): string {
    if (!content) return '';
    
    let formatted = content;
    
    // Decode HTML entities that might have been double-encoded
    formatted = formatted
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/""/g, '"')
      .replace(/''/g, "'");
    
    // Ensure proper paragraph structure for content without HTML tags
    if (!formatted.includes('<p>') && !formatted.includes('<div>')) {
      formatted = formatted
        .split('\n\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('\n');
    }
    
    return formatted;
  }

  /**
   * Generate clean excerpt from HTML content
   */
  static generateExcerpt(content: string, maxLength: number = 160): string {
    if (!content) return '';
    
    // Strip HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    // Find the last complete word within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  /**
   * Clean HTML for safe display
   */
  static sanitizeHtml(content: string): string {
    if (!content) return '';
    
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }
}