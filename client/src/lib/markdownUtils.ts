import { marked } from 'marked';

/**
 * Convert markdown text to HTML for rich text editor
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // Configure marked options for better HTML output
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    
    // Convert markdown to HTML
    const html = marked(markdown);
    return typeof html === 'string' ? html : '';
  } catch (error) {
    console.warn('Failed to convert markdown to HTML:', error);
    return markdown; // Fallback to original text
  }
}

/**
 * Convert HTML back to markdown (basic conversion)
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  try {
    // Basic HTML to markdown conversion
    let markdown = html
      // Remove HTML tags that don't have markdown equivalents
      .replace(/<\/?(div|span|section|article)[^>]*>/gi, '')
      // Convert headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Convert paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Convert line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Convert bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Convert links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Convert lists
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      // Convert blockquotes
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      // Convert code
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
      // Clean up any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    return markdown;
  } catch (error) {
    console.warn('Failed to convert HTML to markdown:', error);
    return html; // Fallback to original HTML
  }
}

/**
 * Detect if content is markdown or HTML
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false;
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers
    /^\*\s/m,     // Unordered list
    /^\d+\.\s/m,  // Ordered list
    /\*\*.*\*\*/,  // Bold
    /\*.*\*/,      // Italic
    /\[.*\]\(.*\)/, // Links
    /^>\s/m,       // Blockquotes
  ];
  
  // Check for HTML patterns
  const htmlPatterns = [
    /<[^>]+>/,     // HTML tags
  ];
  
  const hasMarkdown = markdownPatterns.some(pattern => pattern.test(content));
  const hasHTML = htmlPatterns.some(pattern => pattern.test(content));
  
  // If it has HTML tags, it's likely HTML
  if (hasHTML && !hasMarkdown) return false;
  
  // If it has markdown patterns, it's likely markdown
  if (hasMarkdown) return true;
  
  // Default to markdown for plain text
  return true;
}