/**
 * Affiliate Network Integration System
 * Supports major affiliate programs with proper link generation
 */

export interface AffiliateConfig {
  networkName: string;
  baseUrl: string;
  trackingParam: string;
  affiliateId?: string;
  subId?: string;
  commissionRate: number;
  cookieDuration: number; // days
}

export interface AffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  networkName: string;
  commissionRate: number;
  trackingId: string;
  deepLink?: string;
}

export class AffiliateNetworkManager {
  private networks: Map<string, AffiliateConfig> = new Map();

  constructor() {
    this.initializeNetworks();
  }

  private initializeNetworks() {
    // Networks are only added when API credentials are provided and verified
    // This ensures only authenticated affiliate programs are available
  }

  /**
   * Detects the best affiliate network for a given product URL
   */
  detectNetworkFromUrl(productUrl: string): string | null {
    const url = productUrl.toLowerCase();
    
    if (url.includes('amazon.com') || url.includes('amzn.')) {
      return 'amazon';
    }
    
    if (url.includes('walmart.com')) {
      return 'impact'; // Walmart uses Impact Radius
    }
    
    if (url.includes('target.com')) {
      return 'cj'; // Target uses CJ Affiliate
    }
    
    if (url.includes('bestbuy.com')) {
      return 'cj'; // Best Buy uses CJ Affiliate
    }
    
    if (url.includes('ebay.com')) {
      return 'rakuten'; // eBay Partner Network (now Rakuten)
    }
    
    if (url.includes('shopify.com') || url.includes('myshopify.com')) {
      return 'impact'; // Many Shopify stores use Impact
    }
    
    // Default to ShareASale for general e-commerce
    return 'shareasale';
  }

  /**
   * Generates affiliate link for a product
   */
  generateAffiliateLink(
    productUrl: string, 
    networkName?: string,
    customAffiliateId?: string,
    subId?: string
  ): AffiliateLink {
    // Auto-detect network if not specified
    const detectedNetwork = networkName || this.detectNetworkFromUrl(productUrl);
    const network = this.networks.get(detectedNetwork || 'shareasale');
    
    if (!network) {
      throw new Error(`Unsupported affiliate network: ${detectedNetwork}`);
    }

    const trackingId = this.generateTrackingId();
    const affiliateId = customAffiliateId || this.getDefaultAffiliateId(detectedNetwork || 'shareasale');
    
    let affiliateUrl = '';

    switch (detectedNetwork) {
      case 'amazon':
        affiliateUrl = this.generateAmazonLink(productUrl, affiliateId, trackingId);
        break;
      
      case 'shareasale':
        affiliateUrl = this.generateShareASaleLink(productUrl, affiliateId, trackingId, subId);
        break;
      
      case 'cj':
        affiliateUrl = this.generateCJLink(productUrl, affiliateId, trackingId);
        break;
      
      case 'clickbank':
        affiliateUrl = this.generateClickBankLink(productUrl, affiliateId, trackingId);
        break;
      
      case 'impact':
        affiliateUrl = this.generateImpactLink(productUrl, affiliateId, trackingId);
        break;
      
      case 'rakuten':
        affiliateUrl = this.generateRakutenLink(productUrl, affiliateId, trackingId);
        break;
      
      default:
        affiliateUrl = this.generateGenericLink(productUrl, network, affiliateId, trackingId);
    }

    return {
      originalUrl: productUrl,
      affiliateUrl,
      networkName: network.networkName,
      commissionRate: network.commissionRate,
      trackingId,
      deepLink: productUrl
    };
  }

  private generateAmazonLink(productUrl: string, affiliateId: string, trackingId: string): string {
    const url = new URL(productUrl);
    url.searchParams.set('tag', affiliateId);
    url.searchParams.set('linkCode', 'll1');
    url.searchParams.set('linkId', trackingId);
    url.searchParams.set('language', 'en_US');
    return url.toString();
  }

  private generateShareASaleLink(productUrl: string, affiliateId: string, trackingId: string, subId?: string): string {
    const encodedUrl = encodeURIComponent(productUrl);
    let link = `https://shareasale.com/r.cfm?b=1&u=${affiliateId}&m=12345&urllink=${encodedUrl}&afftrack=${trackingId}`;
    
    if (subId) {
      link += `&subid=${subId}`;
    }
    
    return link;
  }

  private generateCJLink(productUrl: string, affiliateId: string, trackingId: string): string {
    const encodedUrl = encodeURIComponent(productUrl);
    return `https://www.anrdoezrs.net/links/${affiliateId}/type/dlg/sid/${trackingId}/${encodedUrl}`;
  }

