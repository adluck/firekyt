// Utility function to safely parse contextMatch data
export function parseContextMatch(contextMatch: any): string[] {
  if (!contextMatch) return [];
  
  if (Array.isArray(contextMatch)) {
    return contextMatch;
  }
  
  if (typeof contextMatch === 'string') {
    try {
      const parsed = JSON.parse(contextMatch);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If it's a simple string, treat it as a single item
      return contextMatch.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  
  return [];
}