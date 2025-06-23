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
    
    // Convert headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
    
    // Convert lists
    const lines = html.split('\n');
    let inList = false;
    let processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('* ')) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        processedLines.push(`<li>${line.substring(2).trim()}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        if (line) {
          processedLines.push(line);
        } else {
          processedLines.push('');
        }
      }
    }
    
    if (inList) {
      processedLines.push('</ul>');
    }
    
    html = processedLines.join('\n');
    
    // Convert paragraphs (double line breaks)
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/^(?!<[hul])/gm, '<p>');
    html = html.replace(/(?<!>)$/gm, '</p>');
    
    // Clean up malformed paragraphs around headers and lists
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<[hul][^>]*>)/g, '$1');
    html = html.replace(/(<\/[hul][^>]*>)<\/p>/g, '$1');
    
    return html;
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