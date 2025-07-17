import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalNavigationLoader } from "@/components/GlobalNavigationLoader";
import { PageTransition } from "@/components/PageTransition";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { PageTourProvider } from "@/components/onboarding/PageTourProvider";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

// Landing page
import LandingPage from "@/pages/LandingPage";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Protected pages
import Dashboard from "@/pages/dashboard/Dashboard";
import Sites from "@/pages/sites/Sites";
import SiteDetails from "@/pages/sites/SiteDetails";
import ContentGenerator from "@/pages/content/ContentGenerator";
import AdvancedContentGenerator from "@/pages/content/AdvancedContentGenerator";
import ContentManager from "@/pages/content/ContentManager";
import PlagiarismDashboard from "@/pages/content/PlagiarismDashboard";
import ProductResearch from "@/pages/research/ProductResearch";
import SeoAnalysis from "@/pages/research/SeoAnalysis";
import NicheInsights from "@/pages/research/NicheInsights";
import AffiliateNetworks from "@/pages/research/AffiliateNetworks";
import KeywordAnalytics from "@/pages/research/KeywordAnalytics";
import SeoAnalysisStorage from "@/components/seo/SeoAnalysisStorage";

import ContentEditor from "@/pages/content/ContentEditor";
import AnalyticsDashboard from "@/pages/analytics/AnalyticsDashboard";
import PublishingDashboard from "@/pages/publishing/PublishingDashboard";
import PublishingTest from "@/pages/publishing/PublishingTest";
import LinkedInTest from "@/pages/publishing/LinkedInTest";
import PinterestTest from "@/pages/publishing/PinterestTest";
import SocialMediaTest from "@/pages/publishing/SocialMediaTest";
import LinkDashboard from "@/pages/links/LinkDashboard";
import IntelligentLinkManager from "@/pages/links/IntelligentLinkManager";
import IntelligentLinkTester from "@/pages/testing/IntelligentLinkTester";
import LinkInserter from "@/pages/links/LinkInserter";
import AutoLinkRules from "@/pages/AutoLinkRules";
import Pricing from "@/pages/subscription/Pricing";
import Billing from "@/pages/subscription/Billing";
import SubscribeSimple from "@/pages/subscription/SubscribeSimple";
import Settings from "@/pages/settings/Settings";
import Documentation from "@/pages/docs/Documentation";
import FeedbackDashboard from "@/pages/admin/FeedbackDashboard";
import TestEmail from "@/pages/admin/TestEmail";
import CreateWidget from "@/pages/ads-widgets/CreateWidget";
import ManageWidgets from "@/pages/ads-widgets/ManageWidgets";
import AdSizesDemo from "@/pages/ads-widgets/AdSizesDemo";
import AdCopyGenerator from "@/pages/ad-copy-generator/AdCopyGenerator";
import MyAds from "@/pages/ad-copy-generator/MyAds";
import NotFound from "@/pages/not-found";
import { OnboardingRouter } from "@/components/onboarding/OnboardingRouter";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Onboarding routes */}
      <Route path="/onboarding/:step?">
        <ProtectedRoute>
          <OnboardingRouter />
        </ProtectedRoute>
      </Route>
      
      {/* Protected routes */}
      <Route path="/app">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/sites">
        <ProtectedRoute>
          <AppLayout>
            <Sites />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/sites/:siteId">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <SiteDetails siteId={params.siteId} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/content">
        <ProtectedRoute>
          <AppLayout>
            <AdvancedContentGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/generator">
        <ProtectedRoute>
          <AppLayout>
            <AdvancedContentGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/advanced-generator">
        <ProtectedRoute>
          <AppLayout>
            <AdvancedContentGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/generate">
        <ProtectedRoute>
          <AppLayout>
            <AdvancedContentGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/manage">
        <ProtectedRoute>
          <AppLayout>
            <ContentManager />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/manager">
        <ProtectedRoute>
          <AppLayout>
            <ContentManager />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/basic">
        <ProtectedRoute>
          <AppLayout>
            <ContentGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/editor">
        <ProtectedRoute>
          <AppLayout>
            <ContentEditor />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/editor/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <ContentEditor id={params.id} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/research">
        <ProtectedRoute>
          <AppLayout>
            <ProductResearch />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/research/seo">
        <ProtectedRoute>
          <AppLayout>
            <SeoAnalysis />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/research/niche">
        <ProtectedRoute>
          <AppLayout>
            <NicheInsights />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/research/affiliate-networks">
        <ProtectedRoute>
          <AppLayout>
            <AffiliateNetworks />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/research/keywords">
        <ProtectedRoute>
          <AppLayout>
            <KeywordAnalytics />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/research/seo-storage">
        <ProtectedRoute>
          <AppLayout>
            <SeoAnalysisStorage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/partner-networks">
        <ProtectedRoute>
          <AppLayout>
            <AffiliateNetworks />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/affiliate-networks">
        <ProtectedRoute>
          <AppLayout>
            <AffiliateNetworks />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      

      
      <Route path="/publishing">
        <ProtectedRoute>
          <AppLayout>
            <PublishingDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/publishing/test">
        <ProtectedRoute>
          <AppLayout>
            <PublishingTest />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/publishing/linkedin">
        <ProtectedRoute>
          <AppLayout>
            <LinkedInTest />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/publishing/pinterest">
        <ProtectedRoute>
          <AppLayout>
            <PinterestTest />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/publishing/social-media">
        <ProtectedRoute>
          <AppLayout>
            <SocialMediaTest />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/links">
        <ProtectedRoute>
          <AppLayout>
            <LinkDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/links/intelligent">
        <ProtectedRoute>
          <AppLayout>
            <IntelligentLinkManager />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/links/test">
        <ProtectedRoute>
          <AppLayout>
            <IntelligentLinkTester />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/links/inserter">
        <ProtectedRoute>
          <AppLayout>
            <LinkInserter />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/auto-link-rules">
        <ProtectedRoute>
          <AppLayout>
            <AutoLinkRules />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/ads-widgets/create">
        <ProtectedRoute>
          <AppLayout>
            <CreateWidget />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/ads-widgets">
        <ProtectedRoute>
          <AppLayout>
            <ManageWidgets />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      

      
      <Route path="/ads-widgets/sizes">
        <ProtectedRoute>
          <AppLayout>
            <AdSizesDemo />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/ad-copy-generator">
        <ProtectedRoute>
          <AppLayout>
            <AdCopyGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-ads">
        <ProtectedRoute>
          <AppLayout>
            <MyAds />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-ads/:id">
        <ProtectedRoute>
          <AppLayout>
            <MyAds />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/content/plagiarism">
        <ProtectedRoute>
          <AppLayout>
            <PlagiarismDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute>
          <AppLayout>
            <AnalyticsDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/billing">
        <ProtectedRoute>
          <AppLayout>
            <Billing />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/subscribe">
        <ProtectedRoute>
          <AppLayout>
            <SubscribeSimple />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/docs">
        <ProtectedRoute>
          <AppLayout>
            <Documentation />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/feedback">
        <ProtectedRoute>
          <AppLayout>
            <FeedbackDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/test-email">
        <ProtectedRoute>
          <AppLayout>
            <TestEmail />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <OnboardingProvider>
              <PageTourProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                  <FeedbackWidget />
                  <CookieConsent />
                </TooltipProvider>
              </PageTourProvider>
            </OnboardingProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
