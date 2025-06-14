import { users, sites, content, analytics, usage, affiliatePrograms, type User, type InsertUser, type Site, type InsertSite, type Content, type InsertContent, type Analytics, type InsertAnalytics, type Usage, type InsertUsage, type AffiliateProgram, type InsertAffiliateProgram } from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserSubscription(id: number, status: string, tier: string, periodStart?: Date, periodEnd?: Date): Promise<User>;

  // Site management
  getSite(id: number): Promise<Site | undefined>;
  getUserSites(userId: number): Promise<Site[]>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, updates: Partial<Site>): Promise<Site>;
  deleteSite(id: number): Promise<void>;

  // Content management
  getContent(id: number): Promise<Content | undefined>;
  getSiteContent(siteId: number): Promise<Content[]>;
  getUserContent(userId: number): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, updates: Partial<Content>): Promise<Content>;
  deleteContent(id: number): Promise<void>;

  // Analytics
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getSiteAnalytics(siteId: number, startDate: Date, endDate: Date): Promise<Analytics[]>;
  getUserAnalytics(userId: number, startDate: Date, endDate: Date): Promise<Analytics[]>;

  // Usage tracking
  getUsage(userId: number, feature: string, periodStart: Date, periodEnd: Date): Promise<Usage | undefined>;
  createOrUpdateUsage(usage: InsertUsage): Promise<Usage>;
  getUserCurrentUsage(userId: number): Promise<Usage[]>;

  // Affiliate programs
  getUserAffiliatePrograms(userId: number): Promise<AffiliateProgram[]>;
  createAffiliateProgram(program: InsertAffiliateProgram): Promise<AffiliateProgram>;
  updateAffiliateProgram(id: number, updates: Partial<AffiliateProgram>): Promise<AffiliateProgram>;
  deleteAffiliateProgram(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sites: Map<number, Site>;
  private content: Map<number, Content>;
  private analytics: Map<number, Analytics>;
  private usage: Map<number, Usage>;
  private affiliatePrograms: Map<number, AffiliateProgram>;
  
  private currentUserId: number;
  private currentSiteId: number;
  private currentContentId: number;
  private currentAnalyticsId: number;
  private currentUsageId: number;
  private currentAffiliateProgramId: number;

  constructor() {
    this.users = new Map();
    this.sites = new Map();
    this.content = new Map();
    this.analytics = new Map();
    this.usage = new Map();
    this.affiliatePrograms = new Map();
    
    this.currentUserId = 1;
    this.currentSiteId = 1;
    this.currentContentId = 1;
    this.currentAnalyticsId = 1;
    this.currentUsageId = 1;
    this.currentAffiliateProgramId = 1;
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now, 
      updatedAt: now,
      isActive: true,
      role: "free",
      subscriptionStatus: "inactive",
      subscriptionTier: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    return this.updateUser(id, { 
      stripeCustomerId, 
      stripeSubscriptionId: stripeSubscriptionId || null 
    });
  }

  async updateUserSubscription(id: number, status: string, tier: string, periodStart?: Date, periodEnd?: Date): Promise<User> {
    return this.updateUser(id, {
      subscriptionStatus: status,
      subscriptionTier: tier,
      currentPeriodStart: periodStart || null,
      currentPeriodEnd: periodEnd || null,
    });
  }

  // Site management
  async getSite(id: number): Promise<Site | undefined> {
    return this.sites.get(id);
  }

  async getUserSites(userId: number): Promise<Site[]> {
    return Array.from(this.sites.values()).filter(site => site.userId === userId);
  }

  async createSite(insertSite: InsertSite): Promise<Site> {
    const id = this.currentSiteId++;
    const now = new Date();
    const site: Site = { 
      ...insertSite, 
      id, 
      createdAt: now, 
      updatedAt: now,
      isActive: true,
      domain: insertSite.domain || null,
      description: insertSite.description || null,
      niche: insertSite.niche || null,
      targetKeywords: insertSite.targetKeywords || null,
      brandVoice: insertSite.brandVoice || null,
    };
    this.sites.set(id, site);
    return site;
  }

  async updateSite(id: number, updates: Partial<Site>): Promise<Site> {
    const site = this.sites.get(id);
    if (!site) throw new Error("Site not found");
    
    const updatedSite = { ...site, ...updates, updatedAt: new Date() };
    this.sites.set(id, updatedSite);
    return updatedSite;
  }

  async deleteSite(id: number): Promise<void> {
    this.sites.delete(id);
  }

  // Content management
  async getContent(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async getSiteContent(siteId: number): Promise<Content[]> {
    return Array.from(this.content.values()).filter(content => content.siteId === siteId);
  }

  async getUserContent(userId: number): Promise<Content[]> {
    return Array.from(this.content.values()).filter(content => content.userId === userId);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.currentContentId++;
    const now = new Date();
    const content: Content = { 
      ...insertContent, 
      id, 
      createdAt: now, 
      updatedAt: now,
      status: insertContent.status || "draft",
      seoTitle: insertContent.seoTitle || null,
      seoDescription: insertContent.seoDescription || null,
      targetKeywords: insertContent.targetKeywords || null,
      affiliateLinks: insertContent.affiliateLinks || null,
      publishedAt: insertContent.publishedAt || null,
    };
    this.content.set(id, content);
    return content;
  }

  async updateContent(id: number, updates: Partial<Content>): Promise<Content> {
    const content = this.content.get(id);
    if (!content) throw new Error("Content not found");
    
    const updatedContent = { ...content, ...updates, updatedAt: new Date() };
    this.content.set(id, updatedContent);
    return updatedContent;
  }

  async deleteContent(id: number): Promise<void> {
    this.content.delete(id);
  }

  // Analytics
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = this.currentAnalyticsId++;
    const analytics: Analytics = { ...insertAnalytics, id };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async getSiteAnalytics(siteId: number, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values()).filter(
      analytics => analytics.siteId === siteId && 
      analytics.date >= startDate && 
      analytics.date <= endDate
    );
  }

  async getUserAnalytics(userId: number, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values()).filter(
      analytics => analytics.userId === userId && 
      analytics.date >= startDate && 
      analytics.date <= endDate
    );
  }

  // Usage tracking
  async getUsage(userId: number, feature: string, periodStart: Date, periodEnd: Date): Promise<Usage | undefined> {
    return Array.from(this.usage.values()).find(
      usage => usage.userId === userId && 
      usage.feature === feature &&
      usage.periodStart <= periodStart &&
      usage.periodEnd >= periodEnd
    );
  }

  async createOrUpdateUsage(insertUsage: InsertUsage): Promise<Usage> {
    const existing = await this.getUsage(
      insertUsage.userId, 
      insertUsage.feature, 
      insertUsage.periodStart, 
      insertUsage.periodEnd
    );

    if (existing) {
      existing.count = insertUsage.count;
      this.usage.set(existing.id, existing);
      return existing;
    }

    const id = this.currentUsageId++;
    const now = new Date();
    const usage: Usage = { ...insertUsage, id, createdAt: now };
    this.usage.set(id, usage);
    return usage;
  }

  async getUserCurrentUsage(userId: number): Promise<Usage[]> {
    const now = new Date();
    return Array.from(this.usage.values()).filter(
      usage => usage.userId === userId && 
      usage.periodStart <= now && 
      usage.periodEnd >= now
    );
  }

  // Affiliate programs
  async getUserAffiliatePrograms(userId: number): Promise<AffiliateProgram[]> {
    return Array.from(this.affiliatePrograms.values()).filter(
      program => program.userId === userId
    );
  }

  async createAffiliateProgram(insertProgram: InsertAffiliateProgram): Promise<AffiliateProgram> {
    const id = this.currentAffiliateProgramId++;
    const now = new Date();
    const program: AffiliateProgram = { 
      ...insertProgram, 
      id, 
      createdAt: now,
      isActive: insertProgram.isActive ?? true,
      network: insertProgram.network || null,
      apiKey: insertProgram.apiKey || null,
      commissionRate: insertProgram.commissionRate || null,
    };
    this.affiliatePrograms.set(id, program);
    return program;
  }

  async updateAffiliateProgram(id: number, updates: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const program = this.affiliatePrograms.get(id);
    if (!program) throw new Error("Affiliate program not found");
    
    const updatedProgram = { ...program, ...updates };
    this.affiliatePrograms.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteAffiliateProgram(id: number): Promise<void> {
    this.affiliatePrograms.delete(id);
  }
}

export const storage = new MemStorage();
