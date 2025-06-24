import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Play, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  Users,
  ExternalLink,
  Download,
  Star
} from "lucide-react";

export default function Documentation() {
  const learningModules = [
    {
      title: "Getting Started",
      description: "Platform orientation and basic setup",
      duration: "30 minutes",
      difficulty: "Beginner",
      status: "Start Here",
      items: [
        "Dashboard Overview",
        "Site Connection Setup", 
        "First Article Generation",
        "Basic Link Management"
      ]
    },
    {
      title: "Content Creation Mastery",
      description: "Advanced AI content generation techniques",
      duration: "2-3 hours",
      difficulty: "Intermediate",
      status: "Week 1-2",
      items: [
        "Content Templates & Types",
        "SEO Optimization",
        "Personalization Strategies",
        "Quality Control"
      ]
    },
    {
      title: "Link Intelligence & Optimization",
      description: "AI-powered link management and performance tracking",
      duration: "1-2 hours", 
      difficulty: "Intermediate",
      status: "Week 2-3",
      items: [
        "Intelligent Link Setup",
        "Automated Insertion",
        "Performance Analytics",
        "Conversion Optimization"
      ]
    },
    {
      title: "Publishing & Distribution",
      description: "Multi-platform content distribution strategies",
      duration: "2-3 hours",
      difficulty: "Advanced",
      status: "Week 3-4",
      items: [
        "WordPress Integration",
        "Social Media Publishing",
        "Content Promotion",
        "Automation Workflows"
      ]
    }
  ];

  const quickResources = [
    {
      title: "Quick Start Guide",
      description: "Get up and running in 30 minutes",
      icon: <Clock className="h-5 w-5" />,
      color: "bg-green-500",
      action: "Start Now"
    },
    {
      title: "Video Tutorials", 
      description: "28 step-by-step video guides",
      icon: <Play className="h-5 w-5" />,
      color: "bg-blue-500",
      action: "Watch"
    },
    {
      title: "FAQ & Troubleshooting",
      description: "Common questions and solutions",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-purple-500", 
      action: "Browse"
    },
    {
      title: "Community Forum",
      description: "Connect with other users",
      icon: <Users className="h-5 w-5" />,
      color: "bg-orange-500",
      action: "Join"
    }
  ];

  const successMetrics = [
    { metric: "First Commission", timeframe: "2-4 weeks" },
    { metric: "Consistent Revenue", timeframe: "1-2 months" },
    { metric: "$500+ Monthly", timeframe: "3 months" },
    { metric: "$2000+ Monthly", timeframe: "6 months" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Complete learning resources to master affiliate marketing with FireKyt
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Updated June 2025
        </Badge>
      </div>

      {/* Quick Access Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickResources.map((resource, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${resource.color} text-white`}>
                  {resource.icon}
                </div>
                <div>
                  <CardTitle className="text-sm">{resource.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {resource.description}
              </p>
              <Button size="sm" variant="outline" className="w-full">
                {resource.action}
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Learning Path Modules */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Structured Learning Path
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {learningModules.map((module, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {module.title}
                      <Badge variant={module.difficulty === 'Beginner' ? 'default' : module.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}>
                        {module.difficulty}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {module.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {module.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {module.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {module.items.length} topics
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {module.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    Start Module
                    <Play className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Success Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Success Timeline
          </CardTitle>
          <CardDescription>
            Typical milestones for dedicated users following the learning path
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {successMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {metric.timeframe}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.metric}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Results vary based on niche selection, content quality, and time investment. 
              These timelines represent typical outcomes for users who consistently follow best practices.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Download Resources</CardTitle>
            <CardDescription>
              Offline guides and templates for your reference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              Learning Path PDF
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Content Templates
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              SEO Checklist
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Affiliate Program Guide
              <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get Support</CardTitle>
            <CardDescription>
              Multiple ways to get help when you need it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              Community Forum
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Live Chat Support
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Schedule Consultation
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Report an Issue
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}