import { storage } from './storage';

export interface SocialPlatformConnection {
  id: number;
  userId: number;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'tiktok';
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
}

export interface PublishingTarget {
  platform: string;
  accountId: string;
  contentFormat: string;
  scheduledTime?: Date;
  status: 'pending' | 'published' | 'failed';
}

export interface ContentAdaptation {
  platform: string;
  title: string;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  callToAction?: string;
}

/**
 * Integration Service - Handles all third-party platform integrations
 * Manages social media connections, publishing automation, and content adaptation
 */
export class IntegrationService {

  async connectSocialPlatform(userId: number, platform: string, credentials: any): Promise<SocialPlatformConnection> {
    // Validate platform support
    const supportedPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok'];
    if (!supportedPlatforms.includes(platform)) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    // Check if connection already exists
    const existingConnection = await storage.getSocialConnection(userId, platform);
    if (existingConnection && existingConnection.isActive) {
      throw new Error(`${platform} account is already connected`);
    }

    // Validate credentials with platform API
    const validatedCredentials = await this.validatePlatformCredentials(platform, credentials);
    
    const connectionData = {
      userId,
      platform: platform as any,
      accountId: validatedCredentials.accountId,
      accountName: validatedCredentials.accountName,
      accessToken: validatedCredentials.accessToken,
      refreshToken: validatedCredentials.refreshToken,
      tokenExpiresAt: validatedCredentials.expiresAt,
      isActive: true,
      createdAt: new Date()
    };

    return await storage.createSocialConnection(connectionData);
  }

  async disconnectSocialPlatform(userId: number, platform: string): Promise<void> {
    const connection = await storage.getSocialConnection(userId, platform);
    if (!connection) {
      throw new Error(`No ${platform} connection found`);
    }

    await storage.updateSocialConnection(connection.id, { isActive: false });
  }

  async getUserConnections(userId: number): Promise<SocialPlatformConnection[]> {
    return await storage.getUserSocialConnections(userId);
  }

