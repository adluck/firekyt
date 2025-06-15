import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { insertUserSchema, type User } from '@shared/schema';
import { z } from 'zod';
import { logger } from './Logger';
import { AuthenticationError, AuthorizationError, ValidationError, ConflictError, NotFoundError } from './ErrorHandler';
import { alertingSystem } from './AlertingSystem';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  tier?: 'free' | 'premium' | 'enterprise';
}

/**
 * User Service - Handles all user-related business logic
 * Separated from routes to maintain clean architecture
 */
export class UserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

  async createUser(request: CreateUserRequest): Promise<User> {
    const stopTimer = logger.startTimer('UserService.createUser');
    const serviceLogger = logger.child({ service: 'UserService', operation: 'createUser' });
    
    try {
      serviceLogger.info('User creation started', { email: request.email.replace(/(.{2}).*@/, '$1***@') });
      
      this.validateEmail(request.email);
      
      const existingUser = await storage.getUserByEmail(request.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists', { email: request.email });
      }

      const hashedPassword = await bcrypt.hash(request.password, 12);
      
      const userData = insertUserSchema.parse({
        username: request.username,
        email: request.email,
        password: hashedPassword,
        firstName: request.firstName || null,
        lastName: request.lastName || null,
        role: 'user',
        tier: 'free',
        isActive: true,
        usageCount: 0,
        usageLimit: this.getTierLimits('free').contentLimit,
      });

      const user = await storage.createUser(userData);
      
      serviceLogger.info('User created successfully', { userId: user.id, tier: user.tier });
      alertingSystem.recordMetric('user_registrations', 1);
      
      return user;
    } catch (error) {
      serviceLogger.error('User creation failed', error as Error, { email: request.email });
      throw error;
    } finally {
      stopTimer();
    }
  }

  async loginUser(request: LoginRequest): Promise<{ user: User; token: string }> {
    const user = await storage.getUserByEmail(request.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(request.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async getUserById(id: number): Promise<User | null> {
    return await storage.getUserById(id);
  }

  async updateUser(id: number, updates: UpdateUserRequest): Promise<User> {
    const existingUser = await storage.getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    return await storage.updateUser(id, updates);
  }

  async upgradeTier(userId: number, newTier: 'premium' | 'enterprise'): Promise<User> {
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const limits = this.getTierLimits(newTier);
    
    const updates = {
      tier: newTier,
      usageLimit: limits.contentLimit === -1 ? 999999 : limits.contentLimit,
    };

    return await storage.updateUser(userId, updates);
  }

  async incrementUsage(userId: number): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!this.canCreateContent(user)) {
      throw new Error('Usage limit exceeded');
    }

    await storage.updateUser(userId, { 
      usageCount: user.usageCount + 1 
    });
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number };
      return await this.getUserById(decoded.userId);
    } catch (error) {
      return null;
    }
  }

  // Business Logic Methods
  canCreateContent(user: User): boolean {
    if (!user.isActive) return false;
    return user.usageCount < user.usageLimit;
  }

  canAccessPremiumFeatures(user: User): boolean {
    return user.tier === 'premium' || user.tier === 'enterprise';
  }

  calculateUsagePercentage(user: User): number {
    if (user.usageLimit === 0) return 0;
    return (user.usageCount / user.usageLimit) * 100;
  }

  isSubscriptionActive(user: User): boolean {
    if (!user.subscriptionEndDate) return false;
    return new Date() < user.subscriptionEndDate;
  }

  getTierLimits(tier: string): { contentLimit: number; sitesLimit: number; aiRequestsLimit: number } {
    switch (tier) {
      case 'free':
        return { contentLimit: 5, sitesLimit: 1, aiRequestsLimit: 10 };
      case 'premium':
        return { contentLimit: 100, sitesLimit: 5, aiRequestsLimit: 500 };
      case 'enterprise':
        return { contentLimit: -1, sitesLimit: -1, aiRequestsLimit: -1 }; // unlimited
      default:
        return { contentLimit: 5, sitesLimit: 1, aiRequestsLimit: 10 };
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  private validateEmail(email: string): void {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
    } catch (error) {
      throw new Error('Invalid email format');
    }
  }
}