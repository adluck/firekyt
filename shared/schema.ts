import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with authentication and subscription info
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("free"), // free, basic, pro, agency
  isActive: boolean("is_active").notNull().default(true),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // active, inactive, canceled, past_due
  subscriptionTier: text("subscription_tier").default("free"), // free, basic, pro, agency
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Affiliate sites managed by users
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  domain: text("domain"),
  description: text("description"),
  niche: text("niche"),
  targetKeywords: text("target_keywords").array(),
  brandVoice: text("brand_voice"), // casual, professional, friendly, authoritative
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Generated content pieces
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  siteId: integer("site_id").references(() => sites.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // blog_post, product_review, comparison, buying_guide
  status: text("status").notNull().default("draft"), // draft, published, scheduled
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  targetKeywords: text("target_keywords").array(),
  affiliateLinks: jsonb("affiliate_links"), // Array of affiliate link objects
  seoAnalysisId: integer("seo_analysis_id").references(() => seoAnalyses.id),
  // Rich text editor content
  richContent: jsonb("rich_content"), // Rich text editor content structure
  comparisonTables: jsonb("comparison_tables"), // Comparison table configurations
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Comparison tables for product comparisons
export const comparisonTables = pgTable("comparison_tables", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentId: integer("content_id").references(() => content.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Table structure and configuration
  columns: jsonb("columns").notNull(), // Column definitions with properties, data types, etc.
  rows: jsonb("rows").notNull(), // Product IDs and custom data
  styling: jsonb("styling"), // Visual styling options
  settings: jsonb("settings"), // Display settings, sorting, filtering options
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SEO analysis data
export const seoAnalyses = pgTable("seo_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  targetRegion: varchar("target_region", { length: 10 }).default("US"),
  searchVolume: integer("search_volume"),
  keywordDifficulty: integer("keyword_difficulty"),
  competitionLevel: varchar("competition_level", { length: 20 }),
  cpcEstimate: varchar("cpc_estimate", { length: 20 }),
  topCompetitors: jsonb("top_competitors"),
  suggestedTitles: text("suggested_titles").array(),
  suggestedDescriptions: text("suggested_descriptions").array(),
  suggestedHeaders: text("suggested_headers").array(),
  relatedKeywords: text("related_keywords").array(),
  serpFeatures: text("serp_features").array(),
  trendsData: jsonb("trends_data"),
  apiSource: varchar("api_source", { length: 50 }),
  analysisDate: timestamp("analysis_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics and performance tracking
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  contentId: integer("content_id").references(() => content.id),
  metric: text("metric").notNull(), // views, clicks, conversions, revenue
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata"), // Additional data like traffic source, device type, etc.
});

// Content performance tracking
export const contentPerformance = pgTable("content_performance", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => content.id),
  userId: integer("user_id").notNull().references(() => users.id),
  views: integer("views").default(0),
  uniqueViews: integer("unique_views").default(0),
  clicks: integer("clicks").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }),
  avgTimeOnPage: decimal("avg_time_on_page", { precision: 8, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Affiliate link tracking
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentId: integer("content_id").references(() => content.id),
  affiliateUrl: text("affiliate_url").notNull(),
  productId: integer("product_id").references(() => products.id),
  clicked: boolean("clicked").default(false),
  converted: boolean("converted").default(false),
  commissionEarned: decimal("commission_earned", { precision: 10, scale: 2 }),
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SEO rankings tracking
export const seoRankings = pgTable("seo_rankings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentId: integer("content_id").references(() => content.id),
  keyword: text("keyword").notNull(),
  position: integer("position"),
  previousPosition: integer("previous_position"),
  searchEngine: text("search_engine").default("google"),
  country: text("country").default("US"),
  device: text("device").default("desktop"), // desktop, mobile
  url: text("url"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue and commission tracking
export const revenueTracking = pgTable("revenue_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentId: integer("content_id").references(() => content.id),
  affiliateClickId: integer("affiliate_click_id").references(() => affiliateClicks.id),
  transactionId: text("transaction_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  status: text("status").default("pending"), // pending, confirmed, paid, cancelled
  transactionDate: timestamp("transaction_date").notNull(),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking for subscription limits
export const usage = pgTable("usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  feature: text("feature").notNull(), // content_generation, site_creation, api_calls
  count: integer("count").notNull().default(0),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Affiliate programs and networks
export const affiliatePrograms = pgTable("affiliate_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  network: text("network"), // amazon, shareasale, cj, etc.
  apiKey: text("api_key"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Platform integrations table
export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // wordpress, medium, shopify, linkedin, pinterest, instagram
  platformUserId: text("platform_user_id"),
  platformUsername: text("platform_username"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").notNull().default(true),
  connectionData: jsonb("connection_data"), // platform-specific data
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Scheduled publications table
export const scheduledPublications = pgTable("scheduled_publications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  platformConnectionId: integer("platform_connection_id").notNull().references(() => platformConnections.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("pending"), // pending, published, failed, cancelled
  platformPostId: text("platform_post_id"),
  platformUrl: text("platform_url"),
  publishSettings: jsonb("publish_settings"), // platform-specific publishing options
  errorMessage: text("error_message"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Publication history table
export const publicationHistory = pgTable("publication_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  platformConnectionId: integer("platform_connection_id").notNull().references(() => platformConnections.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  platformPostId: text("platform_post_id"),
  platformUrl: text("platform_url"),
  status: text("status").notNull(), // published, updated, deleted, failed
  metrics: jsonb("metrics"), // views, likes, shares, comments, etc.
  publishedAt: timestamp("published_at").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Engagement tracking table
export const engagementMetrics = pgTable("engagement_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  platformConnectionId: integer("platform_connection_id").notNull().references(() => platformConnections.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  date: timestamp("date").notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  reach: integer("reach").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Intelligent Link Management Tables
export const linkCategories = pgTable("link_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const intelligentLinks = pgTable("intelligent_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => linkCategories.id, { onDelete: "set null" }),
  originalUrl: text("original_url").notNull(),
  shortenedUrl: text("shortened_url"),
  title: text("title").notNull(),
  description: text("description"),
  keywords: text("keywords").array(),
  targetKeywords: text("target_keywords").array(),
  contextRules: jsonb("context_rules"), // Rules for when to insert this link
  insertionStrategy: text("insertion_strategy").notNull().default("manual"), // manual, automatic, ai-suggested
  priority: integer("priority").notNull().default(50), // 1-100 priority for insertion
  isActive: boolean("is_active").notNull().default(true),
  affiliateData: jsonb("affiliate_data"), // Commission rates, tracking parameters
  performanceGoals: jsonb("performance_goals"), // CTR targets, conversion goals
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const linkInsertions = pgTable("link_insertions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  linkId: integer("link_id").notNull().references(() => intelligentLinks.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  insertionType: text("insertion_type").notNull(), // automatic, manual, ai-suggested
  insertionContext: text("insertion_context"), // paragraph, heading, sidebar, etc.
  anchorText: text("anchor_text").notNull(),
  position: integer("position"), // Character position in content
  isActive: boolean("is_active").notNull().default(true),
  performanceData: jsonb("performance_data"), // CTR, conversions, revenue
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const linkTracking = pgTable("link_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  linkId: integer("link_id").notNull().references(() => intelligentLinks.id, { onDelete: "cascade" }),
  insertionId: integer("insertion_id").references(() => linkInsertions.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // click, view, conversion
  eventData: jsonb("event_data"), // User agent, referrer, location, etc.
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Enhanced Site Management
export const siteConfigurations = pgTable("site_configurations", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  configType: text("config_type").notNull(), // analytics, seo, social, links
  configuration: jsonb("configuration").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const siteMetrics = pgTable("site_metrics", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }),
  avgSessionDuration: integer("avg_session_duration"), // in seconds
  organicTraffic: integer("organic_traffic").default(0),
  affiliateClicks: integer("affiliate_clicks").default(0),
  affiliateRevenue: decimal("affiliate_revenue", { precision: 10, scale: 2 }),
  linkPerformance: jsonb("link_performance"), // Detailed link metrics
  topPages: jsonb("top_pages"), // Most viewed pages
  topSources: jsonb("top_sources"), // Traffic sources
  conversionData: jsonb("conversion_data"), // Goal completions
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI-Powered Link Suggestions
export const linkSuggestions = pgTable("link_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").references(() => content.id, { onDelete: "cascade" }),
  siteId: integer("site_id").references(() => sites.id, { onDelete: "cascade" }),
  suggestedLinkId: integer("suggested_link_id").references(() => intelligentLinks.id, { onDelete: "cascade" }),
  suggestedAnchorText: text("suggested_anchor_text").notNull(),
  suggestedPosition: integer("suggested_position"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // AI confidence score
  reasoning: text("reasoning"), // Why this link was suggested
  contextMatch: jsonb("context_match"), // Matching keywords/topics
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Affiliate networks configuration
export const affiliateNetworks = pgTable("affiliate_networks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  networkKey: text("network_key").notNull(),
  networkName: text("network_name").notNull(),
  baseUrl: text("base_url").notNull(),
  trackingParam: text("tracking_param").notNull(),
  affiliateId: text("affiliate_id").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.0"),
  cookieDuration: integer("cookie_duration").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertUsageSchema = createInsertSchema(usage).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateProgramSchema = createInsertSchema(affiliatePrograms).omit({
  id: true,
  createdAt: true,
});

export const insertContentPerformanceSchema = createInsertSchema(contentPerformance).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({
  id: true,
  createdAt: true,
});

export const insertSeoRankingSchema = createInsertSchema(seoRankings).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueTrackingSchema = createInsertSchema(revenueTracking).omit({
  id: true,
  createdAt: true,
});

export const insertSeoAnalysisSchema = createInsertSchema(seoAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComparisonTableSchema = createInsertSchema(comparisonTables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduledPublicationSchema = createInsertSchema(scheduledPublications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPublicationHistorySchema = createInsertSchema(publicationHistory).omit({
  id: true,
  createdAt: true,
});

export const insertEngagementMetricsSchema = createInsertSchema(engagementMetrics).omit({
  id: true,
  createdAt: true,
});

// Product Research System Tables
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Basic product information
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  brand: varchar("brand", { length: 255 }),
  category: varchar("category", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 255 }).notNull(),
  
  // Pricing and commission data
  price: decimal("price", { precision: 10, scale: 2 }),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  
  // Product links and IDs
  productUrl: varchar("product_url", { length: 1000 }).notNull(),
  affiliateUrl: varchar("affiliate_url", { length: 1000 }),
  imageUrl: varchar("image_url", { length: 1000 }),
  asin: varchar("asin", { length: 20 }), // Amazon ASIN
  sku: varchar("sku", { length: 100 }),
  
  // Performance metrics
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count"),
  salesRank: integer("sales_rank"),
  trendingScore: decimal("trending_score", { precision: 5, scale: 2 }),
  competitionScore: decimal("competition_score", { precision: 5, scale: 2 }),
  
  // Research and scoring data
  researchScore: decimal("research_score", { precision: 5, scale: 2 }).notNull(),
  researchSessionId: integer("research_session_id"),
  keywords: text("keywords").array(),
  searchVolume: integer("search_volume"),
  difficulty: integer("difficulty"), // SEO difficulty score
  
  // API source information
  apiSource: varchar("api_source", { length: 50 }).notNull(), // 'amazon', 'cj', 'serp', etc.
  externalId: varchar("external_id", { length: 255 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Metadata
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productResearchSessions = pgTable("product_research_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Research parameters
  niche: varchar("niche", { length: 255 }).notNull(),
  productCategory: varchar("product_category", { length: 255 }),
  minCommissionRate: decimal("min_commission_rate", { precision: 5, scale: 2 }),
  minTrendingScore: decimal("min_trending_score", { precision: 5, scale: 2 }),
  maxResults: integer("max_results").default(50),
  
  // Research results
  totalProductsFound: integer("total_products_found"),
  productsStored: integer("products_stored"),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  topProductId: integer("top_product_id").references(() => products.id),
  
  // API usage tracking
  apiCallsMade: integer("api_calls_made"),
  apiSources: text("api_sources").array(),
  researchDuration: integer("research_duration_ms"),
  
  // Status and metadata
  status: varchar("status", { length: 50 }).default("completed"), // pending, completed, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductResearchSessionSchema = createInsertSchema(productResearchSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Link Management Insert Schemas
export const insertLinkCategorySchema = createInsertSchema(linkCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntelligentLinkSchema = createInsertSchema(intelligentLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLinkInsertionSchema = createInsertSchema(linkInsertions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLinkTrackingSchema = createInsertSchema(linkTracking).omit({
  id: true,
});

export const insertSiteConfigurationSchema = createInsertSchema(siteConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteMetricsSchema = createInsertSchema(siteMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertLinkSuggestionSchema = createInsertSchema(linkSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Usage = typeof usage.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;
export type AffiliateProgram = typeof affiliatePrograms.$inferSelect;
export type InsertAffiliateProgram = z.infer<typeof insertAffiliateProgramSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductResearchSession = typeof productResearchSessions.$inferSelect;
export type InsertProductResearchSession = z.infer<typeof insertProductResearchSessionSchema>;
export type SeoAnalysis = typeof seoAnalyses.$inferSelect;
export type InsertSeoAnalysis = z.infer<typeof insertSeoAnalysisSchema>;
export type ComparisonTable = typeof comparisonTables.$inferSelect;
export type InsertComparisonTable = z.infer<typeof insertComparisonTableSchema>;
export type ContentPerformance = typeof contentPerformance.$inferSelect;
export type InsertContentPerformance = z.infer<typeof insertContentPerformanceSchema>;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;
export type SeoRanking = typeof seoRankings.$inferSelect;
export type InsertSeoRanking = z.infer<typeof insertSeoRankingSchema>;
export type RevenueTracking = typeof revenueTracking.$inferSelect;
export type InsertRevenueTracking = z.infer<typeof insertRevenueTrackingSchema>;

// Link Management Types
export type LinkCategory = typeof linkCategories.$inferSelect;
export type InsertLinkCategory = z.infer<typeof insertLinkCategorySchema>;
export type IntelligentLink = typeof intelligentLinks.$inferSelect;
export type InsertIntelligentLink = z.infer<typeof insertIntelligentLinkSchema>;
export type LinkInsertion = typeof linkInsertions.$inferSelect;
export type InsertLinkInsertion = z.infer<typeof insertLinkInsertionSchema>;
export type LinkTracking = typeof linkTracking.$inferSelect;
export type InsertLinkTracking = z.infer<typeof insertLinkTrackingSchema>;
export type SiteConfiguration = typeof siteConfigurations.$inferSelect;
export type InsertSiteConfiguration = z.infer<typeof insertSiteConfigurationSchema>;
export type SiteMetrics = typeof siteMetrics.$inferSelect;
export type InsertSiteMetrics = z.infer<typeof insertSiteMetricsSchema>;
export type LinkSuggestion = typeof linkSuggestions.$inferSelect;
export type InsertLinkSuggestion = z.infer<typeof insertLinkSuggestionSchema>;

// Password reset token types
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    sites: 1,
    contentPerMonth: 5,
    apiCallsPerMonth: 100,
    features: ['content_generation', 'basic_content_generation', 'site_creation'],
  },
  basic: {
    sites: 3,
    contentPerMonth: 25,
    apiCallsPerMonth: 1000,
    features: ['content_generation', 'basic_content_generation', 'seo_optimization', 'affiliate_links', 'site_creation'],
  },
  pro: {
    sites: 10,
    contentPerMonth: 100,
    apiCallsPerMonth: 5000,
    features: ['content_generation', 'advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'site_creation'],
  },
  enterprise: {
    sites: -1, // unlimited
    contentPerMonth: 1000,
    apiCallsPerMonth: 100000,
    features: ['content_generation', 'advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support', 'site_creation', 'api_access'],
  },
  agency: {
    sites: -1, // unlimited
    contentPerMonth: 500,
    apiCallsPerMonth: 25000,
    features: ['content_generation', 'advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support', 'site_creation'],
  },
  admin: {
    sites: -1, // unlimited
    contentPerMonth: -1, // unlimited
    apiCallsPerMonth: -1, // unlimited
    features: ['content_generation', 'advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support', 'site_creation', 'api_access', 'admin_panel', 'user_management'],
  },
} as const;