  async publishToSocialMedia(userId: number, contentId: number, targets: PublishingTarget[]): Promise<{
    successes: Array<{ platform: string; postId: string; url: string }>;
    failures: Array<{ platform: string; error: string }>;
  }> {
    const content = await storage.getContentById(contentId);
    if (!content || content.userId !== userId) {
      throw new Error('Content not found or access denied');
    }

    const successes = [];
    const failures = [];

    for (const target of targets) {
      try {
        const connection = await storage.getSocialConnection(userId, target.platform);
        if (!connection || !connection.isActive) {
          failures.push({ platform: target.platform, error: 'Platform not connected' });
          continue;
        }

        // Refresh token if needed
        await this.refreshTokenIfNeeded(connection);

        // Adapt content for platform
        const adaptedContent = await this.adaptContentForPlatform(content, target.platform);

        // Publish to platform
        const result = await this.publishToPlatform(connection, adaptedContent, target);
        
        successes.push({
          platform: target.platform,
          postId: result.postId,
          url: result.url
        });

        // Track publication
        await this.trackPublication(userId, contentId, target.platform, result);

      } catch (error) {
        failures.push({ 
          platform: target.platform, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { successes, failures };
  }

  async schedulePublication(userId: number, contentId: number, targets: PublishingTarget[]): Promise<string[]> {
    const scheduledIds = [];

    for (const target of targets) {
      const scheduleData = {
        userId,
        contentId,
        platform: target.platform,
        accountId: target.accountId,
        scheduledTime: target.scheduledTime || new Date(),
        status: 'pending' as const,
        createdAt: new Date()
      };

      const scheduled = await storage.createScheduledPublication(scheduleData);
      scheduledIds.push(scheduled.id.toString());
    }

    return scheduledIds;
  }

  async getScheduledPublications(userId: number): Promise<any[]> {
    return await storage.getUserScheduledPublications(userId);
  }

  async cancelScheduledPublication(userId: number, scheduleId: string): Promise<void> {
    const scheduled = await storage.getScheduledPublication(parseInt(scheduleId));
    if (!scheduled || scheduled.userId !== userId) {
      throw new Error('Scheduled publication not found or access denied');
    }

    await storage.updateScheduledPublication(parseInt(scheduleId), { status: 'cancelled' });
  }

  async getPublicationHistory(userId: number): Promise<any[]> {
    return await storage.getUserPublicationHistory(userId);
  }

  async syncSocialMetrics(userId: number, platform?: string): Promise<void> {
    const connections = platform 
      ? [await storage.getSocialConnection(userId, platform)]
      : await storage.getUserSocialConnections(userId);

    for (const connection of connections) {
      if (!connection || !connection.isActive) continue;

      try {
        // Refresh token if needed
        await this.refreshTokenIfNeeded(connection);

        // Fetch metrics from platform
        const metrics = await this.fetchPlatformMetrics(connection);

        // Update local metrics
        await this.updateSocialMetrics(userId, connection.platform, metrics);

        // Update last sync time
        await storage.updateSocialConnection(connection.id, { lastSyncAt: new Date() });

      } catch (error) {
        console.error(`Failed to sync metrics for ${connection.platform}:`, error);
      }
    }
  }

  async getAggregatedSocialMetrics(userId: number): Promise<{
    totalFollowers: number;
    totalPosts: number;
    totalEngagement: number;
    platformBreakdown: { [platform: string]: any };
  }> {
    const connections = await storage.getUserSocialConnections(userId);
    let totalFollowers = 0;
    let totalPosts = 0;
    let totalEngagement = 0;
    const platformBreakdown: { [platform: string]: any } = {};

    for (const connection of connections) {
      if (!connection.isActive) continue;

      const metrics = await storage.getSocialMetrics(userId, connection.platform);
      if (metrics) {
        totalFollowers += metrics.followers || 0;
        totalPosts += metrics.posts || 0;
        totalEngagement += metrics.engagement || 0;
        
        platformBreakdown[connection.platform] = {
          followers: metrics.followers || 0,
          posts: metrics.posts || 0,
          engagement: metrics.engagement || 0,
          accountName: connection.accountName
        };
      }
    }

    return {
      totalFollowers,
      totalPosts,
      totalEngagement,
      platformBreakdown
    };
  }

  // Private helper methods
  private async validatePlatformCredentials(platform: string, credentials: any): Promise<any> {
    // Platform-specific credential validation
    switch (platform) {
      case 'twitter':
        return await this.validateTwitterCredentials(credentials);
      case 'linkedin':
        return await this.validateLinkedInCredentials(credentials);
      case 'facebook':
        return await this.validateFacebookCredentials(credentials);
      case 'instagram':
        return await this.validateInstagramCredentials(credentials);
      default:
        throw new Error(`Credential validation not implemented for ${platform}`);
    }
  }

  private async validateTwitterCredentials(credentials: any): Promise<any> {
    // Simulate Twitter API validation
    if (!credentials.accessToken || !credentials.accessTokenSecret) {
      throw new Error('Invalid Twitter credentials');
    }

    return {
      accountId: credentials.userId || 'twitter_user_123',
      accountName: credentials.screenName || 'TwitterUser',
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt ? new Date(credentials.expiresAt) : undefined
    };
  }

  private async validateLinkedInCredentials(credentials: any): Promise<any> {
    // Simulate LinkedIn API validation
    if (!credentials.accessToken) {
      throw new Error('Invalid LinkedIn credentials');
    }

    return {
      accountId: credentials.personId || 'linkedin_user_123',
      accountName: credentials.firstName + ' ' + credentials.lastName || 'LinkedIn User',
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt ? new Date(credentials.expiresAt) : undefined
    };
  }

  private async validateFacebookCredentials(credentials: any): Promise<any> {
    // Simulate Facebook API validation
    if (!credentials.accessToken) {
      throw new Error('Invalid Facebook credentials');
    }

    return {
      accountId: credentials.userId || 'facebook_user_123',
      accountName: credentials.name || 'Facebook User',
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt ? new Date(credentials.expiresAt) : undefined
    };
  }

  private async validateInstagramCredentials(credentials: any): Promise<any> {
    // Simulate Instagram API validation
    if (!credentials.accessToken) {
      throw new Error('Invalid Instagram credentials');
    }

    return {
      accountId: credentials.userId || 'instagram_user_123',
      accountName: credentials.username || 'InstagramUser',
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt ? new Date(credentials.expiresAt) : undefined
    };
  }

  private async refreshTokenIfNeeded(connection: SocialPlatformConnection): Promise<void> {
    if (!connection.tokenExpiresAt || new Date() < connection.tokenExpiresAt) {
      return; // Token is still valid
    }

    // Platform-specific token refresh logic
    const newCredentials = await this.refreshPlatformToken(connection);
    
    await storage.updateSocialConnection(connection.id, {
      accessToken: newCredentials.accessToken,
      refreshToken: newCredentials.refreshToken,
      tokenExpiresAt: newCredentials.expiresAt
    });
  }

  private async refreshPlatformToken(connection: SocialPlatformConnection): Promise<any> {
    // Platform-specific token refresh implementation
    switch (connection.platform) {
      case 'twitter':
        return await this.refreshTwitterToken(connection);
      case 'linkedin':
        return await this.refreshLinkedInToken(connection);
      default:
        throw new Error(`Token refresh not implemented for ${connection.platform}`);
    }
  }

  private async refreshTwitterToken(connection: SocialPlatformConnection): Promise<any> {
    // Simulate Twitter token refresh
    return {
      accessToken: 'new_twitter_token_' + Date.now(),
      refreshToken: connection.refreshToken,
      expiresAt: new Date(Date.now() + 7200000) // 2 hours
    };
  }

  private async refreshLinkedInToken(connection: SocialPlatformConnection): Promise<any> {
    // Simulate LinkedIn token refresh
    return {
      accessToken: 'new_linkedin_token_' + Date.now(),
      refreshToken: connection.refreshToken,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    };
  }

  private async adaptContentForPlatform(content: any, platform: string): Promise<ContentAdaptation> {
    // Platform-specific content adaptation
    switch (platform) {
      case 'twitter':
        return this.adaptForTwitter(content);
      case 'linkedin':
        return this.adaptForLinkedIn(content);
      case 'facebook':
        return this.adaptForFacebook(content);
      case 'instagram':
        return this.adaptForInstagram(content);
      default:
        return {
          platform,
          title: content.title,
          content: content.content,
          hashtags: content.targetKeywords || [],
          mediaUrls: []
        };
    }
  }

  private adaptForTwitter(content: any): ContentAdaptation {
    const maxLength = 280;
    let tweetContent = content.title;
    
    if (tweetContent.length > maxLength - 50) {
      tweetContent = tweetContent.substring(0, maxLength - 50) + '...';
    }

    return {
      platform: 'twitter',
      title: content.title,
      content: tweetContent,
      hashtags: (content.targetKeywords || []).slice(0, 3),
      mediaUrls: [],
      callToAction: 'Check out the full article!'
    };
  }

  private adaptForLinkedIn(content: any): ContentAdaptation {
    return {
      platform: 'linkedin',
      title: content.title,
      content: content.content.substring(0, 1300), // LinkedIn character limit
      hashtags: (content.targetKeywords || []).slice(0, 5),
      mediaUrls: [],
      callToAction: 'Read more and share your thoughts!'
    };
  }

  private adaptForFacebook(content: any): ContentAdaptation {
    return {
      platform: 'facebook',
      title: content.title,
      content: content.content.substring(0, 2000),
      hashtags: (content.targetKeywords || []).slice(0, 10),
      mediaUrls: [],
      callToAction: 'Like and share if you found this helpful!'
    };
  }

  private adaptForInstagram(content: any): ContentAdaptation {
    return {
      platform: 'instagram',
      title: content.title,
      content: content.content.substring(0, 2200), // Instagram caption limit
      hashtags: (content.targetKeywords || []).slice(0, 30),
      mediaUrls: [],
      callToAction: 'Double tap if you agree! 💯'
    };
  }

  private async publishToPlatform(connection: SocialPlatformConnection, adaptedContent: ContentAdaptation, target: PublishingTarget): Promise<any> {
    // Platform-specific publishing logic
    switch (connection.platform) {
      case 'twitter':
        return await this.publishToTwitter(connection, adaptedContent);
      case 'linkedin':
        return await this.publishToLinkedIn(connection, adaptedContent);
      case 'facebook':
        return await this.publishToFacebook(connection, adaptedContent);
      case 'instagram':
        return await this.publishToInstagram(connection, adaptedContent);
      default:
        throw new Error(`Publishing not implemented for ${connection.platform}`);
    }
  }

  private async publishToTwitter(connection: SocialPlatformConnection, content: ContentAdaptation): Promise<any> {
    // Simulate Twitter API publishing
    const postId = 'tweet_' + Date.now();
    return {
      postId,
      url: `https://twitter.com/${connection.accountName}/status/${postId}`,
      publishedAt: new Date()
    };
  }

  private async publishToLinkedIn(connection: SocialPlatformConnection, content: ContentAdaptation): Promise<any> {
    // Simulate LinkedIn API publishing
    const postId = 'linkedin_post_' + Date.now();
    return {
      postId,
      url: `https://linkedin.com/posts/activity-${postId}`,
      publishedAt: new Date()
    };
  }

  private async publishToFacebook(connection: SocialPlatformConnection, content: ContentAdaptation): Promise<any> {
    // Simulate Facebook API publishing
    const postId = 'facebook_post_' + Date.now();
    return {
      postId,
      url: `https://facebook.com/${connection.accountId}/posts/${postId}`,
      publishedAt: new Date()
    };
  }

  private async publishToInstagram(connection: SocialPlatformConnection, content: ContentAdaptation): Promise<any> {
    // Simulate Instagram API publishing
    const postId = 'instagram_post_' + Date.now();
    return {
      postId,
      url: `https://instagram.com/p/${postId}`,
      publishedAt: new Date()
    };
  }

  private async trackPublication(userId: number, contentId: number, platform: string, result: any): Promise<void> {
    await storage.createPublicationHistory({
      userId,
      contentId,
      platform,
      postId: result.postId,
      url: result.url,
      publishedAt: result.publishedAt,
      status: 'published'
    });
  }

  private async fetchPlatformMetrics(connection: SocialPlatformConnection): Promise<any> {
    // Platform-specific metrics fetching
    switch (connection.platform) {
      case 'twitter':
        return { followers: 1250, posts: 89, engagement: 156 };
      case 'linkedin':
        return { followers: 890, posts: 45, engagement: 234 };
      case 'facebook':
        return { followers: 2100, posts: 67, engagement: 445 };
      case 'instagram':
        return { followers: 3400, posts: 123, engagement: 567 };
      default:
        return { followers: 0, posts: 0, engagement: 0 };
    }
  }

  private async updateSocialMetrics(userId: number, platform: string, metrics: any): Promise<void> {
    await storage.updateSocialMetrics(userId, platform, {
      followers: metrics.followers,
      posts: metrics.posts,
      engagement: metrics.engagement,
      lastUpdated: new Date()
    });
  }
}