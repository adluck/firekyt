import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard,
  Globe,
  FileText,
  Search,
  Link2,
  Send,
  BarChart3,
  CreditCard,
  Settings,
  Brain,
  Lightbulb,
  Network
} from "lucide-react";

export default function Documentation() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">FireKyt User Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Complete guide to mastering every feature of the FireKyt affiliate marketing platform
        </p>
        <Badge variant="secondary" className="text-sm">
          Updated June 2025
        </Badge>
      </div>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <a href="#dashboard" className="flex items-center gap-2 text-primary hover:underline">
                <LayoutDashboard className="h-4 w-4" />
                1. Dashboard Overview
              </a>
              <a href="#sites" className="flex items-center gap-2 text-primary hover:underline">
                <Globe className="h-4 w-4" />
                2. Sites Management
              </a>
              <a href="#content" className="flex items-center gap-2 text-primary hover:underline">
                <FileText className="h-4 w-4" />
                3. Content Creation
              </a>
              <a href="#research" className="flex items-center gap-2 text-primary hover:underline">
                <Search className="h-4 w-4" />
                4. Research Tools
              </a>
            </div>
            <div className="space-y-2">
              <a href="#links" className="flex items-center gap-2 text-primary hover:underline">
                <Link2 className="h-4 w-4" />
                5. Link Management
              </a>
              <a href="#publishing" className="flex items-center gap-2 text-primary hover:underline">
                <Send className="h-4 w-4" />
                6. Publishing & Distribution
              </a>
              <a href="#analytics" className="flex items-center gap-2 text-primary hover:underline">
                <BarChart3 className="h-4 w-4" />
                7. Content Insight (Analytics)
              </a>
              <a href="#settings" className="flex items-center gap-2 text-primary hover:underline">
                <Settings className="h-4 w-4" />
                8. Settings & Account
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Section */}
      <section id="dashboard">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6" />
              1. Dashboard Overview
            </CardTitle>
            <CardDescription>
              Your command center for monitoring performance and accessing key features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Key Metrics Section</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Total Sites:</strong> Number of connected publishing platforms (WordPress, Ghost, custom)</p>
                <p><strong>Content Generated:</strong> Total articles created using AI content generator</p>
                <p><strong>Published Content:</strong> Articles successfully published to your sites</p>
                <p><strong>Draft Content:</strong> Unpublished articles saved for future editing</p>
                <p><strong>Total Views/Clicks:</strong> Real-time tracking data from your published content</p>
                <p><strong>Revenue Tracking:</strong> Estimated earnings based on affiliate link performance</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Usage & Limits</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Sites Usage:</strong> Shows current connected sites vs subscription limit</p>
                <p><strong>ContentPerMonth:</strong> Articles generated in the last 30 days vs monthly allowance</p>
                <p><strong>ApiCallsPerMonth:</strong> Total API usage including content generation and link processing</p>
                <p><strong>Subscription Features:</strong> Lists available features based on your current plan</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <ul className="space-y-1 text-sm">
                <li>• Access recent content for quick editing</li>
                <li>• View performance charts for traffic and revenue trends</li>
                <li>• Navigate to content creation tools</li>
                <li>• Monitor subscription status and upgrade options</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sites Management */}
      <section id="sites">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-6 w-6" />
              2. Sites Management
            </CardTitle>
            <CardDescription>
              Connect and manage your publishing platforms for content distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Connecting New Sites</h3>
              <div className="space-y-2 text-sm">
                <p><strong>WordPress Integration:</strong> Connect using admin credentials or API keys</p>
                <p><strong>Ghost Platform:</strong> Use admin API key for seamless publishing</p>
                <p><strong>Custom Platforms:</strong> Manual publishing with export/import functionality</p>
                <p><strong>Connection Testing:</strong> Verify publishing permissions before saving</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Site Management Features</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Site Details:</strong> View and edit connection settings, categories, and tags</li>
                <li>• <strong>Publishing History:</strong> Track articles published to each site</li>
                <li>• <strong>Performance Metrics:</strong> Monitor traffic and engagement per site</li>
                <li>• <strong>Content Scheduling:</strong> Set up automated publishing calendars</li>
                <li>• <strong>SEO Settings:</strong> Configure meta tags and optimization preferences</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Site-Specific Configuration</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Categories & Tags:</strong> Set default categories and tags for automated publishing</p>
                <p><strong>Author Settings:</strong> Configure author attribution and bio information</p>
                <p><strong>Featured Images:</strong> Set up automatic image selection and optimization</p>
                <p><strong>Publishing Preferences:</strong> Choose draft vs. immediate publishing options</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Content Creation */}
      <section id="content">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              3. Content Creation
            </CardTitle>
            <CardDescription>
              AI-powered content generation tools for high-converting affiliate articles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">AI Generator (Advanced)</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Content Types:</strong> Product reviews, comparisons, buying guides, how-to articles</p>
                <p><strong>Keyword Targeting:</strong> Input primary and secondary keywords for SEO optimization</p>
                <p><strong>Brand Voice:</strong> Customize tone, style, and writing approach</p>
                <p><strong>Length Control:</strong> Generate articles from 800 to 3000+ words</p>
                <p><strong>Comparison Tables:</strong> Automatic product comparison generation with pros/cons</p>
                <p><strong>Rich Content:</strong> Include images, videos, and interactive elements</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Content Manager</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Content Library:</strong> View all generated articles with status indicators</li>
                <li>• <strong>Bulk Operations:</strong> Edit, publish, or delete multiple articles</li>
                <li>• <strong>Search & Filter:</strong> Find content by keyword, status, or creation date</li>
                <li>• <strong>Content Analytics:</strong> Performance metrics for each article</li>
                <li>• <strong>Version Control:</strong> Track changes and revert to previous versions</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Rich Editor</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Visual Editing:</strong> WYSIWYG editor for real-time content customization</p>
                <p><strong>SEO Optimization:</strong> Built-in SEO analysis and recommendations</p>
                <p><strong>Affiliate Link Integration:</strong> Easy insertion and management of affiliate links</p>
                <p><strong>Media Management:</strong> Upload and optimize images, videos, and documents</p>
                <p><strong>Table Builder:</strong> Create and customize comparison tables</p>
                <p><strong>Content Templates:</strong> Save and reuse successful content structures</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Content Optimization</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>SEO Analysis:</strong> Real-time keyword density and optimization suggestions</li>
                <li>• <strong>Readability Scoring:</strong> Ensure content is accessible to your audience</li>
                <li>• <strong>Link Optimization:</strong> Automatic affiliate link placement recommendations</li>
                <li>• <strong>Meta Data:</strong> Generate optimized titles, descriptions, and tags</li>
                <li>• <strong>Content Structure:</strong> Improve heading hierarchy and paragraph flow</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Research Tools */}
      <section id="research">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6" />
              4. Research Tools
            </CardTitle>
            <CardDescription>
              Comprehensive research suite for niche analysis and product discovery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Niche Insights</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Competition Analysis:</strong> Evaluate niche difficulty and opportunity scores</p>
                <p><strong>Trend Analysis:</strong> Identify growing markets and seasonal patterns</p>
                <p><strong>Keyword Discovery:</strong> Find high-value, low-competition keywords</p>
                <p><strong>Revenue Potential:</strong> Estimate earning potential based on market data</p>
                <p><strong>Content Gaps:</strong> Discover underserved topics in your niche</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Product Research</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>SerpAPI Integration:</strong> Real-time product data from major retailers</li>
                <li>• <strong>Price Tracking:</strong> Monitor product prices and availability</li>
                <li>• <strong>Review Analysis:</strong> Aggregate customer feedback and ratings</li>
                <li>• <strong>Competitor Products:</strong> Discover what others are promoting</li>
                <li>• <strong>Commission Rates:</strong> Compare affiliate program payouts</li>
                <li>• <strong>Product Trends:</strong> Identify trending and seasonal products</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">SEO Analysis</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Keyword Research:</strong> Comprehensive keyword analysis with difficulty scores</p>
                <p><strong>SERP Analysis:</strong> Analyze top-ranking pages for target keywords</p>
                <p><strong>Content Gap Analysis:</strong> Find content opportunities your competitors miss</p>
                <p><strong>Backlink Opportunities:</strong> Discover potential link building prospects</p>
                <p><strong>Rank Tracking:</strong> Monitor your content's search engine positions</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Keyword Analytics</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Search Volume Data:</strong> Monthly search volumes and trends</li>
                <li>• <strong>Keyword Difficulty:</strong> Competition analysis and ranking feasibility</li>
                <li>• <strong>Related Keywords:</strong> Discover semantically related terms</li>
                <li>• <strong>Long-tail Opportunities:</strong> Find specific, low-competition phrases</li>
                <li>• <strong>Seasonal Patterns:</strong> Identify peak search periods</li>
                <li>• <strong>Commercial Intent:</strong> Evaluate keywords for buying intent</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Link Management */}
      <section id="links">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-6 w-6" />
              5. Link Management
            </CardTitle>
            <CardDescription>
              AI-powered affiliate link optimization and performance tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Link Dashboard</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Link Overview:</strong> Central hub for all affiliate links and performance</p>
                <p><strong>Click Tracking:</strong> Real-time monitoring of link clicks and conversions</p>
                <p><strong>Revenue Attribution:</strong> Track which links generate the most revenue</p>
                <p><strong>Link Health:</strong> Monitor for broken or expired affiliate links</p>
                <p><strong>Performance Analytics:</strong> Detailed metrics for optimization decisions</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Link Intelligence</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>AI Link Optimization:</strong> Intelligent placement recommendations</li>
                <li>• <strong>Context Analysis:</strong> Ensure links match content relevance</li>
                <li>• <strong>Conversion Prediction:</strong> Identify high-converting link opportunities</li>
                <li>• <strong>A/B Testing:</strong> Test different link placements and anchor text</li>
                <li>• <strong>Dynamic Linking:</strong> Automatically update links based on performance</li>
                <li>• <strong>Competitor Analysis:</strong> Learn from successful competitor strategies</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">AI Link Inserter</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Automated Insertion:</strong> AI analyzes content and suggests optimal link placement</p>
                <p><strong>Natural Integration:</strong> Ensures links feel organic within content flow</p>
                <p><strong>Link Density Control:</strong> Maintains optimal link-to-content ratio</p>
                <p><strong>Anchor Text Optimization:</strong> Varies anchor text for natural linking patterns</p>
                <p><strong>Product Matching:</strong> Intelligently matches products to content topics</p>
                <p><strong>Link Cloaking:</strong> Professional link management and tracking</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Partner Networks</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Amazon Associates:</strong> Direct integration with product catalog</li>
                <li>• <strong>Impact Radius:</strong> Access to premium affiliate programs</li>
                <li>• <strong>ShareASale:</strong> Diverse merchant network integration</li>
                <li>• <strong>CJ Affiliate:</strong> High-commission brand partnerships</li>
                <li>• <strong>Custom Programs:</strong> Add your own affiliate networks</li>
                <li>• <strong>Commission Tracking:</strong> Monitor earnings across all networks</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Publishing */}
      <section id="publishing">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-6 w-6" />
              6. Publishing & Distribution
            </CardTitle>
            <CardDescription>
              Multi-platform content distribution and social media integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Publishing Dashboard</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Content Scheduling:</strong> Plan and schedule content across multiple platforms</p>
                <p><strong>Publishing Queue:</strong> Manage upcoming publications and timing</p>
                <p><strong>Publication History:</strong> Track all published content with performance data</p>
                <p><strong>Cross-Platform Sync:</strong> Coordinate publishing across different sites</p>
                <p><strong>Content Calendars:</strong> Visual planning tools for content strategy</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">WordPress Integration</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Direct Publishing:</strong> One-click publishing to WordPress sites</li>
                <li>• <strong>Category Management:</strong> Automatic categorization and tagging</li>
                <li>• <strong>Featured Images:</strong> Automatic image selection and optimization</li>
                <li>• <strong>SEO Optimization:</strong> Meta tags and structured data integration</li>
                <li>• <strong>Custom Fields:</strong> Support for advanced WordPress features</li>
                <li>• <strong>Multi-Site Support:</strong> Manage multiple WordPress installations</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Social Media Distribution</h3>
              <div className="space-y-2 text-sm">
                <p><strong>LinkedIn Publishing:</strong> Professional article sharing with optimization</p>
                <p><strong>Pinterest Integration:</strong> Visual content creation and pinning</p>
                <p><strong>Content Adaptation:</strong> Automatically adapt content for each platform</p>
                <p><strong>Engagement Tracking:</strong> Monitor social media performance and engagement</p>
                <p><strong>Hashtag Optimization:</strong> Automatic hashtag research and application</p>
                <p><strong>Cross-Posting:</strong> Simultaneous publishing across multiple social platforms</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Content Promotion</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Email Marketing:</strong> Integration with email service providers</li>
                <li>• <strong>Social Sharing:</strong> Automated social media promotion campaigns</li>
                <li>• <strong>Community Outreach:</strong> Share in relevant online communities</li>
                <li>• <strong>Influencer Contacts:</strong> Manage relationships with industry influencers</li>
                <li>• <strong>Content Syndication:</strong> Distribute to content networks</li>
                <li>• <strong>Guest Posting:</strong> Coordinate guest publication opportunities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Analytics */}
      <section id="analytics">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              7. Content Insight (Analytics)
            </CardTitle>
            <CardDescription>
              Comprehensive performance analytics and optimization insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Performance Overview</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Real-time Metrics:</strong> Live tracking of views, clicks, and conversions</p>
                <p><strong>Revenue Tracking:</strong> Detailed commission and earnings analysis</p>
                <p><strong>Traffic Sources:</strong> Understand where your visitors come from</p>
                <p><strong>Content Performance:</strong> Compare article effectiveness and engagement</p>
                <p><strong>Trend Analysis:</strong> Identify patterns and optimization opportunities</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Content Performance Analytics</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Page Views:</strong> Track unique and total page views for each article</li>
                <li>• <strong>Engagement Metrics:</strong> Time on page, bounce rate, and scroll depth</li>
                <li>• <strong>Social Shares:</strong> Monitor viral potential and social engagement</li>
                <li>• <strong>Comment Analysis:</strong> Track reader engagement and feedback</li>
                <li>• <strong>Conversion Funnels:</strong> Analyze user journey from view to purchase</li>
                <li>• <strong>Content Optimization:</strong> AI-powered suggestions for improvement</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Affiliate Link Analytics</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Click-Through Rates:</strong> Monitor link performance and engagement</p>
                <p><strong>Conversion Tracking:</strong> Track actual sales and commission generation</p>
                <p><strong>Revenue Attribution:</strong> Understand which content drives the most revenue</p>
                <p><strong>Link Performance:</strong> Compare effectiveness across different products</p>
                <p><strong>Geographic Analytics:</strong> Understand audience location and preferences</p>
                <p><strong>Device Analytics:</strong> Optimize for mobile vs desktop performance</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">SEO Rankings</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Keyword Positions:</strong> Track search engine rankings for target keywords</li>
                <li>• <strong>Ranking Trends:</strong> Monitor position changes over time</li>
                <li>• <strong>SERP Features:</strong> Track featured snippets and rich results</li>
                <li>• <strong>Competitor Analysis:</strong> Compare your rankings to competitors</li>
                <li>• <strong>Opportunity Identification:</strong> Find keywords ready for optimization</li>
                <li>• <strong>Local SEO:</strong> Track local search performance if applicable</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Revenue Analytics</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Commission Tracking:</strong> Detailed breakdown of affiliate earnings</p>
                <p><strong>Revenue Trends:</strong> Daily, weekly, and monthly earning patterns</p>
                <p><strong>Product Performance:</strong> Identify your highest-earning products</p>
                <p><strong>Program Comparison:</strong> Compare performance across affiliate networks</p>
                <p><strong>Forecasting:</strong> Predict future earnings based on current trends</p>
                <p><strong>ROI Analysis:</strong> Calculate return on investment for content creation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Settings */}
      <section id="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              8. Settings & Account Management
            </CardTitle>
            <CardDescription>
              Configure your account, billing, and platform preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Account Settings</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Profile Information:</strong> Update name, email, and contact details</p>
                <p><strong>Password Management:</strong> Change password and enable two-factor authentication</p>
                <p><strong>Notification Preferences:</strong> Configure email and in-app notifications</p>
                <p><strong>Time Zone Settings:</strong> Set your local time zone for scheduling</p>
                <p><strong>Privacy Settings:</strong> Control data sharing and privacy preferences</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Subscription Management</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Plan Details:</strong> View current subscription tier and features</li>
                <li>• <strong>Usage Monitoring:</strong> Track usage against subscription limits</li>
                <li>• <strong>Billing History:</strong> Access invoices and payment history</li>
                <li>• <strong>Plan Upgrades:</strong> Upgrade or downgrade subscription plans</li>
                <li>• <strong>Payment Methods:</strong> Manage credit cards and payment options</li>
                <li>• <strong>Cancellation:</strong> Cancel subscription with data export options</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">API & Integrations</h3>
              <div className="space-y-2 text-sm">
                <p><strong>API Keys:</strong> Manage API access for third-party integrations</p>
                <p><strong>Webhooks:</strong> Configure webhooks for external systems</p>
                <p><strong>Connected Services:</strong> Manage connections to external platforms</p>
                <p><strong>Data Export:</strong> Export your content and analytics data</p>
                <p><strong>Import Tools:</strong> Import content from other platforms</p>
                <p><strong>Backup Settings:</strong> Configure automatic data backups</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Content Preferences</h3>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Default Settings:</strong> Set default content length, tone, and style</li>
                <li>• <strong>Brand Voice:</strong> Configure your unique brand voice and messaging</li>
                <li>• <strong>SEO Preferences:</strong> Set default SEO settings and optimization rules</li>
                <li>• <strong>Link Settings:</strong> Configure default affiliate link preferences</li>
                <li>• <strong>Publishing Defaults:</strong> Set default categories, tags, and scheduling</li>
                <li>• <strong>Quality Standards:</strong> Configure content quality and review settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Getting Started Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Getting Started Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">For Beginners:</h4>
              <ul className="space-y-1">
                <li>• Start with the Dashboard to understand your current metrics</li>
                <li>• Connect your first site in Sites Management</li>
                <li>• Use Niche Insights to choose a profitable niche</li>
                <li>• Generate your first article with the AI Content Generator</li>
                <li>• Set up basic affiliate links using Link Intelligence</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Advanced Users:</h4>
              <ul className="space-y-1">
                <li>• Leverage Research Tools for competitive analysis</li>
                <li>• Implement advanced Link Management strategies</li>
                <li>• Use Publishing automation for content distribution</li>
                <li>• Optimize using detailed Content Insight analytics</li>
                <li>• Scale operations with API integrations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}