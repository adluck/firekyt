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

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Protected pages
import Dashboard from "@/pages/dashboard/Dashboard";
import Sites from "@/pages/sites/Sites";
import SiteDetails from "@/pages/sites/SiteDetails";
import ContentGenerator from "@/pages/content/ContentGenerator";
import AdvancedContentGenerator from "@/pages/content/AdvancedContentGenerator";
import ProductResearch from "@/pages/research/ProductResearch";
import Pricing from "@/pages/subscription/Pricing";
import Billing from "@/pages/subscription/Billing";
import Subscribe from "@/pages/subscription/Subscribe";
import Settings from "@/pages/settings/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/pricing" component={Pricing} />
      
      {/* Protected routes */}
      <Route path="/">
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
      
      <Route path="/sites/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <SiteDetails siteId={params.id} />
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
      
      <Route path="/content/basic">
        <ProtectedRoute>
          <AppLayout>
            <ContentGenerator />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/research">
        <ProtectedRoute>
          <AppLayout>
            <ProductResearch />
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
            <Subscribe />
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
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
