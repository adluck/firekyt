import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, TestTube, Sparkles, CheckCircle, Target } from 'lucide-react';
import { parseContextMatch } from '@/utils/parseContextMatch';

const sampleContent = `Are you looking for the ultimate gaming experience? Today's gaming laptops have evolved tremendously, offering desktop-level performance in portable packages. Whether you're a competitive esports player or enjoy AAA titles, having the right gaming laptop can make all the difference.

Modern gaming laptops feature powerful GPUs, high-refresh displays, and advanced cooling systems. The latest models include RTX 4080 graphics cards, 32GB RAM, and lightning-fast SSD storage. Gaming performance has never been better, with many laptops achieving 144fps at 1440p resolution.

When choosing a gaming laptop, consider factors like display quality, keyboard responsiveness, and thermal management. The best gaming laptops balance performance, portability, and price. Professional gamers often recommend models with mechanical keyboards and high refresh rate displays for competitive gaming.

Audio quality is equally important for immersive gaming. Many gamers invest in high-quality wireless headphones to complement their setup. The best wireless headphones for gaming offer low latency, crystal-clear audio, and comfortable long-session wear.

For serious gamers, the combination of a powerful laptop and premium headphones creates the perfect mobile gaming setup.`;

export default function IntelligentLinkTester() {
  const [testContent, setTestContent] = useState(sampleContent);
  const [testKeywords, setTestKeywords] = useState('gaming laptop, wireless headphones, performance, review');
  const [testResults, setTestResults] = useState<any>(null);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTestDataMutation = useMutation({
    mutationFn: async () => {
      // Create category
      const categoryResponse = await apiRequest('POST', '/api/links/categories', {
        name: 'Tech Products',
        description: 'Electronics and gadgets for testing',
        color: '#3b82f6'
      });

      // Create test links
      const link1Response = await apiRequest('POST', '/api/links/intelligent', {
        title: 'Best Gaming Laptop 2024',
        originalUrl: 'https://amazon.com/gaming-laptop?tag=test123',
        description: 'High-performance gaming laptop recommendation',
        keywords: ['gaming', 'laptop', 'performance', 'review'],
        targetKeywords: ['best gaming laptop', 'top gaming laptop 2024'],
        priority: 80,
        insertionStrategy: 'ai-suggested',
        affiliateData: {
          commissionRate: '5.5',
          trackingId: 'tech_laptop_001'
        }
      });

      const link2Response = await apiRequest('POST', '/api/links/intelligent', {
        title: 'Top Wireless Headphones',
        originalUrl: 'https://amazon.com/wireless-headphones?tag=test123',
        description: 'Premium wireless headphones for gaming and music',
        keywords: ['headphones', 'wireless', 'audio', 'gaming'],
        targetKeywords: ['best wireless headphones', 'gaming headphones'],
        priority: 75,
        insertionStrategy: 'ai-suggested',
        affiliateData: {
          commissionRate: '4.2',
          trackingId: 'audio_headphones_002'
        }
      });

      return { category: categoryResponse, links: [link1Response, link2Response] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links/intelligent'] });
      toast({ title: 'Success', description: 'Test data created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const runAITestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/links/ai-suggest', {
        contentId: 1,
        keywords: testKeywords.split(',').map(k => k.trim()).filter(k => k),
        context: testContent
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(data);
      toast({ 
        title: 'AI Test Complete', 
        description: `Generated ${data.totalFound} suggestions with AI analysis` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateTestData = async () => {
    setIsCreatingTestData(true);
    try {
      await createTestDataMutation.mutateAsync();
    } finally {
      setIsCreatingTestData(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Intelligent Link Testing</h1>
          <p className="text-muted-foreground">Test the AI-powered link suggestion system</p>
        </div>
      </div>

      {/* Step 1: Create Test Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Step 1: Create Test Data
          </CardTitle>
          <CardDescription>
            Set up sample intelligent links and categories for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCreateTestData}
            disabled={isCreatingTestData || createTestDataMutation.isPending}
            className="w-full"
          >
            {isCreatingTestData || createTestDataMutation.isPending ? 
              'Creating Test Data...' : 
              'Create Sample Links & Categories'
            }
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Test AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Step 2: Test AI Suggestions
          </CardTitle>
          <CardDescription>
            Analyze content and generate intelligent link suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-content">Test Content</Label>
            <Textarea
              id="test-content"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              rows={8}
              placeholder="Enter content to analyze for link placement..."
            />
          </div>
          
          <div>
            <Label htmlFor="test-keywords">Target Keywords</Label>
            <Input
              id="test-keywords"
              value={testKeywords}
              onChange={(e) => setTestKeywords(e.target.value)}
              placeholder="gaming laptop, wireless headphones, review"
            />
          </div>
          
          <Button
            onClick={() => runAITestMutation.mutate()}
            disabled={runAITestMutation.isPending}
            className="w-full"
          >
            {runAITestMutation.isPending ? (
              <>Analyzing Content...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run AI Analysis Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Test Results
            </CardTitle>
            <CardDescription>
              AI-generated link suggestions and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  Total Suggestions: {testResults.totalFound}
                </Badge>
                <Badge variant="outline">
                  Status: {testResults.success ? 'Success' : 'Failed'}
                </Badge>
              </div>

              {testResults.suggestions?.map((suggestion: any, index: number) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">"{suggestion.suggestedAnchorText}"</h4>
                        <Badge className={
                          parseFloat(suggestion.confidence) >= 0.8 ? 'bg-green-100 text-green-800' :
                          parseFloat(suggestion.confidence) >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {Math.round(parseFloat(suggestion.confidence) * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {suggestion.reasoning}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Position: {suggestion.suggestedPosition}</span>
                        <span>•</span>
                        <span>Link ID: {suggestion.suggestedLinkId}</span>
                        <span>•</span>
                        <span>Status: {suggestion.status}</span>
                      </div>

                      {suggestion.contextMatch && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {parseContextMatch(suggestion.contextMatch).map((match: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {match}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="mt-4 p-4 bg-muted rounded-lg border">
                <h4 className="font-semibold mb-2 text-foreground">Test Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Navigate to /links/intelligent to see the full interface</li>
                  <li>Use the "AI Suggestions" tab to test with your own content</li>
                  <li>Switch to "Link Preview" tab to see visual placement</li>
                  <li>Accept/reject suggestions to test the workflow</li>
                  <li>Check the "Performance" tab for analytics</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}