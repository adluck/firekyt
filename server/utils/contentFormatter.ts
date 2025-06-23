/**
 * Content formatting utilities for publishing platforms
 */

export class ContentFormatter {
  /**
   * Clean and format content for publishing (handles both HTML and Markdown)
   */
  static formatForPublishing(content: string): string {
    if (!content) return '';
    
    let formatted = content;
    
    // Check if content is Markdown (contains # headers, * lists, [links](urls))
    const isMarkdown = /^#\s+/.test(formatted) || /^\*\s+/.test(formatted.split('\n').find(line => line.trim()) || '') || /\[.*\]\(.*\)/.test(formatted);
    
    if (isMarkdown) {
      // Convert Markdown to HTML
      formatted = this.convertMarkdownToHtml(formatted);
    } else {
      // Decode HTML entities that might have been double-encoded
      formatted = formatted
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/""/g, '"')
        .replace(/''/g, "'");
    }
    
    // Ensure proper paragraph structure for plain text
    if (!formatted.includes('<p>') && !formatted.includes('<div>') && !formatted.includes('<h')) {
      formatted = formatted
        .split('\n\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('\n');
    }
    
    return formatted;
  }

  /**
   * Convert Markdown to HTML
   */
  static convertMarkdownToHtml(markdown: string): string {
    let html = markdown;
    
    // Convert headers first
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic text (but not list items)
    html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
    
    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
    
    // Split into paragraphs first
    const paragraphs = html.split(/\n\s*\n/);
    let processedParagraphs: string[] = [];
    
    for (const paragraph of paragraphs) {
      const lines = paragraph.trim().split('\n');
      
      if (lines.some(line => line.trim().startsWith('* '))) {
        // This is a list paragraph
        let listHtml = '<ul>';
        let hasNonListContent = false;
        let nonListContent = '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('* ')) {
            if (hasNonListContent) {
              processedParagraphs.push(`<p>${nonListContent.trim()}</p>`);
              nonListContent = '';
              hasNonListContent = false;
            }
            listHtml += `<li>${trimmed.substring(2).trim()}</li>`;
          } else if (trimmed) {
            if (listHtml !== '<ul>') {
              listHtml += '</ul>';
              processedParagraphs.push(listHtml);
              listHtml = '<ul>';
            }
            nonListContent += (nonListContent ? ' ' : '') + trimmed;
            hasNonListContent = true;
          }
        }
        
        if (listHtml !== '<ul>') {
          listHtml += '</ul>';
          processedParagraphs.push(listHtml);
        }
        
        if (hasNonListContent) {
          processedParagraphs.push(`<p>${nonListContent.trim()}</p>`);
        }
      } else {
        // Regular paragraph
        const content = lines.join(' ').trim();
        if (content && !content.startsWith('<h')) {
          processedParagraphs.push(`<p>${content}</p>`);
        } else if (content) {
          processedParagraphs.push(content);
        }
      }
    }
    
    return processedParagraphs.join('\n\n');
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