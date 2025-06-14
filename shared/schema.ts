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
  siteId: integer("site_id").notNull().references(() => sites.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // blog_post, product_review, comparison, buying_guide
  status: text("status").notNull().default("draft"), // draft, published, scheduled
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  targetKeywords: text("target_keywords").array(),
  affiliateLinks: jsonb("affiliate_links"), // Array of affiliate link objects
  seoAnalysisId: integer("seo_analysis_id").references(() => seoAnalyses.id),
  publishedAt: timestamp("published_at"),
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
  createdAt: true,
  updatedAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
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

export const insertSeoAnalysisSchema = createInsertSchema(seoAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    sites: 1,
    contentPerMonth: 5,
    apiCallsPerMonth: 100,
    features: ['content_generation', 'basic_content_generation'],
  },
  basic: {
    sites: 3,
    contentPerMonth: 25,
    apiCallsPerMonth: 1000,
    features: ['content_generation', 'basic_content_generation', 'seo_optimization', 'affiliate_links'],
  },
  pro: {
    sites: 10,
    contentPerMonth: 100,
    apiCallsPerMonth: 5000,
    features: ['content_generation', 'advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice'],
  },
  agency: {
    sites: -1, // unlimited
    contentPerMonth: 500,
    apiCallsPerMonth: 25000,
    features: ['content_generation', 'advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support'],
  },
} as const;
