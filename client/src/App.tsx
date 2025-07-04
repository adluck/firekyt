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
import ProductResearch from "@/pages/research/ProductResearch";
import SeoAnalysis from "@/pages/research/SeoAnalysis";
import NicheInsights from "@/pages/research/NicheInsights";
import AffiliateNetworks from "@/pages/research/AffiliateNetworks";
import KeywordAnalytics from "@/pages/research/KeywordAnalytics";

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
import CreateWidget from "@/pages/ads-widgets/CreateWidget";
import ManageWidgets from "@/pages/ads-widgets/ManageWidgets";
import WidgetAnalytics from "@/pages/ads-widgets/WidgetAnalytics";
import AdSizesDemo from "@/pages/ads-widgets/AdSizesDemo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Protected routes */}
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
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
      
      <Route path="/content/manage">
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
      
      <Route path="/ads-widgets/analytics">
        <ProtectedRoute>
          <AppLayout>
            <WidgetAnalytics />
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
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <FeedbackWidget />
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
