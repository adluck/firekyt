import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
                  Generate your first AI article with affiliate links
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Publish the article to your site
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Set up analytics tracking
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

      {/* Step 2: Connect Your Site */}
      <section id="sites">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
              Connect Your WordPress Site (5 minutes)
            </CardTitle>
            <CardDescription>
              Let's connect your site so you can publish and start earning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 ACTION: Right now, do this</h4>
              <ol className="space-y-3 text-sm list-decimal ml-6">
                <li>
                  <strong>Click "Sites" in the left sidebar</strong>
                  <p className="text-muted-foreground mt-1">You'll see your connected sites list</p>
                </li>
                <li>
                  <strong>Click "Connect New Site" button</strong>
                  <p className="text-muted-foreground mt-1">A form will pop up</p>
                </li>
                <li>
                  <strong>Fill in YOUR site details:</strong>
                  <div className="bg-background p-3 rounded mt-2 border">
                    <p className="font-mono text-sm">Site URL: https://yoursite.com</p>
                    <p className="font-mono text-sm">Username: your_admin_username</p>
                    <p className="font-mono text-sm">Password: your_admin_password</p>
                  </div>
                </li>
                <li>
                  <strong>Click "Test Connection"</strong>
                  <p className="text-muted-foreground mt-1">Wait for the green checkmark</p>
                </li>
                <li>
                  <strong>Click "Save Site"</strong>
                  <p className="text-muted-foreground mt-1">Your site is now connected!</p>
                </li>
              </ol>
            </div>

            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <h4 className="font-semibold text-destructive mb-2">⚠️ If connection fails</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check your WordPress login credentials</li>
                <li>• Make sure you're using an admin account</li>
                <li>• Try disabling security plugins temporarily</li>
                <li>• Use Application Passwords for better security</li>
              </ul>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">✅ Success? Do this next</h4>
              <p className="text-sm text-muted-foreground">
                Click on your connected site name and set your default category to "Reviews" or "Affiliate". 
                This is where your articles will be published.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Getting Started Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Need Help Getting Started?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">Ready to Make Money?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Follow this tutorial step-by-step and you'll have your first affiliate article published and earning potential within 45 minutes.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Check the sidebar navigation or contact support. Your success is our priority.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}