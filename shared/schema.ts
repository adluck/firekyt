import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
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
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    sites: 1,
    contentPerMonth: 5,
    apiCallsPerMonth: 100,
    features: ['basic_content_generation'],
  },
  basic: {
    sites: 3,
    contentPerMonth: 25,
    apiCallsPerMonth: 1000,
    features: ['basic_content_generation', 'seo_optimization', 'affiliate_links'],
  },
  pro: {
    sites: 10,
    contentPerMonth: 100,
    apiCallsPerMonth: 5000,
    features: ['advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice'],
  },
  agency: {
    sites: -1, // unlimited
    contentPerMonth: 500,
    apiCallsPerMonth: 25000,
    features: ['advanced_content_generation', 'seo_optimization', 'affiliate_links', 'analytics', 'brand_voice', 'white_label', 'priority_support'],
  },
} as const;
