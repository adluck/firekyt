# replit.md

## Overview

This is a comprehensive SaaS platform for affiliate marketers, built with React, TypeScript, Express.js, and PostgreSQL. It offers AI-powered content generation, intelligent link management, real-time analytics, and social media integrations. The platform aims for high scalability to support millions of users, providing tools for performance optimization and content creation.

## User Preferences

Preferred communication style: Simple, everyday language.
Documentation format: Hands-on interactive tutorial with actionable steps rather than glossary format.
UI/UX preferences: Use telescope icon for Content Insight feature instead of bar charts.

## System Architecture

### Core Design Principles
- **Scalability**: Designed to support millions of users with real-time analytics.
- **Modularity**: Service-oriented architecture with clear separation of concerns.
- **Performance**: Multi-layer caching, query optimization, and real-time monitoring.
- **Security**: JWT authentication, data encryption, rate limiting, and robust error handling.
- **AI-first**: Deep integration of Google Gemini AI for content, SEO, and link intelligence.

### Frontend
- **Framework**: React with TypeScript.
- **UI/UX**: Radix UI, Tailwind CSS, shadcn/ui for accessible and modern design.
- **State Management**: TanStack React Query for efficient server state management.
- **Routing**: Wouter for lightweight client-side navigation.
- **Content Editor**: TipTap rich text editor.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT-based.
- **API**: RESTful, designed for consistent error handling and service layering.

### AI Integration
- **AI Engine**: Primarily Google Gemini AI.
- **Capabilities**: AI-powered content generation (blogs, reviews, scripts), intelligent affiliate link placement, and comprehensive SEO analysis (keyword insights, competitor analysis).
- **Functionality**: Plagiarism detection, ad copy generation, and content optimization.

### Key Features
- **User Management**: Authentication, authorization, subscription handling.
- **Content Management**: CRUD operations, SEO validation, analytics.
- **Analytics**: Real-time performance tracking, multi-dimensional insights, automated reporting.
- **Integrations**: Social media publishing automation, affiliate network support.
- **Link Intelligence**: AI-suggested link placements, tracking URL generation, performance monitoring.
- **Ad Widgets**: Dynamic ad generation with responsive layouts, customizable templates, and real-time previews.
- **User Onboarding**: Interactive 3-step tour (Connect Site, Generate Content, Publish Content).
- **CRM Dashboard**: User management, email campaign tracking, and analytics.

## External Dependencies

- **Database**: PostgreSQL 16
- **AI Services**: Google Gemini API
- **Payment Gateway**: Stripe
- **Email Service**: Resend
- **Product Research**: Rye.com GraphQL API, SerpAPI (for product search)
- **Caching**: Redis (optional)
- **Publishing Platforms**: WordPress, Medium, LinkedIn
- **Analytics**: Google Analytics 4 (GA4)