import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, ArrowRightIcon, StarIcon, PlayIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TierFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PricingTier {
  name: string;
  displayName: string;
  description: string;
  price: string;
  period: string;
  popular?: boolean;
  features: TierFeature[];
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
}

const pricingTiers: PricingTier[] = [
  {
    name: "beta_tester",
    displayName: "Beta Tester",
    description: "Full access during beta period",
    price: "Free",
    period: "Limited Time",
    popular: true,
    features: [
      { name: "Unlimited Sites", included: true },
      { name: "Unlimited Content", included: true },
      { name: "Unlimited AI Widgets", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Priority Support", included: true },
      { name: "All Publishing Platforms", included: true },
      { name: "Custom Branding", included: true },
      { name: "API Access", included: true }
    ],
    buttonText: "Join Beta",
    buttonVariant: "default"
  },
  {
    name: "free",
    displayName: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      { name: "Sites", included: true, limit: "1" },
      { name: "Content Pieces", included: true, limit: "10" },
      { name: "AI Widgets", included: true, limit: "3" },
      { name: "AI Generations", included: true, limit: "5/month" },
      { name: "Basic Analytics", included: true },
      { name: "Community Support", included: true },
      { name: "Advanced Analytics", included: false },
      { name: "Custom Branding", included: false }
    ],
    buttonText: "Get Started",
    buttonVariant: "outline"
  },
  {
    name: "basic",
    displayName: "Basic",
    description: "For serious affiliate marketers",
    price: "$29",
    period: "per month",
    features: [
      { name: "Sites", included: true, limit: "5" },
      { name: "Content Pieces", included: true, limit: "100" },
      { name: "AI Widgets", included: true, limit: "25" },
      { name: "AI Generations", included: true, limit: "50/month" },
      { name: "Advanced Analytics", included: true },
      { name: "Email Support", included: true },
      { name: "Publishing Automation", included: true },
      { name: "Custom Branding", included: false }
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "outline"
  },
  {
    name: "premium",
    displayName: "Premium",
    description: "For agencies and power users",
    price: "$99",
    period: "per month",
    features: [
      { name: "Unlimited Sites", included: true },
      { name: "Unlimited Content", included: true },
      { name: "Unlimited AI Widgets", included: true },
      { name: "Unlimited AI Generations", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Priority Support", included: true },
      { name: "Custom Branding", included: true },
      { name: "API Access", included: true },
      { name: "White-label Options", included: true }
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "outline"
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Affiliate Marketer",
    content: "FireKyt transformed my content creation process. I'm generating 3x more affiliate revenue with half the effort.",
    rating: 5
  },
  {
    name: "Mike Chen",
    role: "Digital Agency Owner",
    content: "The AI-powered widgets are game changers. Our clients are seeing 40% higher click-through rates.",
    rating: 5
  },
  {
    name: "Emma Rodriguez", 
    role: "Content Creator",
    content: "Publishing to multiple platforms simultaneously saved me 10+ hours per week. Incredible time saver!",
    rating: 5
  }
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to join the beta program.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate beta code
      const betaCode = `BETA${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const response = await apiRequest('POST', '/api/beta-signup', {
        email,
        betaCode
      });

      if (response.ok) {
        toast({
          title: "Welcome to the Beta!",
          description: "Check your email for your beta access code and next steps.",
        });
        setEmail('');
      } else {
        throw new Error('Beta signup failed');
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "There was an error signing up for the beta. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              FireKyt
            </span>
            <Badge variant="secondary" className="ml-2 text-xs bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border-orange-200">
              Beta
            </Badge>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Testimonials</a>
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border-orange-200">
            🚀 Join 50 Beta Testers - Limited Time
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-orange-500 to-pink-500 bg-clip-text text-transparent dark:from-white dark:via-orange-400 dark:to-pink-400">
            AI-Powered Affiliate Marketing Platform
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Create high-converting content, embed intelligent affiliate widgets, and automate your publishing across platforms. 
            Get full access during our exclusive beta program.
          </p>

          <form onSubmit={handleBetaSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              {isLoading ? "Joining..." : "Join Beta Free"}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Limited to 50 beta testers • Full feature access • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Everything You Need to Scale Your Affiliate Business
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            From AI content generation to intelligent widget placement, FireKyt automates your entire affiliate marketing workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "AI Content Generation",
              description: "Create blog posts, reviews, and comparisons with AI that understands affiliate marketing best practices.",
              icon: "✨"
            },
            {
              title: "Smart Affiliate Widgets",
              description: "Dynamic ad widgets that rotate products and adapt to any size. Like Google AdSense for affiliates.",
              icon: "🎯"
            },
            {
              title: "Multi-Platform Publishing",
              description: "Publish to WordPress, Ghost, Medium, LinkedIn, and custom platforms with one click.",
              icon: "🚀"
            },
            {
              title: "Link Intelligence",
              description: "AI suggests optimal affiliate link placement and tracks performance across all your content.",
              icon: "🧠"
            },
            {
              title: "Advanced Analytics",
              description: "Track clicks, conversions, and revenue with detailed insights and performance optimization.",
              icon: "📊"
            },
            {
              title: "SEO Optimization",
              description: "Built-in SEO analysis and keyword research to help your content rank higher in search results.",
              icon: "📈"
            }
          ].map((feature, index) => (
            <Card key={index} className="p-6 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Start with our beta program for full access, then choose the plan that fits your growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`relative p-6 ${tier.popular ? 'ring-2 ring-orange-500 shadow-xl scale-105' : 'shadow-lg'} bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm`}>
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="pb-6">
                <CardTitle className="text-xl">{tier.displayName}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.price !== "Free" && <span className="text-slate-500 ml-1">/{tier.period}</span>}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckIcon className={`h-4 w-4 mt-0.5 ${feature.included ? 'text-green-500' : 'text-slate-300'}`} />
                      <span className={`text-sm ${feature.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'}`}>
                        {feature.name}
                        {feature.limit && <span className="text-slate-500 ml-1">({feature.limit})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${tier.popular ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' : ''}`}
                  variant={tier.buttonVariant}
                  onClick={() => tier.name === 'beta_tester' ? document.getElementById('hero-signup')?.scrollIntoView() : null}
                >
                  {tier.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Loved by Affiliate Marketers
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            See what our beta users are saying about FireKyt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto p-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Affiliate Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join our exclusive beta program and get full access to all features. Limited to 50 testers.
          </p>
          
          <form onSubmit={handleBetaSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" id="hero-signup">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
              required
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-white text-orange-500 hover:bg-slate-100"
            >
              {isLoading ? "Joining..." : "Join Beta Now"}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-400 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              FireKyt
            </span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Terms</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300">Support</a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">
          © 2025 FireKyt. All rights reserved. Built for affiliate marketers, by affiliate marketers.
        </div>
      </footer>
    </div>
  );
}