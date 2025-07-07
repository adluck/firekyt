/**
 * Shortcode processor for converting FireKyt widget shortcodes to iframes
 */

export function processShortcodes(content: string): string {
  if (!content) return content;

  // Process FireKyt widget shortcodes
  const shortcodeRegex = /\[firekyt_widget\s+id="(\d+)"\s+domain="([^"]+)"\]/g;
  
  return content.replace(shortcodeRegex, (match, widgetId, domain) => {
    // Convert shortcode to iframe
    return `<iframe src="https://${domain}/widgets/${widgetId}/iframe" width="300" height="250" frameborder="0" scrolling="no" style="border: none; display: block; margin: 20px auto;"></iframe>`;
  });
}

export function extractShortcodes(content: string): Array<{widgetId: string, domain: string}> {
  if (!content) return [];

  const shortcodes: Array<{widgetId: string, domain: string}> = [];
  const shortcodeRegex = /\[firekyt_widget\s+id="(\d+)"\s+domain="([^"]+)"\]/g;
  
  let match;
  while ((match = shortcodeRegex.exec(content)) !== null) {
    shortcodes.push({
      widgetId: match[1],
      domain: match[2]
    });
  }
  
  return shortcodes;
}