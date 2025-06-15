import { UserService } from './UserService';
import { ContentService } from './ContentService';
import { AIEngineService } from './AIEngineService';
import { AnalyticsService } from './AnalyticsService';
import { IntegrationService } from './IntegrationService';

/**
 * Service Container - Dependency Injection Container
 * Manages service instantiation and dependencies
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private initializeServices(): void {
    // Initialize services with their dependencies
    const userService = new UserService();
    const contentService = new ContentService();
    const aiEngineService = new AIEngineService();
    const analyticsService = new AnalyticsService();
    const integrationService = new IntegrationService();

    // Register services
    this.services.set('UserService', userService);
    this.services.set('ContentService', contentService);
    this.services.set('AIEngineService', aiEngineService);
    this.services.set('AnalyticsService', analyticsService);
    this.services.set('IntegrationService', integrationService);
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service;
  }

  // Convenience getters
  get userService(): UserService {
    return this.get<UserService>('UserService');
  }

  get contentService(): ContentService {
    return this.get<ContentService>('ContentService');
  }

  get aiEngineService(): AIEngineService {
    return this.get<AIEngineService>('AIEngineService');
  }

  get analyticsService(): AnalyticsService {
    return this.get<AnalyticsService>('AnalyticsService');
  }

  get integrationService(): IntegrationService {
    return this.get<IntegrationService>('IntegrationService');
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();