  private generateClickBankLink(productUrl: string, affiliateId: string, trackingId: string): string {
    // ClickBank typically uses product nicknames
    const productNickname = this.extractClickBankProduct(productUrl);
    return `https://${affiliateId}.${productNickname}.hop.clickbank.net/?tid=${trackingId}`;
  }

  private generateImpactLink(productUrl: string, affiliateId: string, trackingId: string): string {
    const encodedUrl = encodeURIComponent(productUrl);
    return `https://impact.com/campaign-promo-codes/click?campid=12345&adgid=${affiliateId}&userid=${trackingId}&url=${encodedUrl}`;
  }

  private generateRakutenLink(productUrl: string, affiliateId: string, trackingId: string): string {
    const encodedUrl = encodeURIComponent(productUrl);
    return `https://click.linksynergy.com/deeplink?id=${affiliateId}&mid=12345&u1=${trackingId}&murl=${encodedUrl}`;
  }

  private generateGenericLink(productUrl: string, network: AffiliateConfig, affiliateId: string, trackingId: string): string {
    const encodedUrl = encodeURIComponent(productUrl);
    return `${network.baseUrl}?${network.trackingParam}=${affiliateId}&url=${encodedUrl}&tracking=${trackingId}`;
  }

  private generateTrackingId(): string {
    return `tk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private getDefaultAffiliateId(networkName: string): string {
    // These would typically come from environment variables
    const defaultIds: Record<string, string> = {
      amazon: process.env.AMAZON_AFFILIATE_ID || 'firekyt-20',
      shareasale: process.env.SHAREASALE_AFFILIATE_ID || '123456',
      cj: process.env.CJ_AFFILIATE_ID || '12345',
      clickbank: process.env.CLICKBANK_AFFILIATE_ID || 'firekyt',
      impact: process.env.IMPACT_AFFILIATE_ID || '12345',
      rakuten: process.env.RAKUTEN_AFFILIATE_ID || '123456',
      partnerstack: process.env.PARTNERSTACK_AFFILIATE_ID || 'firekyt',
      awin: process.env.AWIN_AFFILIATE_ID || '12345'
    };

    return defaultIds[networkName] || 'default-affiliate-id';
  }

  private extractClickBankProduct(productUrl: string): string {
    // Extract product nickname from ClickBank URL
    const match = productUrl.match(/\/([^\/]+)\.hop\.clickbank\.net/);
    return match ? match[1] : 'product';
  }

  /**
   * Gets commission rate for a specific network
   */
  getCommissionRate(networkName: string): number {
    const network = this.networks.get(networkName);
    return network ? network.commissionRate : 5.0; // Default 5%
  }

  /**
   * Gets all supported networks
   */
  getSupportedNetworks(): AffiliateConfig[] {
    return Array.from(this.networks.values());
  }

  /**
   * Add an authenticated affiliate network
   */
  addNetwork(networkKey: string, config: AffiliateConfig): void {
    this.networks.set(networkKey, config);
  }

  /**
   * Remove a network
   */
  removeNetwork(networkKey: string): boolean {
    return this.networks.delete(networkKey);
  }

  /**
   * Check if a network is configured
   */
  hasNetwork(networkKey: string): boolean {
    return this.networks.has(networkKey);
  }

  /**
   * Validates affiliate link format
   */
  validateAffiliateLink(affiliateUrl: string): boolean {
    try {
      const url = new URL(affiliateUrl);
      
      // Check for common affiliate parameters
      const hasAffiliateParams = 
        url.searchParams.has('tag') || // Amazon
        url.searchParams.has('b') || // ShareASale
        url.searchParams.has('sid') || // CJ
        url.searchParams.has('tid') || // ClickBank
        url.searchParams.has('irclickid') || // Impact
        url.searchParams.has('id') || // Rakuten
        url.pathname.includes('/links/'); // CJ style

      return hasAffiliateParams;
    } catch {
      return false;
    }
  }

  /**
   * Extracts original URL from affiliate link
   */
  extractOriginalUrl(affiliateUrl: string): string {
    try {
      const url = new URL(affiliateUrl);
      
      // Check for encoded URL parameter
      const urlParam = url.searchParams.get('url') || 
                      url.searchParams.get('murl') || 
                      url.searchParams.get('urllink');
      
      if (urlParam) {
        return decodeURIComponent(urlParam);
      }
      
      // If no encoded URL, return the affiliate URL itself (like Amazon)
      return affiliateUrl;
    } catch {
      return affiliateUrl;
    }
  }
}

// Export singleton instance
export const affiliateManager = new AffiliateNetworkManager();