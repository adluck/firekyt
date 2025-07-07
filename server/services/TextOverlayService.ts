import * as fs from "fs";
import * as path from "path";

interface TextOverlayRequest {
  imageUrl?: string;
  text: string;
  platform: string;
  style: 'modern' | 'bold' | 'minimal' | 'gradient' | 'shadow';
  position: 'top' | 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  fontSize: number;
  textColor: string;
  backgroundColor?: string;
  opacity: number;
}

interface SocialGraphicDimensions {
  width: number;
  height: number;
  name: string;
}

export class TextOverlayService {
  private socialFormats: { [key: string]: SocialGraphicDimensions } = {
    'instagram_post': { width: 1080, height: 1080, name: 'Instagram Post' },
    'instagram_story': { width: 1080, height: 1920, name: 'Instagram Story' },
    'facebook_post': { width: 1200, height: 630, name: 'Facebook Post' },
    'twitter_post': { width: 1200, height: 675, name: 'Twitter Post' },
    'pinterest_pin': { width: 1000, height: 1500, name: 'Pinterest Pin' },
    'tiktok_video': { width: 1080, height: 1920, name: 'TikTok Video' },
    'youtube_thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail' },
    'linkedin_post': { width: 1200, height: 627, name: 'LinkedIn Post' }
  };

  async generateSocialGraphic(request: TextOverlayRequest): Promise<any> {
    try {
      console.log('🎨 Generating social graphic for platform:', request.platform);
      console.log('🎨 Available formats:', Object.keys(this.socialFormats));
      
      const format = this.socialFormats[request.platform];
      if (!format) {
        throw new Error(`Unsupported platform: ${request.platform}. Available platforms: ${Object.keys(this.socialFormats).join(', ')}`);
      }

      // Create graphics directory if it doesn't exist
      const graphicsDir = path.join(process.cwd(), 'client', 'public', 'generated-graphics');
      if (!fs.existsSync(graphicsDir)) {
        fs.mkdirSync(graphicsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `${request.platform}-graphic-${timestamp}.svg`;
      const filepath = path.join(graphicsDir, filename);

      // Generate SVG with text overlay
      const svg = this.createSVGWithTextOverlay(request, format);
      fs.writeFileSync(filepath, svg);

      return {
        success: true,
        graphicUrl: `/generated-graphics/${filename}`,
        platform: request.platform,
        dimensions: format,
        filename
      };
    } catch (error) {
      console.error('Error generating social graphic:', error);
      throw error;
    }
  }

  private createSVGWithTextOverlay(request: TextOverlayRequest, format: SocialGraphicDimensions): string {
    const { width, height } = format;
    const textLines = this.wrapText(request.text, this.calculateMaxCharactersPerLine(width, request.fontSize));
    
    // Calculate text positioning
    const lineHeight = request.fontSize * 1.2;
    const totalTextHeight = textLines.length * lineHeight;
    const { x, y } = this.calculateTextPosition(request.position, width, height, totalTextHeight);

    // Generate background if specified
    const backgroundRect = request.backgroundColor 
      ? `  <rect x="0" y="0" width="${width}" height="${height}" fill="${request.backgroundColor}" opacity="${request.opacity}"/>`
      : '';

    // Create text elements with styling
    const textElements = textLines.map((line, index) => {
      const yPos = y + (index * lineHeight);
      return `  <text x="${x}" y="${yPos}" fill="${request.textColor}" font-size="${request.fontSize}" font-family="Arial, sans-serif" font-weight="${request.style === 'bold' ? 'bold' : 'normal'}" text-anchor="middle" ${this.getTextStyling(request.style)}>${this.escapeXML(line)}</text>`;
    }).join('\n');

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b6b"/>
      <stop offset="100%" style="stop-color:#4ecdc4"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f0f0f0"/>
  ${backgroundRect}
  ${textElements}
</svg>`;
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  private calculateMaxCharactersPerLine(width: number, fontSize: number): number {
    // Rough estimate: each character takes about 0.6 * fontSize pixels
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor((width * 0.8) / charWidth); // Use 80% of width for padding
    return Math.max(10, maxChars); // Minimum 10 characters
  }

  private calculateTextPosition(position: string, width: number, height: number, textHeight: number): { x: number, y: number } {
    const padding = 50;
    
    switch (position) {
      case 'top':
        return { x: width / 2, y: padding + 20 };
      case 'center':
        return { x: width / 2, y: (height - textHeight) / 2 + 20 };
      case 'bottom':
        return { x: width / 2, y: height - textHeight - padding };
      case 'top-left':
        return { x: padding, y: padding + 20 };
      case 'top-right':
        return { x: width - padding, y: padding + 20 };
      case 'bottom-left':
        return { x: padding, y: height - textHeight - padding };
      case 'bottom-right':
        return { x: width - padding, y: height - textHeight - padding };
      default:
        return { x: width / 2, y: height / 2 };
    }
  }

  private getTextStyling(style: string): string {
    switch (style) {
      case 'shadow':
        return 'filter="url(#dropshadow)"';
      case 'gradient':
        return 'fill="url(#textGradient)"';
      case 'bold':
        return 'font-weight="bold"';
      case 'minimal':
        return 'font-weight="300"';
      default:
        return '';
    }
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Generate suggested text overlays for ad copy
  generateTextSuggestions(adCopy: any, platform: string): any[] {
    const suggestions = [];
    
    // Headlines as prominent overlays
    if (adCopy.headlines) {
      adCopy.headlines.forEach((headline: string, index: number) => {
        suggestions.push({
          id: `headline-${index}`,
          text: headline,
          style: 'bold',
          position: 'center',
          fontSize: this.getOptimalFontSize(platform, 'headline'),
          textColor: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          opacity: 0.8,
          type: 'headline'
        });
      });
    }

    // CTAs as bottom overlays
    if (adCopy.ctas) {
      adCopy.ctas.forEach((cta: string, index: number) => {
        suggestions.push({
          id: `cta-${index}`,
          text: cta,
          style: 'shadow',
          position: 'bottom',
          fontSize: this.getOptimalFontSize(platform, 'cta'),
          textColor: '#ff6b6b',
          backgroundColor: 'rgba(255,255,255,0.9)',
          opacity: 0.9,
          type: 'cta'
        });
      });
    }

    return suggestions;
  }

  private getOptimalFontSize(platform: string, textType: 'headline' | 'cta' | 'description'): number {
    const baseSizes = {
      headline: { base: 48, mobile: 36 },
      cta: { base: 32, mobile: 24 },
      description: { base: 24, mobile: 18 }
    };

    const isMobileFormat = ['instagram_story', 'tiktok_video'].includes(platform);
    return isMobileFormat ? baseSizes[textType].mobile : baseSizes[textType].base;
  }

  // Get available social media formats
  getSocialFormats(): { [key: string]: SocialGraphicDimensions } {
    return this.socialFormats;
  }
}