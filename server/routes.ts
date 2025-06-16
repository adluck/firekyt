import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
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
import { performanceMonitor } from "./performance/PerformanceMonitor";
import { cacheManager } from "./performance/CacheManager";
import { 
  rateLimiter, 
  apiRateLimit, 
  authRateLimit, 
  contentGenerationRateLimit,
  analyticsRateLimit,
  adminRateLimit 
} from "./performance/RateLimiter";
import { databaseOptimizer } from "./performance/DatabaseOptimizer";
import { queryOptimizer } from "./performance/QueryOptimizer";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

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
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Subscription limit checking middleware - now simplified without payment processing
const checkSubscriptionLimit = (limitType: string) => {
  return async (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // For now, all users get pro-level access without payment
    // In a real deployment, this would check actual subscription status
    const limits = SUBSCRIPTION_LIMITS.admin; // Give everyone admin limits for now
    
    try {
      let currentUsage = 0;
      
      switch (limitType) {
        case 'site_creation':
          const sites = await storage.getUserSites(user.id);
          currentUsage = sites.length;
          if (limits.sites !== -1 && currentUsage >= limits.sites) {
            return res.status(403).json({ 
              message: `Site limit reached (${limits.sites})`,
              upgrade: true 
            });
          }
          break;
          
        case 'content_generation':
          // For content generation, we'll allow unlimited for now
          break;
      }
      
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      next(); // Allow through on error
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const userData = {
        ...validatedData,
        password: hashedPassword,
        role: validatedData.email === 'adluck72@gmail.com' ? 'admin' : 'user',
        subscriptionTier: validatedData.email === 'adluck72@gmail.com' ? 'admin' : 'free',
        subscriptionStatus: 'active'
      };

      const user = await storage.createUser(userData);
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
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
    const { password, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/logout", async (req, res) => {
    // In a JWT-based system, logout is handled client-side by removing the token
    // No authentication required for logout since it's just clearing client state
    try {
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sites management
  app.get("/api/sites", authenticateToken, async (req, res) => {
    try {
      const sites = await storage.getUserSites(req.user!.id);
      res.json(sites);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/sites", authenticateToken, checkSubscriptionLimit('site_creation'), async (req, res) => {
    try {
      const validatedData = insertSiteSchema.parse(req.body);
      const site = await storage.createSite({
        ...validatedData,
        userId: req.user!.id
      });
      res.json(site);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Content management
  app.get("/api/content", authenticateToken, async (req, res) => {
    try {
      const content = await storage.getUserContent(req.user!.id);
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/content", authenticateToken, contentGenerationRateLimit, checkSubscriptionLimit('content_generation'), async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const content = await storage.createContent({
        ...validatedData,
        userId: req.user!.id
      });
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics dashboard
  app.get("/api/analytics/dashboard", authenticateToken, analyticsRateLimit, async (req, res) => {
    try {
      const sites = await storage.getUserSites(req.user!.id);
      const content = await storage.getUserContent(req.user!.id);
      
      res.json({
        overview: {
          totalSites: sites.length,
          totalContent: content.length,
          publishedContent: content.filter(c => c.status === 'published').length,
          draftContent: content.filter(c => c.status === 'draft').length
        },
        recentContent: content.slice(0, 5),
        performance: {
          totalViews: Math.floor(Math.random() * 10000),
          totalClicks: Math.floor(Math.random() * 1000),
          conversionRate: (Math.random() * 5).toFixed(2)
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}