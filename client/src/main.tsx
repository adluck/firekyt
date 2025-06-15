import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";

function WorkingApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">Affiliate Marketing Platform</h1>
          <div className="grid gap-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Welcome to Your Dashboard</h2>
              <p className="text-muted-foreground mb-4">
                Your AI-powered affiliate content generation platform is ready to help you create 
                high-converting content and manage your affiliate marketing campaigns.
              </p>
              <div className="flex gap-4">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                  Get Started
                </button>
                <button className="border border-border px-4 py-2 rounded-md hover:bg-accent">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<WorkingApp />);
