import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingHelpButton } from "@/components/onboarding/OnboardingTrigger";
import { HelpCircle, Play, BookOpen, Compass } from "lucide-react";

export default function Documentation() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">FireKyt Hands-On Tutorial</h1>
        <p className="text-xl text-muted-foreground">
          Follow along and actually use FireKyt to create your first profitable affiliate article
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="default" className="text-sm">Interactive Tutorial</Badge>
          <Badge variant="outline" className="text-sm">Follow Along</Badge>
        </div>
        <div className="bg-muted p-4 rounded-lg border max-w-2xl mx-auto">
          <p className="text-sm font-medium">
            ⏱️ Time needed: 30-45 minutes | 🎯 Goal: Publish your first affiliate article and start earning
          </p>
        </div>
      </div>

      {/* Need Help Section */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-orange-600" />
            Need Help Getting Started?
          </CardTitle>
          <CardDescription className="text-base">
            Take a guided tour of the platform or explore our comprehensive documentation below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <OnboardingHelpButton />
            <Button variant="outline" className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Documentation
            </Button>
            <Button variant="outline" className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30">
              <Compass className="h-4 w-4 mr-2" />
              Quick Start Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>What You'll Accomplish Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">By the end of this tutorial:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Connect your WordPress site to FireKyt
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Research and choose a profitable niche
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Create professional affiliate widgets
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Generate high-converting ad copy with AI
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Create your first AI article with affiliate links
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Publish content and set up analytics tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Join affiliate programs and start earning
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">What you'll need:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  A WordPress website (or blog platform)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Admin access to your site
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  An affiliate program account (Amazon Associates recommended)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  30-45 minutes of focused time
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Getting Oriented */}
      <section id="dashboard">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
              First, Let's Get Our Bearings
            </CardTitle>
            <CardDescription>
              Take 2 minutes to understand what you're looking at and what you can do
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Look at your dashboard right now</h4>
              <p className="text-sm mb-3">
                You should see metrics showing your current status. Here's what each number means for YOU:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-bold">Your Sites</p>
                  <p className="text-muted-foreground">Shows how many websites you have connected. If you need to add or manage sites, we'll do that in the next step.</p>
                </div>
                <div>
                  <p className="font-bold">Content Created</p>
                  <p className="text-muted-foreground">Total articles you've generated. Split between published (earning potential) and drafts (need finishing).</p>
                </div>
                <div>
                  <p className="font-bold">Traffic & Clicks</p>
                  <p className="text-muted-foreground">Real people clicking your affiliate links. Even small numbers represent money potential!</p>
                </div>
                <div>
                  <p className="font-bold">Revenue Generated</p>
                  <p className="text-muted-foreground">Your earnings so far. If it's $0, don't worry - this tutorial will help you start converting clicks to commissions.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">💡 What This Means for You</h4>
              <p className="text-sm text-muted-foreground">
                Whatever your current numbers show, this tutorial will help you improve them. If you have traffic but no revenue, we'll optimize for conversions. 
                If you're just starting, we'll build everything from scratch. Even modest traffic can generate meaningful income with the right approach.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 2: Niche Research */}
      <section id="niche-research">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
              Research and Choose a Profitable Niche (15 minutes)
            </CardTitle>
            <CardDescription>
              Find a niche that people are actively buying from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Use the Niche Research tool</h4>
              <p className="text-sm mb-3">
                Navigate to the <strong>Niche Research</strong> section in your dashboard. Enter 3-5 topics you're interested in or have knowledge about.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Examples of profitable niches:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Home fitness equipment and accessories</li>
                  <li>Pet care products and training tools</li>
                  <li>Kitchen gadgets and cooking tools</li>
                  <li>Tech accessories and productivity tools</li>
                  <li>Beauty and skincare products</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">🔍 What the AI Analysis Shows You</h4>
              <p className="text-sm text-muted-foreground">
                The system will analyze search volume, competition level, and affiliate program availability. 
                Look for niches with <strong>medium-high demand</strong> and <strong>moderate competition</strong> - 
                these offer the best opportunity for new affiliates to succeed.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 3: Create Affiliate Widgets */}
      <section id="widget-creation">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
              Create Professional Affiliate Widgets (10 minutes)
            </CardTitle>
            <CardDescription>
              Build customizable affiliate ad widgets for your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Create your first affiliate widget</h4>
              <p className="text-sm mb-3">
                Navigate to <strong>Ads Widgets</strong> → <strong>Create Widget</strong>. These are professional advertisement units you can embed anywhere on your website.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Widget Creation Steps:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Choose a descriptive name (e.g., "Gaming Headsets Collection")</li>
                  <li>Add compelling description for your widget</li>
                  <li>Select appropriate widget size for your use case</li>
                  <li>Choose from professional design templates</li>
                  <li>Add 2-3 affiliate products with images and URLs</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">📐 Widget Size Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-bold">728x90 Leaderboard</p>
                  <p className="text-muted-foreground">Perfect for blog headers and post tops</p>
                </div>
                <div>
                  <p className="font-bold">300x250 Rectangle</p>
                  <p className="text-muted-foreground">Ideal for sidebar and in-content placement</p>
                </div>
                <div>
                  <p className="font-bold">160x600 Skyscraper</p>
                  <p className="text-muted-foreground">Great for desktop sidebar placement</p>
                </div>
                <div>
                  <p className="font-bold">320x50 Mobile Banner</p>
                  <p className="text-muted-foreground">Optimized for mobile content</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Embed widgets in your content</h4>
              <p className="text-sm mb-3">
                After creating your widget, get the embed code from the "Embed Code" tab. This HTML code can be pasted into:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>WordPress:</strong> HTML/Code editor view</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>Blog Posts:</strong> Where you want ads to appear</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>Sidebar Areas:</strong> For ongoing revenue generation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 4: AI-Powered Ad Copy Generation */}
      <section id="ad-copy-generation">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
              Create High-Converting Ad Copy with AI (15 minutes)
            </CardTitle>
            <CardDescription>
              Generate platform-specific ad copy that converts browsers into buyers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Generate targeted ad copy for your products</h4>
              <p className="text-sm mb-3">
                Navigate to <strong>Ad Copy</strong> → <strong>Generate Ad Copy</strong>. The AI will create platform-specific marketing copy that's proven to convert.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Step-by-step process:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Enter your product name and key features</li>
                  <li>Add target audience details (age, interests, pain points)</li>
                  <li>Select marketing platforms (Google Ads, Facebook, Instagram, etc.)</li>
                  <li>Choose tone and style for your brand voice</li>
                  <li>Generate multiple variations for A/B testing</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">📊 What You'll Get for Each Platform</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Google Ads</p>
                  <p className="text-muted-foreground text-xs">Headlines, descriptions, and extensions optimized for search intent</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Facebook & Instagram</p>
                  <p className="text-muted-foreground text-xs">Engaging social copy with hashtags and call-to-actions</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Email Marketing</p>
                  <p className="text-muted-foreground text-xs">Subject lines and body content for promotional emails</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Amazon Listings</p>
                  <p className="text-muted-foreground text-xs">Product titles and bullet points for marketplace sales</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Save and organize your campaigns</h4>
              <p className="text-sm mb-3">
                Each generated campaign is automatically saved in <strong>My Campaigns</strong> for future reference. You can:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Copy any variation to clipboard for immediate use</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Generate additional variations for the same product</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Track which copy performs best across platforms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Export campaigns for use in external advertising tools</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">💡 Pro Tip: Test Multiple Variations</h4>
              <p className="text-sm text-muted-foreground">
                Generate 3-5 different versions of your ad copy and test them simultaneously. 
                Small changes in wording can increase click-through rates by 200-300%. 
                The AI creates variations based on proven marketing psychology principles.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 5: AI Content Generation */}
      <section id="content-generation">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
              Generate Your First AI Article with Affiliate Links (20 minutes)
            </CardTitle>
            <CardDescription>
              Create content that converts visitors into buyers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Create your money-making content</h4>
              <p className="text-sm mb-3">
                Go to <strong>Content Creation</strong> → <strong>New Article</strong>. Choose one of these high-converting article types:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Product Comparison</p>
                  <p className="text-muted-foreground text-xs">"Best X vs Y for [specific use case]"</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Buying Guide</p>
                  <p className="text-muted-foreground text-xs">"Complete Guide to Buying [product type]"</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Problem-Solution</p>
                  <p className="text-muted-foreground text-xs">"How to [solve problem] with [product category]"</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Top Lists</p>
                  <p className="text-muted-foreground text-xs">"7 Best [products] for [specific audience]"</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">🔗 ACTION: Add intelligent affiliate links</h4>
              <p className="text-sm text-muted-foreground">
                When creating your article, the AI will suggest optimal placement for affiliate links. 
                Accept the suggested placements - they're based on conversion data from successful affiliates. 
                The system automatically creates trackable links that monitor performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 6: Connect Site and Publish */}
      <section id="publishing">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">6</span>
              Connect Your Site and Publish the Article (15 minutes)
            </CardTitle>
            <CardDescription>
              Connect your platform and get your content live
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Connect your publishing platform</h4>
              <p className="text-sm mb-3">
                Go to <strong>Publishing</strong> → <strong>Connected Sites</strong>. Choose your platform:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>WordPress:</strong> Enter your site URL and admin credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>Ghost:</strong> Add your site URL and integration token</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>Medium:</strong> Connect via OAuth (one-click setup)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span><strong>Custom API:</strong> Enter your API endpoint details</span>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Publish your article</h4>
              <p className="text-sm mb-3">
                Once connected, select your article and click <strong>Publish Now</strong>. Choose appropriate categories like "Reviews" or "Affiliate Marketing".
              </p>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">📱 Bonus: Social Media Amplification</h4>
              <p className="text-sm text-muted-foreground">
                After publishing, automatically share to LinkedIn and Pinterest using the <strong>Social Integration</strong> feature. 
                This can increase your traffic by 40-60% in the first week.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 7: Analytics */}
      <section id="analytics-setup">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">7</span>
              Set Up Analytics Tracking (5 minutes)
            </CardTitle>
            <CardDescription>
              Monitor your earnings and optimize performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Enable tracking for your published content</h4>
              <p className="text-sm mb-3">
                Your affiliate links are automatically tracked, but you need to install the tracking code on your site for full analytics:
              </p>
              <div className="space-y-2 text-sm">
                <p>1. Go to <strong>Analytics</strong> → <strong>Tracking Setup</strong></p>
                <p>2. Copy the provided tracking code</p>
                <p>3. Paste it in your website's header (before closing &lt;/head&gt; tag)</p>
                <p>4. Click "Verify Installation" to confirm it's working</p>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">📊 What You'll Track</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-bold">Real-time Metrics</p>
                  <p className="text-muted-foreground text-xs">Page views, clicks, time on page</p>
                </div>
                <div>
                  <p className="font-bold">Conversion Data</p>
                  <p className="text-muted-foreground text-xs">Link clicks to actual sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Step 8: Affiliate Programs */}
      <section id="affiliate-programs">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">8</span>
              Set Up Your Affiliate Program Account (15 minutes)
            </CardTitle>
            <CardDescription>
              Join programs that pay you for successful referrals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Join Amazon Associates (Recommended for Beginners)</h4>
              <p className="text-sm mb-3">
                Amazon Associates is the easiest to get approved and has products for every niche:
              </p>
              <div className="space-y-2 text-sm">
                <p>1. Go to <strong>associate-program.amazon.com</strong></p>
                <p>2. Click "Join Now for Free"</p>
                <p>3. Enter your website URL (the one you just published to)</p>
                <p>4. Choose your payment method (direct deposit recommended)</p>
                <p>5. Get approved (usually within 24-48 hours)</p>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">💰 Additional High-Paying Programs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">Impact Radius</p>
                  <p className="text-muted-foreground text-xs">Higher commissions, tech/business products</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">ShareASale</p>
                  <p className="text-muted-foreground text-xs">Fashion, home, lifestyle brands</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">ClickBank</p>
                  <p className="text-muted-foreground text-xs">Digital products, courses, software</p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-bold">CJ Affiliate</p>
                  <p className="text-muted-foreground text-xs">Major brands, consistent payouts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Getting Started Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Complete Tutorial Success</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">Congratulations! You're Ready to Earn</h4>
            <p className="text-sm text-muted-foreground mb-3">
              You've now completed the full affiliate marketing setup: niche research, content creation, publishing, analytics tracking, and affiliate program enrollment. Your first commissions should start appearing within 1-2 weeks.
            </p>
            <p className="text-sm text-muted-foreground">
              Next steps: Create 2-3 more articles in your chosen niche, promote on social media, and monitor your analytics for optimization opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}