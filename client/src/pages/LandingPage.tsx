import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon, SunIcon, MoonIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTheme } from '@/components/layout/ThemeProvider';



export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-gradient-to-br from-slate-50 via-orange-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src={theme === 'dark' ? '/firekyt-light-logo.png' : '/firekyt-dark-logo.png'} 
              alt="FireKyt" 
              className="h-8 w-auto"
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          </div>

          {/* Mobile theme toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </Button>
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
          
          <p className="text-xl mb-8 max-w-3xl mx-auto landing-subtitle">
            Create high-converting content, embed intelligent affiliate widgets, and automate your publishing across platforms. 
            Get full access during our exclusive beta program.
          </p>

          <div className="flex justify-center mb-8">
            <Link href="/register">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold"
              >
                Sign Up Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-300 dark:text-slate-400">
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



      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto p-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Affiliate Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of affiliate marketers building profitable content with AI-powered tools.
          </p>
          
          <Link href="/register">
            <Button 
              size="lg"
              className="bg-white text-orange-500 hover:bg-slate-100 px-8 py-4 text-lg font-semibold"
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img 
              src={theme === 'dark' ? '/firekyt-light-logo.png' : '/firekyt-dark-logo.png'} 
              alt="FireKyt" 
              className="h-6 w-auto"
            />
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