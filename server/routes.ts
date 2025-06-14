import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertSiteSchema, insertContentSchema, SUBSCRIPTION_LIMITS } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

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

  app.post("/api/content/generate", authenticateToken, checkSubscriptionLimit('content_generation'), async (req, res) => {
    try {
      const { siteId, contentType, topic, keywords, targetAudience } = req.body;
      
      const site = await storage.getSite(siteId);
      if (!site || site.userId !== req.user.id) {
        return res.status(404).json({ message: "Site not found" });
      }

      // Track usage
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const currentUsage = await storage.getUsage(req.user.id, 'content_generation', monthStart, monthEnd);
      await storage.createOrUpdateUsage({
        userId: req.user.id,
        feature: 'content_generation',
        count: (currentUsage?.count || 0) + 1,
        periodStart: monthStart,
        periodEnd: monthEnd,
      });

      // Generate content using OpenAI (placeholder for now)
      const generatedContent = await generateAIContent({
        contentType,
        topic,
        keywords,
        targetAudience,
        brandVoice: site.brandVoice,
        niche: site.niche,
      });

      const content = await storage.createContent({
        userId: req.user.id,
        siteId: site.id,
        title: generatedContent.title,
        content: generatedContent.content,
        contentType,
        seoTitle: generatedContent.seoTitle,
        seoDescription: generatedContent.seoDescription,
        targetKeywords: keywords,
      });

      res.status(201).json(content);
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
  // This would integrate with OpenAI API
  // For now, return placeholder content
  return {
    title: `${params.topic} - Complete Guide`,
    content: `This is AI-generated content about ${params.topic} for ${params.targetAudience}. Content would be generated based on the specified parameters including keywords: ${params.keywords.join(', ')}.`,
    seoTitle: `${params.topic} - Best Practices and Tips`,
    seoDescription: `Discover everything you need to know about ${params.topic}. Expert insights and recommendations for ${params.targetAudience}.`,
  };
}
