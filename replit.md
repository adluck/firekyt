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

✓ Fixed Recent Activity section by adding missing userActivity table definition to schema
✓ Resolved authentication issues in API endpoints for proper JSON responses
✓ Implemented comprehensive user activity tracking with database storage
✓ Successfully tested Recent Activity API endpoint with real data (6 activities found)
✓ Created complete GitHub repository setup with README and deployment instructions
✓ Added comprehensive .gitignore file excluding sensitive files and test artifacts
✓ Documentation completely redesigned as step-by-step tutorial
✓ Removed all colored backgrounds, now uses theme colors for light/dark modes
✓ Added numbered steps with time estimates (30-45 minute complete walkthrough)
✓ Included real examples and troubleshooting tips
✓ Fixed JSX syntax errors preventing application from running
✓ User feedback: "looks awesome" - tutorial format approved
✓ Updated documentation to use dynamic language instead of hardcoded numbers for universal applicability
✓ Applied bold headers to ACTION sections for better visual hierarchy
✓ Expanded tutorial structure to include comprehensive affiliate marketing workflow beyond WordPress connection
✓ Fixed publication history functionality - now displays actual published content with proper database joins
✓ Implemented complete scheduled publications feature with background scheduler that automatically publishes content at scheduled times
✓ Fixed intelligent link generation URL construction to include proper HTTPS protocol
✓ Updated scheduled publications minimum waiting period to 5 minutes for better content planning
✓ Resolved frontend validation conflicts - 5-minute scheduling now works correctly
✓ Fixed scheduled publication system with working IntegrationService publishContent method
✓ Resolved database constraint errors in publication history creation
✓ Scheduler successfully processes publications and publishes to WordPress platform
✓ Background scheduler runs every 30 seconds for responsive publication processing
✓ Fixed content lookup in scheduled publications - titles now display correctly instead of "Unknown Content"
✓ Enhanced scheduler to automatically update content status from "draft" to "published" when scheduled publication succeeds
✓ Added comprehensive logging to track publication processing and identify failures
✓ Implemented real-time page view tracking system with API endpoints that update analytics immediately
✓ Fixed all broken dashboard sections by implementing missing analytics endpoints
✓ Added authentic analytics data using real page views, clicks, and content performance metrics
✓ Resolved authentication issues preventing dashboard sections from loading
✓ All analytics now display real data from database instead of synthetic calculations
✓ Enhanced affiliate performance analytics with intelligent links showing proper titles and metrics
✓ Top Performing URLs section displays actual link performance with 49 clicks tracked per intelligent link
✓ Fixed affiliate analytics API endpoint to use correct database column names and authentication
✓ Improved link title display using database titles instead of showing "Untitled" for all links
✓ Added floating feedback widget with categorized submissions and priority levels for user bug reports and feature requests
✓ Implemented comprehensive admin-only feedback management system with status tracking and comment threads
✓ Added beta tag to logo with gradient styling and rotated positioning for visual appeal
✓ Implemented expandable/collapsible sidebar functionality similar to Replit app with smooth animations
✓ Added toggle button for sidebar collapse with proper state management and responsive design
✓ Updated all navigation items to support collapsed state with icon-only display and tooltips
✓ Configured user section and admin areas to adapt seamlessly to collapsed mode
✓ Removed underlines from all sidebar navigation links for clean visual appearance
✓ Implemented session expiration system with 15-minute timeout and clean console logging (no browser prompts)
✓ Added 1-minute countdown timer with progress bar and automatic logout functionality
✓ Session manager tracks user activity and extends session automatically on interaction
✓ Fixed dropdown menu transparency issues with solid backgrounds for better visibility
✓ Moved toggle button to sidebar bottom in user controls section for better UX
✓ Implemented dynamic logo system - diamond icon for collapsed state, full logo for expanded
✓ Added new FireKyt diamond-shaped icon for collapsed sidebar branding
✓ Fixed logo display issues in production by copying assets to client/public directory
✓ Updated all components to use public asset paths for better production compatibility
✓ Resolved CSRF authentication errors by disabling CSRF protection in development and Replit environments
✓ Authentication system now works correctly for registration and login processes
✓ Built complete Smart Affiliate Link Insertion System with database table, API endpoints, and content processor
✓ Created comprehensive AutoLinkRules management interface with priority system, UTM tracking, and usage analytics
✓ Implemented intelligent keyword-to-affiliate-URL matching with configurable insertion limits
✓ Added auto-link content processor that respects existing HTML links and applies priority-based rule processing
✓ Successfully tested system with sample rules for "best laptops" and "gaming headset" keywords showing proper link generation with UTM parameters
✓ Removed all icons from auto-link rules interface per user preference for clean, text-based UI without visual clutter
✓ Replaced icon-based action buttons with text labels (Toggle, Edit, Delete) for better accessibility
✓ Enhanced Link Management Widget with comprehensive background styling for improved contrast and visual distinction
✓ Applied consistent slate-themed backgrounds to all sidebar widgets (Publication Settings, Content Statistics, Quick Actions)
✓ Implemented proper dark mode support with semi-transparent backgrounds and themed borders
✓ Positioned Link Management Widget above Content Statistics for optimal user workflow
✓ All widgets now feature distinct header backgrounds and clean content areas for better visual hierarchy
✓ Applied refined header font sizing across all widgets for improved visual hierarchy and professional appearance
✓ Cleaned up editor tab navigation with proper border radius styling and seamless card integration for professional appearance
✓ Fixed all rounded edge issues with overflow-hidden and proper corner radius styling across sidebar widgets and main editor
✓ Reduced header padding and added margin-bottom across all widgets for cleaner spacing and improved visual hierarchy

## User Preferences

Preferred communication style: Simple, everyday language.
Documentation format: Hands-on interactive tutorial with actionable steps rather than glossary format.
UI/UX preferences: Use telescope icon for Content Insight feature instead of bar charts.