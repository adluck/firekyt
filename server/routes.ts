import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import { insertUserSchema, insertSiteSchema, insertContentSchema, SUBSCRIPTION_LIMITS, type User } from "@shared/schema";
import { 
  addToQueue, 
  getQueueStatus, 
  getAllQueueItems,
  type ContentGenerationRequest,
  type ContentGenerationResponse 
} from "./ai-engine";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

// Initialize Google Gemini AI
if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing required Gemini API key: GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Check subscription limits
const checkSubscriptionLimit = (feature: string) => {
  return async (req: any, res: any, next: any) => {
    const user = req.user;
    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS];
    
    if (!limits.features.includes(feature)) {
      return res.status(403).json({ 
        message: 'Feature not available in your subscription tier',
        requiredTier: 'Upgrade to access this feature'
      });
    }

    // Check usage limits for the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const usage = await storage.getUsage(user.id, feature, monthStart, monthEnd);
    
    if (feature === 'content_generation' && limits.contentPerMonth !== -1) {
      const currentUsage = usage?.count || 0;
      if (currentUsage >= limits.contentPerMonth) {
        return res.status(403).json({ 
          message: 'Monthly content generation limit reached',
          current: currentUsage,
          limit: limits.contentPerMonth
        });
      }
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.extend({
        email: z.string().email(),
        password: z.string().min(6),
        confirmPassword: z.string(),
      }).parse(req.body);

      if (validatedData.password !== validatedData.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const { confirmPassword, ...userData } = validatedData;
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  // Subscription routes
  app.post("/api/subscription/create", authenticateToken, async (req, res) => {
    try {
      const { priceId } = req.body;
      const user = req.user;

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(user.id, stripeCustomerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, stripeCustomerId, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/subscription/portal", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      
      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/dashboard`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe webhooks
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      return res.status(400).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await storage.getUserByEmail(
            (await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer).email!
          );
          
          if (user) {
            const tier = getTierFromPriceId(subscription.items.data[0].price.id);
            await storage.updateUserSubscription(
              user.id,
              subscription.status,
              tier,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000)
            );
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const user = await storage.getUserByEmail(
            (await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer).email!
          );
          
          if (user) {
            await storage.updateUserSubscription(user.id, 'canceled', 'free');
          }
          break;
        }
      }
    } catch (error) {
      console.error('Webhook handler failed:', error);
    }

    res.json({ received: true });
  });

  // Sites management
  app.get("/api/sites", authenticateToken, async (req, res) => {
    try {
      const sites = await storage.getUserSites(req.user.id);
      res.json(sites);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/sites", authenticateToken, checkSubscriptionLimit('site_creation'), async (req, res) => {
    try {
      const validatedData = insertSiteSchema.parse(req.body);
      
      // Check site limits
      const userSites = await storage.getUserSites(req.user.id);
      const limits = SUBSCRIPTION_LIMITS[req.user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS];
      
      if (limits.sites !== -1 && userSites.length >= limits.sites) {
        return res.status(403).json({ 
          message: 'Site limit reached for your subscription tier',
          current: userSites.length,
          limit: limits.sites
        });
      }
      
      const site = await storage.createSite({
        ...validatedData,
        userId: req.user.id,
      });
      
      res.status(201).json(site);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/sites/:id", authenticateToken, async (req, res) => {
    try {
      const site = await storage.getSite(parseInt(req.params.id));
      if (!site || site.userId !== req.user.id) {
        return res.status(404).json({ message: "Site not found" });
      }
      res.json(site);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/sites/:id", authenticateToken, async (req, res) => {
    try {
      const site = await storage.getSite(parseInt(req.params.id));
      if (!site || site.userId !== req.user.id) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      const validatedData = insertSiteSchema.partial().parse(req.body);
      const updatedSite = await storage.updateSite(site.id, validatedData);
      
      res.json(updatedSite);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/sites/:id", authenticateToken, async (req, res) => {
    try {
      const site = await storage.getSite(parseInt(req.params.id));
      if (!site || site.userId !== req.user.id) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      await storage.deleteSite(site.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Content management
  app.get("/api/content", authenticateToken, async (req, res) => {
    try {
      const { siteId } = req.query;
      let content;
      
      if (siteId) {
        const site = await storage.getSite(parseInt(siteId as string));
        if (!site || site.userId !== req.user.id) {
          return res.status(404).json({ message: "Site not found" });
        }
        content = await storage.getSiteContent(site.id);
      } else {
        content = await storage.getUserContent(req.user.id);
      }
      
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Advanced AI Content Generation Engine
  app.post("/api/content/generate", authenticateToken, checkSubscriptionLimit('content_generation'), async (req, res) => {
    try {
      const requestSchema = z.object({
        keyword: z.string().min(1, "Keyword is required"),
        content_type: z.enum(['blog_post', 'product_comparison', 'review_article', 'video_script', 'social_post', 'email_campaign']),
        tone_of_voice: z.string().min(1, "Tone of voice is required"),
        target_audience: z.string().min(1, "Target audience is required"),
        additional_context: z.string().optional(),
        brand_voice: z.string().optional(),
        seo_focus: z.boolean().optional().default(true),
        word_count: z.number().optional(),
        siteId: z.number().optional()
      });

      const validatedData = requestSchema.parse(req.body);
      
      // If siteId provided, verify ownership
      if (validatedData.siteId) {
        const site = await storage.getSite(validatedData.siteId);
        if (!site || site.userId !== req.user!.id) {
          return res.status(404).json({ message: "Site not found" });
        }
      }

      // Track usage
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const currentUsage = await storage.getUsage(req.user!.id, 'content_generation', monthStart, monthEnd);
      await storage.createOrUpdateUsage({
        userId: req.user!.id,
        feature: 'content_generation',
        count: (currentUsage?.count || 0) + 1,
        periodStart: monthStart,
        periodEnd: monthEnd,
      });

      // Create content generation request for AI engine
      const contentRequest: ContentGenerationRequest = {
        keyword: validatedData.keyword,
        content_type: validatedData.content_type,
        tone_of_voice: validatedData.tone_of_voice,
        target_audience: validatedData.target_audience,
        additional_context: validatedData.additional_context,
        brand_voice: validatedData.brand_voice,
        seo_focus: validatedData.seo_focus,
        word_count: validatedData.word_count
      };

      // Add to generation queue
      const contentId = addToQueue(contentRequest);

      res.status(202).json({
        content_id: contentId,
        status: 'pending',
        message: 'Content generation request queued successfully',
        estimated_completion: '30-60 seconds'
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Content Generation Queue Management
  app.get("/api/content/generate/:contentId", authenticateToken, async (req, res) => {
    try {
      const { contentId } = req.params;
      const status = getQueueStatus(contentId);
      
      if (!status) {
        return res.status(404).json({ message: "Content generation request not found" });
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/content/queue", authenticateToken, async (req, res) => {
    try {
      const queue = getAllQueueItems();
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Save completed content to database
  app.post("/api/content/save", authenticateToken, async (req, res) => {
    try {
      const saveSchema = z.object({
        content_id: z.string(),
        siteId: z.number().optional(),
        title: z.string().optional(),
        save_to_database: z.boolean().optional().default(true)
      });

      const { content_id, siteId, title, save_to_database } = saveSchema.parse(req.body);
      
      const contentResult = getQueueStatus(content_id);
      if (!contentResult || contentResult.status !== 'completed') {
        return res.status(400).json({ message: "Content not ready or not found" });
      }

      if (save_to_database) {
        let targetSiteId = siteId;
        
        // If no siteId provided, create a default site
        if (!targetSiteId) {
          const defaultSite = await storage.createSite({
            userId: req.user!.id,
            name: `Generated Content Site - ${new Date().toLocaleDateString()}`,
            domain: `example-${Date.now()}.com`,
            description: "Site for AI-generated content",
            niche: "General"
          });
          targetSiteId = defaultSite.id;
        } else {
          // Verify site ownership
          const site = await storage.getSite(targetSiteId);
          if (!site || site.userId !== req.user!.id) {
            return res.status(404).json({ message: "Site not found" });
          }
        }

        const savedContent = await storage.createContent({
          userId: req.user!.id,
          siteId: targetSiteId,
          title: title || contentResult.title || "Generated Content",
          content: contentResult.generated_text || "",
          contentType: "blog_post", // Default type
          seoTitle: contentResult.seo_title,
          seoDescription: contentResult.seo_description,
          targetKeywords: contentResult.meta_tags || []
        });

        res.status(201).json({
          content: savedContent,
          generation_data: contentResult
        });
      } else {
        res.json(contentResult);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Advanced Product Research & Scoring Endpoint
  app.get("/api/research-products", authenticateToken, async (req, res) => {
    try {
      const requestSchema = z.object({
        niche: z.string().min(1, "Niche is required"),
        product_category: z.string().optional(),
        min_commission_rate: z.number().min(0).max(100).optional().default(3.0),
        min_trending_score: z.number().min(0).max(100).optional().default(50.0),
        max_results: z.number().min(1).max(100).optional().default(50),
        target_keywords: z.string().optional(),
        min_price: z.number().min(0).optional().default(0),
        max_price: z.number().min(0).optional().default(10000),
        save_to_database: z.boolean().optional().default(true)
      });

      const params = requestSchema.parse({
        niche: req.query.niche as string,
        product_category: req.query.product_category as string,
        min_commission_rate: req.query.min_commission_rate ? parseFloat(req.query.min_commission_rate as string) : 3.0,
        min_trending_score: req.query.min_trending_score ? parseFloat(req.query.min_trending_score as string) : 50.0,
        max_results: req.query.max_results ? parseInt(req.query.max_results as string) : 50,
        target_keywords: req.query.target_keywords as string,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : 0,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : 10000,
        save_to_database: req.query.save_to_database !== 'false'
      });

      console.log('Research request received:', {
        niche: params.niche,
        category: params.product_category,
        userId: req.user?.id
      });

      // Create research session
      const researchSession = await storage.createProductResearchSession({
        userId: req.user!.id,
        niche: params.niche,
        productCategory: params.product_category,
        minCommissionRate: params.min_commission_rate.toString(),
        minTrendingScore: params.min_trending_score.toString(),
        maxResults: params.max_results,
        status: 'pending'
      });

      try {
        // Call Python research engine
        const pythonProcess = spawn('python3', ['server/product_research_test.py'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        const researchParams = {
          niche: params.niche,
          product_category: params.product_category,
          min_commission_rate: params.min_commission_rate,
          min_trending_score: params.min_trending_score,
          max_results: params.max_results,
          target_keywords: params.target_keywords ? params.target_keywords.split(',').map(k => k.trim()) : [],
          price_range: [params.min_price, params.max_price]
        };

        pythonProcess.stdin.write(JSON.stringify(researchParams));
        pythonProcess.stdin.end();

        let pythonOutput = '';
        let pythonError = '';

        pythonProcess.stdout.on('data', (data: Buffer) => {
          pythonOutput += data.toString();
        });

        pythonProcess.stderr.on('data', (data: Buffer) => {
          pythonError += data.toString();
        });

        pythonProcess.on('close', async (code: number) => {
          try {
            if (code !== 0) {
              throw new Error(`Python research engine failed: ${pythonError}`);
            }

            const researchResult = JSON.parse(pythonOutput);
            const products = researchResult.products || [];
            const sessionData = researchResult.session_data || {};

            let savedProducts: any[] = [];

            if (params.save_to_database && products.length > 0) {
              // Convert Python product data to database format
              const productInserts = products.map((product: any) => ({
                userId: req.user!.id,
                title: product.title,
                description: product.description,
                brand: product.brand,
                category: product.category,
                niche: product.niche,
                price: product.price?.toString(),
                originalPrice: product.original_price?.toString(),
                commissionRate: product.commission_rate?.toString(),
                commissionAmount: product.commission_amount?.toString(),
                productUrl: product.product_url,
                affiliateUrl: product.affiliate_url,
                imageUrl: product.image_url,
                asin: product.asin,
                sku: product.sku,
                rating: product.rating?.toString(),
                reviewCount: product.review_count,
                salesRank: product.sales_rank,
                trendingScore: product.trending_score?.toString(),
                competitionScore: product.competition_score?.toString(),
                researchScore: product.research_score?.toString(),
                keywords: product.keywords,
                searchVolume: product.search_volume,
                difficulty: product.difficulty,
                apiSource: product.api_source,
                externalId: product.external_id,
                tags: product.tags
              }));

              savedProducts = await storage.createProducts(productInserts);
            }

            // Update research session with results
            await storage.updateProductResearchSession(researchSession.id, {
              totalProductsFound: sessionData.total_products_found || products.length,
              productsStored: savedProducts.length,
              averageScore: sessionData.average_score ? sessionData.average_score.toString() : '0',
              topProductId: savedProducts.length > 0 ? savedProducts[0].id : undefined,
              apiCallsMade: sessionData.api_calls_made || 0,
              apiSources: sessionData.api_sources || [],
              researchDuration: sessionData.research_duration_ms || 0,
              status: 'completed'
            });

            res.json({
              research_session_id: researchSession.id,
              products: savedProducts.length > 0 ? savedProducts : products,
              total_found: sessionData.total_products_found || products.length,
              saved_to_database: params.save_to_database && savedProducts.length > 0,
              session_data: {
                ...sessionData,
                niche_insights: sessionData.niche_insights,
                average_score: sessionData.average_score,
                api_sources: sessionData.api_sources,
                research_duration_ms: sessionData.research_duration_ms
              }
            });

          } catch (error) {
            console.error('Error processing research results:', error);
            
            // Update session with error
            await storage.updateProductResearchSession(researchSession.id, {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });

            res.status(500).json({
              message: "Product research completed but failed to process results",
              error: error instanceof Error ? error.message : 'Unknown error',
              research_session_id: researchSession.id
            });
          }
        });

      } catch (error) {
        // Update session with error
        await storage.updateProductResearchSession(researchSession.id, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });

        res.status(500).json({
          message: "Failed to start product research",
          error: error instanceof Error ? error.message : 'Unknown error',
          research_session_id: researchSession.id
        });
      }

    } catch (error: any) {
      console.error('Product research error:', error);
      res.status(400).json({ 
        message: "Invalid research parameters", 
        error: error.message 
      });
    }
  });

  // Get user's researched products
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const filters = {
        niche: req.query.niche as string,
        category: req.query.category as string,
        minScore: req.query.min_score ? parseFloat(req.query.min_score as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const products = await storage.searchProducts(req.user!.id, filters);
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get research sessions
  app.get("/api/research-sessions", authenticateToken, async (req, res) => {
    try {
      const sessions = await storage.getUserResearchSessions(req.user!.id);
      res.json(sessions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get specific research session details
  app.get("/api/research-sessions/:id", authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getProductResearchSession(sessionId);
      
      if (!session || session.userId !== req.user!.id) {
        return res.status(404).json({ message: "Research session not found" });
      }

      // Get products from this session if they exist
      const products = await storage.getUserProducts(req.user!.id, session.niche, session.productCategory || undefined);

      res.json({
        ...session,
        products: products
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics
  app.get("/api/analytics/dashboard", authenticateToken, async (req, res) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await storage.getUserAnalytics(req.user.id, startDate, endDate);
      const sites = await storage.getUserSites(req.user.id);
      const content = await storage.getUserContent(req.user.id);
      const usage = await storage.getUserCurrentUsage(req.user.id);

      // Calculate metrics
      const totalRevenue = analytics
        .filter(a => a.metric === 'revenue')
        .reduce((sum, a) => sum + parseFloat(a.value), 0);
      
      const totalClicks = analytics
        .filter(a => a.metric === 'clicks')
        .reduce((sum, a) => sum + parseFloat(a.value), 0);
      
      const totalViews = analytics
        .filter(a => a.metric === 'views')
        .reduce((sum, a) => sum + parseFloat(a.value), 0);

      const dashboardData = {
        overview: {
          totalSites: sites.length,
          totalContent: content.length,
          totalRevenue,
          totalViews,
          totalClicks,
          conversionRate: totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(2) : 0,
        },
        usage: usage.reduce((acc, u) => {
          acc[u.feature] = u.count;
          return acc;
        }, {} as Record<string, number>),
        limits: SUBSCRIPTION_LIMITS[req.user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS],
      };

      res.json(dashboardData);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
function getTierFromPriceId(priceId: string): string {
  // Map Stripe price IDs to subscription tiers
  const priceToTierMap: Record<string, string> = {
    'price_basic': 'basic',
    'price_pro': 'pro',
    'price_agency': 'agency',
  };
  
  return priceToTierMap[priceId] || 'free';
}

async function generateAIContent(params: {
  contentType: string;
  topic: string;
  keywords: string[];
  targetAudience: string;
  brandVoice?: string;
  niche?: string;
}): Promise<{
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
}> {
  try {
    const prompt = `
Create high-quality affiliate content with the following specifications:

Content Type: ${params.contentType}
Topic: ${params.topic}
Keywords: ${params.keywords.join(', ')}
Target Audience: ${params.targetAudience}
Brand Voice: ${params.brandVoice || 'Professional and engaging'}
Niche: ${params.niche || 'General'}

Please generate:
1. A compelling title
2. Detailed content (minimum 800 words) that naturally incorporates the keywords
3. An SEO-optimized title (under 60 characters)
4. An SEO meta description (under 160 characters)

The content should be informative, engaging, and optimized for affiliate conversions while maintaining authenticity and value for readers.

Format the response as JSON with the following structure:
{
  "title": "Main article title",
  "content": "Full article content with proper formatting",
  "seoTitle": "SEO-optimized title",
  "seoDescription": "SEO meta description"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        title: parsed.title || `${params.topic} - Complete Guide`,
        content: parsed.content || `Comprehensive guide about ${params.topic} for ${params.targetAudience}.`,
        seoTitle: parsed.seoTitle || `${params.topic} - Best Practices`,
        seoDescription: parsed.seoDescription || `Learn about ${params.topic}. Expert insights for ${params.targetAudience}.`,
      };
    } catch (parseError) {
      // If JSON parsing fails, extract content manually
      return {
        title: `${params.topic} - Complete Guide`,
        content: text.slice(0, 2000) + '...', // Truncate if too long
        seoTitle: `${params.topic} - Best Practices and Tips`,
        seoDescription: `Discover everything you need to know about ${params.topic}. Expert insights and recommendations.`,
      };
    }
  } catch (error) {
    console.error('Error generating AI content:', error);
    // Fallback content if AI generation fails
    return {
      title: `${params.topic} - Complete Guide`,
      content: `This comprehensive guide covers everything you need to know about ${params.topic}. Perfect for ${params.targetAudience} looking to understand the key concepts and best practices. Keywords: ${params.keywords.join(', ')}.`,
      seoTitle: `${params.topic} - Best Practices and Tips`,
      seoDescription: `Discover everything you need to know about ${params.topic}. Expert insights and recommendations for ${params.targetAudience}.`,
    };
  }
}
