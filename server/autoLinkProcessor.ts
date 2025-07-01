import type { AutoLinkRule } from "@shared/schema";

interface ProcessedContent {
  content: string;
  appliedRules: {
    ruleId: number;
    keyword: string;
    insertionCount: number;
    positions: number[];
  }[];
}

/**
 * Process content with auto-link rules to automatically insert affiliate links
 */
export async function processContentWithAutoLinks(
  originalContent: string, 
  rules: AutoLinkRule[]
): Promise<ProcessedContent> {
  let processedContent = originalContent;
  const appliedRules: ProcessedContent['appliedRules'] = [];

  // Sort rules by priority (highest first)
  const sortedRules = rules.sort((a, b) => (b.priority || 50) - (a.priority || 50));

  for (const rule of sortedRules) {
    if (!rule.isActive || !rule.keyword || !rule.affiliateUrl) {
      continue;
    }

    const keyword = rule.keyword;
    const maxInsertions = rule.maxInsertions || 1;
    let insertionCount = 0;
    const positions: number[] = [];

    // Build the link with UTM parameters
    let linkUrl = rule.affiliateUrl;
    if (rule.utmParams && typeof rule.utmParams === 'object') {
      const url = new URL(linkUrl);
      Object.entries(rule.utmParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, String(value));
        }
      });
      linkUrl = url.toString();
    }

    // Create the link HTML
    const anchorText = rule.anchorText || keyword;
    const target = rule.targetAttribute || '_blank';
    const rel = rule.relAttribute || 'nofollow';
    const title = rule.linkTitle || '';
    
    const linkHtml = `<a href="${linkUrl}" target="${target}" rel="${rel}"${title ? ` title="${title}"` : ''}>${anchorText}</a>`;

    // Find and replace keywords based on matching rules
    const searchPattern = rule.matchWholeWords 
      ? new RegExp(`\\b${escapeRegExp(keyword)}\\b`, rule.caseSensitive ? 'g' : 'gi')
      : new RegExp(escapeRegExp(keyword), rule.caseSensitive ? 'g' : 'gi');

    // Track replacements for this rule
    let match;
    const regex = new RegExp(searchPattern.source, searchPattern.flags);
    
    while ((match = regex.exec(processedContent)) !== null && insertionCount < maxInsertions) {
      // Check if this position is already inside a link tag
      if (!isInsideLink(processedContent, match.index)) {
        positions.push(match.index);
        insertionCount++;
      }
      
      // Prevent infinite loop for global regex
      if (!searchPattern.global) break;
    }

    // Apply replacements from end to start to maintain positions
    if (insertionCount > 0) {
      // Reset regex for actual replacement
      let replacementCount = 0;
      processedContent = processedContent.replace(searchPattern, (matched, offset) => {
        if (replacementCount < maxInsertions && !isInsideLink(processedContent, offset)) {
          replacementCount++;
          return linkHtml;
        }
        return matched;
      });

      // Record this rule as applied
      appliedRules.push({
        ruleId: rule.id,
        keyword: rule.keyword,
        insertionCount: replacementCount,
        positions
      });

      // Update rule usage statistics (optional - would need database call)
      // await storage.updateAutoLinkRule(rule.id, {
      //   lastUsed: new Date(),
      //   usageCount: (rule.usageCount || 0) + replacementCount
      // });
    }
  }

  return {
    content: processedContent,
    appliedRules
  };
}

/**
 * Check if a position in the content is already inside a link tag
 */
function isInsideLink(content: string, position: number): boolean {
  const beforePosition = content.substring(0, position);
  const afterPosition = content.substring(position);
  
  // Find the last opening and closing link tags before this position
  const lastOpenTag = beforePosition.lastIndexOf('<a ');
  const lastCloseTag = beforePosition.lastIndexOf('</a>');
  
  // If there's an opening tag after the last closing tag, we're inside a link
  if (lastOpenTag > lastCloseTag) {
    // Check if there's a closing tag after this position
    const nextCloseTag = afterPosition.indexOf('</a>');
    return nextCloseTag !== -1;
  }
  
  return false;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get keyword suggestions from content for creating auto-link rules
 */
export function extractKeywordSuggestions(content: string): string[] {
  // Remove HTML tags
  const textContent = content.replace(/<[^>]*>/g, ' ');
  
  // Split into words and filter
  const words = textContent
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !commonWords.includes(word) && 
      /^[a-zA-Z]+$/.test(word)
    );

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Return top 20 most frequent words
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Common words to exclude from keyword suggestions
 */
const commonWords = [
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one',
  'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see',
  'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'this',
  'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time',
  'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take',
  'than', 'them', 'well', 'were', 'will', 'your'
];