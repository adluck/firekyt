# replit.md

## Overview

This is a comprehensive affiliate marketing SaaS platform built with React, TypeScript, Express.js, and PostgreSQL. The platform provides AI-powered content generation, intelligent link management, analytics, and social media integrations for affiliate marketers. The system is designed for high scalability to support millions of users with real-time analytics and performance optimization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18.3 with TypeScript
- **UI Components**: Radix UI component library for accessible design
- **Styling**: Tailwind CSS with shadcn/ui design system
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Rich Text Editor**: TipTap for content creation and editing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with bcrypt password hashing
- **API Design**: RESTful APIs with consistent error handling
- **Service Layer**: Modular service-oriented architecture with dependency injection

### AI Integration
- **Primary AI**: Google Gemini AI for content generation and SEO analysis
- **Content Types**: Blog posts, product comparisons, reviews, video scripts
- **Link Intelligence**: AI-powered affiliate link placement suggestions
- **SEO Optimization**: Automated keyword analysis and content optimization

## Key Components

### Service Layer Components
1. **UserService**: Authentication, authorization, subscription management
2. **ContentService**: Content CRUD operations, SEO validation, analytics
3. **AIEngineService**: AI content generation, SEO analysis, optimization
4. **AnalyticsService**: Performance tracking, real-time metrics, insights
5. **IntegrationService**: Social media integrations, publishing automation
6. **LinkIntelligenceService**: AI-powered link placement and optimization

### Security Components
- **SecurityManager**: Encryption, data protection, secure API key management
- **ErrorHandler**: Comprehensive error handling with severity classification
- **Logger**: Structured logging with context tracking and external webhooks
- **RateLimiter**: Advanced rate limiting with sliding window algorithms

### Performance Components
- **CacheManager**: Multi-layer caching (memory, query, session, analytics)
- **PerformanceMonitor**: Real-time performance tracking and optimization
- **QueryOptimizer**: Database query optimization and connection pooling

### External Integrations
- **Payment Processing**: Stripe integration for subscriptions
- **Email Service**: SendGrid for transactional emails
- **Publishing Platforms**: WordPress, Medium, LinkedIn integrations
- **Affiliate Networks**: Amazon Associates, Impact Radius support

## Data Flow

### Content Generation Flow
1. User submits content generation request with keywords and parameters
2. Request queued in AI engine with priority and content type classification
3. Google Gemini AI processes request with brand voice and SEO requirements
4. Generated content stored with SEO metadata and performance tracking
5. Real-time analytics track content performance and engagement

### Link Intelligence Flow
1. User creates intelligent link definitions with keywords and targeting
2. AI analyzes content context and suggests optimal link placements
3. System generates tracking URLs with affiliate network integration
4. Performance monitoring tracks clicks, conversions, and revenue attribution
5. Machine learning optimizes future link placement suggestions

### Analytics Pipeline
1. Real-time event tracking for views, clicks, and conversions
2. Data aggregation with caching for performance optimization
3. Multi-dimensional analytics: content, links, revenue, traffic sources
4. Dashboard visualization with trend analysis and insights
5. Automated reporting and alert generation

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL 16 with SSL encryption
- **AI Services**: Google Gemini API for content generation
- **Payment**: Stripe for subscription management
- **Email**: SendGrid for transactional email delivery
- **Caching**: Redis for distributed caching (optional)

### Development Dependencies
- **Testing**: Vitest for unit and integration testing
- **Performance**: Artillery for load testing
- **Monitoring**: Custom performance monitoring with webhook integration
- **Security**: Helmet for security headers, bcrypt for password hashing

### Environment Variables
- JWT_SECRET, ENCRYPTION_KEY, FIELD_ENCRYPTION_KEY for security
- GEMINI_API_KEY for AI content generation
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY for payments
- DATABASE_URL for PostgreSQL connection
- SENDGRID_API_KEY for email delivery

## Deployment Strategy

### Production Environment
- **Hosting**: Designed for containerized deployment with Docker
- **Scaling**: Kubernetes configuration for auto-scaling (10M+ users)
- **Database**: PostgreSQL with read replicas and connection pooling
- **Caching**: Redis cluster for distributed caching
- **CDN**: Static asset delivery through CDN
- **Monitoring**: Comprehensive logging with external webhook integration

### Development Environment
- **Local Development**: npm run dev with hot reload
- **Database**: Local PostgreSQL or cloud development instance
- **Testing**: Comprehensive test suite with performance benchmarks
- **Security**: Development-specific security configurations

### Performance Targets
- **Response Time**: <200ms for API calls
- **Availability**: 99.99% uptime
- **Concurrent Users**: 10M+ users supported
- **Cache Hit Rate**: >85% for optimal performance
- **Analytics**: Real-time processing of 1M+ events/second

## Changelog
- June 24, 2025: Initial setup and analytics implementation
- June 24, 2025: Comprehensive learning documentation system created
- June 24, 2025: Transformed documentation from glossary to hands-on interactive tutorial format

## Recent Changes

✓ Documentation completely redesigned as step-by-step tutorial
✓ Removed all colored backgrounds, now uses theme colors for light/dark modes
✓ Added numbered steps with time estimates (30-45 minute complete walkthrough)
✓ Included real examples and troubleshooting tips
✓ Fixed JSX syntax errors preventing application from running
✓ User feedback: "looks awesome" - tutorial format approved
✓ Updated documentation to use dynamic language instead of hardcoded numbers for universal applicability

## User Preferences

Preferred communication style: Simple, everyday language.
Documentation format: Hands-on interactive tutorial with actionable steps rather than glossary format.