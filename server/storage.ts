import { users, sites, content, analytics, usage, affiliatePrograms, products, productResearchSessions, seoAnalyses, comparisonTables, contentPerformance, affiliateClicks, seoRankings, revenueTracking, platformConnections, scheduledPublications, publicationHistory, engagementMetrics, type User, type InsertUser, type Site, type InsertSite, type Content, type InsertContent, type Analytics, type InsertAnalytics, type Usage, type InsertUsage, type AffiliateProgram, type InsertAffiliateProgram, type Product, type InsertProduct, type ProductResearchSession, type InsertProductResearchSession, type SeoAnalysis, type InsertSeoAnalysis, type ComparisonTable, type InsertComparisonTable, type ContentPerformance, type InsertContentPerformance, type AffiliateClick, type InsertAffiliateClick, type SeoRanking, type InsertSeoRanking, type RevenueTracking, type InsertRevenueTracking } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

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

  // Product research
  getProduct(id: number): Promise<Product | undefined>;
  getUserProducts(userId: number, niche?: string, category?: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  createProducts(products: InsertProduct[]): Promise<Product[]>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  searchProducts(userId: number, filters: { niche?: string; category?: string; minScore?: number; limit?: number }): Promise<Product[]>;

  // Product research sessions
  getProductResearchSession(id: number): Promise<ProductResearchSession | undefined>;
  getUserResearchSessions(userId: number): Promise<ProductResearchSession[]>;
  createProductResearchSession(session: InsertProductResearchSession): Promise<ProductResearchSession>;
  updateProductResearchSession(id: number, updates: Partial<ProductResearchSession>): Promise<ProductResearchSession>;
  
  // SEO analysis operations
  getSeoAnalysis(id: number): Promise<SeoAnalysis | undefined>;
  getUserSeoAnalyses(userId: number): Promise<SeoAnalysis[]>;
  createSeoAnalysis(analysis: InsertSeoAnalysis): Promise<SeoAnalysis>;
  findSeoAnalysisByKeyword(userId: number, keyword: string, region?: string): Promise<SeoAnalysis | undefined>;

  // Comparison table operations
  getComparisonTable(id: number): Promise<ComparisonTable | undefined>;
  getUserComparisonTables(userId: number): Promise<ComparisonTable[]>;
  createComparisonTable(table: InsertComparisonTable): Promise<ComparisonTable>;
  updateComparisonTable(id: number, updates: Partial<ComparisonTable>): Promise<ComparisonTable>;
  deleteComparisonTable(id: number): Promise<void>;

  // Advanced Analytics operations
  getContentPerformanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ContentPerformance[]>;
  getContentPerformanceById(contentId: number, startDate: Date, endDate: Date): Promise<ContentPerformance[]>;
  getAffiliateClicksByDateRange(userId: number, startDate: Date, endDate: Date): Promise<AffiliateClick[]>;
  getRevenueByDateRange(userId: number, startDate: Date, endDate: Date): Promise<RevenueTracking[]>;
  getLatestSeoRankings(userId: number): Promise<SeoRanking[]>;
  getSeoRankingsByKeyword(userId: number, keyword: string, startDate: Date, endDate: Date): Promise<SeoRanking[]>;
  getSeoRankingsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<SeoRanking[]>;
  createContentPerformance(performance: InsertContentPerformance): Promise<ContentPerformance>;
  createAffiliateClick(click: InsertAffiliateClick): Promise<AffiliateClick>;
  createSeoRanking(ranking: InsertSeoRanking): Promise<SeoRanking>;
  createRevenueTracking(revenue: InsertRevenueTracking): Promise<RevenueTracking>;

  // Platform Connections operations
  getPlatformConnection(id: number): Promise<any>;
  getUserPlatformConnections(userId: number): Promise<any[]>;
  createPlatformConnection(connection: any): Promise<any>;
  updatePlatformConnection(id: number, updates: Partial<any>): Promise<any>;
  deletePlatformConnection(id: number): Promise<void>;

  // Scheduled Publications operations
  getScheduledPublication(id: number): Promise<any>;
  getUserScheduledPublications(userId: number): Promise<any[]>;
  createScheduledPublication(publication: any): Promise<any>;
  updateScheduledPublication(id: number, updates: Partial<any>): Promise<any>;
  cancelScheduledPublication(id: number): Promise<void>;

  // Publication History operations
  getUserPublicationHistory(userId: number): Promise<any[]>;
  createPublicationHistory(history: any): Promise<any>;
  getContentPublicationHistory(contentId: number): Promise<any[]>;

  // Engagement Metrics operations
  createEngagementMetrics(metrics: any): Promise<any>;
  getContentEngagementMetrics(contentId: number, startDate: Date, endDate: Date): Promise<any[]>;
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
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
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
    const analytics: Analytics = { 
      ...insertAnalytics, 
      id,
      contentId: insertAnalytics.contentId || null,
      metadata: insertAnalytics.metadata || {}
    };
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
      existing.count = insertUsage.count || 0;
      this.usage.set(existing.id, existing);
      return existing;
    }

    const id = this.currentUsageId++;
    const now = new Date();
    const usage: Usage = { 
      ...insertUsage, 
      id, 
      createdAt: now,
      count: insertUsage.count || 0
    };
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

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        stripeCustomerId,
        ...(stripeSubscriptionId && { stripeSubscriptionId })
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSubscription(id: number, status: string, tier: string, periodStart?: Date, periodEnd?: Date): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        subscriptionStatus: status,
        subscriptionTier: tier,
        ...(periodStart && { currentPeriodStart: periodStart }),
        ...(periodEnd && { currentPeriodEnd: periodEnd })
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Site management
  async getSite(id: number): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site;
  }

  async getUserSites(userId: number): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt));
  }

  async createSite(siteData: InsertSite): Promise<Site> {
    const [site] = await db.insert(sites).values(siteData).returning();
    return site;
  }

  async updateSite(id: number, updates: Partial<Site>): Promise<Site> {
    const [site] = await db.update(sites).set(updates).where(eq(sites.id, id)).returning();
    return site;
  }

  async deleteSite(id: number): Promise<void> {
    await db.delete(sites).where(eq(sites.id, id));
  }

  // Content management
  async getContent(id: number): Promise<Content | undefined> {
    const [contentItem] = await db.select().from(content).where(eq(content.id, id));
    return contentItem;
  }

  async getSiteContent(siteId: number): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.siteId, siteId)).orderBy(desc(content.createdAt));
  }

  async getUserContent(userId: number): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.userId, userId)).orderBy(desc(content.createdAt));
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const [contentItem] = await db.insert(content).values(contentData).returning();
    return contentItem;
  }

  async updateContent(id: number, updates: Partial<Content>): Promise<Content> {
    const [contentItem] = await db.update(content).set(updates).where(eq(content.id, id)).returning();
    return contentItem;
  }

  async deleteContent(id: number): Promise<void> {
    await db.delete(content).where(eq(content.id, id));
  }

  // Analytics
  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [analyticsItem] = await db.insert(analytics).values(analyticsData).returning();
    return analyticsItem;
  }

  async getSiteAnalytics(siteId: number, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .where(and(
        eq(analytics.siteId, siteId),
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
      ))
      .orderBy(desc(analytics.date));
  }

  async getUserAnalytics(userId: number, startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .where(and(
        eq(analytics.userId, userId),
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
      ))
      .orderBy(desc(analytics.date));
  }

  // Usage tracking
  async getUsage(userId: number, feature: string, periodStart: Date, periodEnd: Date): Promise<Usage | undefined> {
    const [usageItem] = await db.select().from(usage)
      .where(and(
        eq(usage.userId, userId),
        eq(usage.feature, feature),
        gte(usage.periodStart, periodStart),
        lte(usage.periodEnd, periodEnd)
      ));
    return usageItem;
  }

  async createOrUpdateUsage(usageData: InsertUsage): Promise<Usage> {
    const existing = await this.getUsage(
      usageData.userId, 
      usageData.feature, 
      usageData.periodStart, 
      usageData.periodEnd
    );

    if (existing) {
      const [updated] = await db.update(usage)
        .set({ count: existing.count + usageData.count })
        .where(eq(usage.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(usage).values(usageData).returning();
      return created;
    }
  }

  async getUserCurrentUsage(userId: number): Promise<Usage[]> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    return await db.select().from(usage)
      .where(and(
        eq(usage.userId, userId),
        gte(usage.periodStart, currentMonth)
      ));
  }

  // Affiliate programs
  async getUserAffiliatePrograms(userId: number): Promise<AffiliateProgram[]> {
    return await db.select().from(affiliatePrograms)
      .where(eq(affiliatePrograms.userId, userId))
      .orderBy(desc(affiliatePrograms.createdAt));
  }

  async createAffiliateProgram(programData: InsertAffiliateProgram): Promise<AffiliateProgram> {
    const [program] = await db.insert(affiliatePrograms).values(programData).returning();
    return program;
  }

  async updateAffiliateProgram(id: number, updates: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const [program] = await db.update(affiliatePrograms).set(updates).where(eq(affiliatePrograms.id, id)).returning();
    return program;
  }

  async deleteAffiliateProgram(id: number): Promise<void> {
    await db.delete(affiliatePrograms).where(eq(affiliatePrograms.id, id));
  }

  // Product research methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getUserProducts(userId: number, niche?: string, category?: string): Promise<Product[]> {
    let conditions = [eq(products.userId, userId)];
    
    if (niche) {
      conditions.push(eq(products.niche, niche));
    }
    
    if (category) {
      conditions.push(eq(products.category, category));
    }
    
    return await db.select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.researchScore));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async createProducts(productsData: InsertProduct[]): Promise<Product[]> {
    const createdProducts = await db.insert(products).values(productsData).returning();
    return createdProducts;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(userId: number, filters: { niche?: string; category?: string; minScore?: number; limit?: number }): Promise<Product[]> {
    let conditions = [eq(products.userId, userId)];
    
    if (filters.niche) {
      conditions.push(eq(products.niche, filters.niche));
    }
    
    if (filters.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters.minScore) {
      conditions.push(gte(products.researchScore, filters.minScore.toString()));
    }
    
    return await db.select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.researchScore))
      .limit(filters.limit || 50);
  }

  // Product research session methods
  async getProductResearchSession(id: number): Promise<ProductResearchSession | undefined> {
    const [session] = await db.select().from(productResearchSessions).where(eq(productResearchSessions.id, id));
    return session;
  }

  async getUserResearchSessions(userId: number): Promise<ProductResearchSession[]> {
    return await db
      .select()
      .from(productResearchSessions)
      .where(eq(productResearchSessions.userId, userId))
      .orderBy(desc(productResearchSessions.createdAt));
  }

  async createProductResearchSession(sessionData: InsertProductResearchSession): Promise<ProductResearchSession> {
    const [session] = await db.insert(productResearchSessions).values(sessionData).returning();
    return session;
  }

  async updateProductResearchSession(id: number, updates: Partial<ProductResearchSession>): Promise<ProductResearchSession> {
    const [session] = await db
      .update(productResearchSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productResearchSessions.id, id))
      .returning();
    return session;
  }

  // SEO analysis methods
  async getSeoAnalysis(id: number): Promise<SeoAnalysis | undefined> {
    const [analysis] = await db.select().from(seoAnalyses).where(eq(seoAnalyses.id, id));
    return analysis;
  }

  async getUserSeoAnalyses(userId: number): Promise<SeoAnalysis[]> {
    return await db
      .select()
      .from(seoAnalyses)
      .where(eq(seoAnalyses.userId, userId))
      .orderBy(desc(seoAnalyses.createdAt));
  }

  async createSeoAnalysis(analysisData: InsertSeoAnalysis): Promise<SeoAnalysis> {
    const [analysis] = await db.insert(seoAnalyses).values(analysisData).returning();
    return analysis;
  }

  async findSeoAnalysisByKeyword(userId: number, keyword: string, region?: string): Promise<SeoAnalysis | undefined> {
    let conditions = [eq(seoAnalyses.userId, userId), eq(seoAnalyses.keyword, keyword)];
    
    if (region) {
      conditions.push(eq(seoAnalyses.targetRegion, region));
    }
    
    const [analysis] = await db
      .select()
      .from(seoAnalyses)
      .where(and(...conditions))
      .orderBy(desc(seoAnalyses.createdAt))
      .limit(1);
    
    return analysis;
  }

  // Comparison table operations
  async getComparisonTable(id: number): Promise<ComparisonTable | undefined> {
    const [table] = await db.select().from(comparisonTables).where(eq(comparisonTables.id, id));
    return table;
  }

  async getUserComparisonTables(userId: number): Promise<ComparisonTable[]> {
    return await db.select().from(comparisonTables).where(eq(comparisonTables.userId, userId));
  }

  async createComparisonTable(tableData: InsertComparisonTable): Promise<ComparisonTable> {
    const [table] = await db.insert(comparisonTables).values(tableData).returning();
    return table;
  }

  async updateComparisonTable(id: number, updates: Partial<ComparisonTable>): Promise<ComparisonTable> {
    const [table] = await db
      .update(comparisonTables)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(comparisonTables.id, id))
      .returning();
    return table;
  }

  async deleteComparisonTable(id: number): Promise<void> {
    await db.delete(comparisonTables).where(eq(comparisonTables.id, id));
  }

  // Advanced Analytics operations
  async getContentPerformanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ContentPerformance[]> {
    return await db
      .select()
      .from(contentPerformance)
      .where(
        and(
          eq(contentPerformance.userId, userId),
          gte(contentPerformance.date, startDate),
          lte(contentPerformance.date, endDate)
        )
      )
      .orderBy(desc(contentPerformance.date));
  }

  async getContentPerformanceById(contentId: number, startDate: Date, endDate: Date): Promise<ContentPerformance[]> {
    return await db
      .select()
      .from(contentPerformance)
      .where(
        and(
          eq(contentPerformance.contentId, contentId),
          gte(contentPerformance.date, startDate),
          lte(contentPerformance.date, endDate)
        )
      )
      .orderBy(desc(contentPerformance.date));
  }

  async getAffiliateClicksByDateRange(userId: number, startDate: Date, endDate: Date): Promise<AffiliateClick[]> {
    return await db
      .select()
      .from(affiliateClicks)
      .where(
        and(
          eq(affiliateClicks.userId, userId),
          gte(affiliateClicks.createdAt, startDate),
          lte(affiliateClicks.createdAt, endDate)
        )
      )
      .orderBy(desc(affiliateClicks.createdAt));
  }

  async getRevenueByDateRange(userId: number, startDate: Date, endDate: Date): Promise<RevenueTracking[]> {
    return await db
      .select()
      .from(revenueTracking)
      .where(
        and(
          eq(revenueTracking.userId, userId),
          gte(revenueTracking.transactionDate, startDate),
          lte(revenueTracking.transactionDate, endDate)
        )
      )
      .orderBy(desc(revenueTracking.transactionDate));
  }

  async getLatestSeoRankings(userId: number): Promise<SeoRanking[]> {
    return await db
      .select()
      .from(seoRankings)
      .where(eq(seoRankings.userId, userId))
      .orderBy(desc(seoRankings.date))
      .limit(100);
  }

  async getSeoRankingsByKeyword(userId: number, keyword: string, startDate: Date, endDate: Date): Promise<SeoRanking[]> {
    return await db
      .select()
      .from(seoRankings)
      .where(
        and(
          eq(seoRankings.userId, userId),
          eq(seoRankings.keyword, keyword),
          gte(seoRankings.date, startDate),
          lte(seoRankings.date, endDate)
        )
      )
      .orderBy(desc(seoRankings.date));
  }

  async getSeoRankingsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<SeoRanking[]> {
    return await db
      .select()
      .from(seoRankings)
      .where(
        and(
          eq(seoRankings.userId, userId),
          gte(seoRankings.date, startDate),
          lte(seoRankings.date, endDate)
        )
      )
      .orderBy(desc(seoRankings.date));
  }

  async createContentPerformance(performance: InsertContentPerformance): Promise<ContentPerformance> {
    const [created] = await db.insert(contentPerformance).values(performance).returning();
    return created;
  }

  async createAffiliateClick(click: InsertAffiliateClick): Promise<AffiliateClick> {
    const [created] = await db.insert(affiliateClicks).values(click).returning();
    return created;
  }

  async createSeoRanking(ranking: InsertSeoRanking): Promise<SeoRanking> {
    const [created] = await db.insert(seoRankings).values(ranking).returning();
    return created;
  }

  async createRevenueTracking(revenue: InsertRevenueTracking): Promise<RevenueTracking> {
    const [created] = await db.insert(revenueTracking).values(revenue).returning();
    return created;
  }

  // Platform Connections operations
  async getPlatformConnection(id: number): Promise<any> {
    const [connection] = await db.select().from(platformConnections).where(eq(platformConnections.id, id));
    return connection;
  }

  async getUserPlatformConnections(userId: number): Promise<any[]> {
    return await db.select().from(platformConnections)
      .where(eq(platformConnections.userId, userId))
      .orderBy(desc(platformConnections.createdAt));
  }

  async createPlatformConnection(connection: any): Promise<any> {
    const [created] = await db.insert(platformConnections).values({
      ...connection,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updatePlatformConnection(id: number, updates: Partial<any>): Promise<any> {
    const [updated] = await db
      .update(platformConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformConnections.id, id))
      .returning();
    return updated;
  }

  async deletePlatformConnection(id: number): Promise<void> {
    await db.delete(platformConnections).where(eq(platformConnections.id, id));
  }

  // Scheduled Publications operations
  async getScheduledPublication(id: number): Promise<any> {
    const [publication] = await db.select().from(scheduledPublications).where(eq(scheduledPublications.id, id));
    return publication;
  }

  async getUserScheduledPublications(userId: number): Promise<any[]> {
    return await db.select().from(scheduledPublications)
      .where(eq(scheduledPublications.userId, userId))
      .orderBy(scheduledPublications.scheduledAt);
  }

  async createScheduledPublication(publication: any): Promise<any> {
    const [created] = await db.insert(scheduledPublications).values({
      ...publication,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateScheduledPublication(id: number, updates: Partial<any>): Promise<any> {
    const [updated] = await db
      .update(scheduledPublications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduledPublications.id, id))
      .returning();
    return updated;
  }

  async cancelScheduledPublication(id: number): Promise<void> {
    await db
      .update(scheduledPublications)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(scheduledPublications.id, id));
  }

  // Publication History operations
  async getUserPublicationHistory(userId: number): Promise<any[]> {
    return await db.select().from(publicationHistory)
      .where(eq(publicationHistory.userId, userId))
      .orderBy(desc(publicationHistory.publishedAt));
  }

  async createPublicationHistory(history: any): Promise<any> {
    const [created] = await db.insert(publicationHistory).values({
      ...history,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async getContentPublicationHistory(contentId: number): Promise<any[]> {
    return await db.select().from(publicationHistory)
      .where(eq(publicationHistory.contentId, contentId))
      .orderBy(desc(publicationHistory.publishedAt));
  }

  // Engagement Metrics operations
  async createEngagementMetrics(metrics: any): Promise<any> {
    const [created] = await db.insert(engagementMetrics).values({
      ...metrics,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async getContentEngagementMetrics(contentId: number, startDate: Date, endDate: Date): Promise<any[]> {
    return await db.select().from(engagementMetrics)
      .where(
        and(
          eq(engagementMetrics.contentId, contentId),
          gte(engagementMetrics.date, startDate),
          lte(engagementMetrics.date, endDate)
        )
      )
      .orderBy(desc(engagementMetrics.date));
  }
}

export const storage = new DatabaseStorage();
