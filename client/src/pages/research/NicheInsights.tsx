import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, TrendingUp, BarChart3, Users, DollarSign, Lightbulb } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface NicheAnalysis {
  viability: {
    score: number;
    reasoning: string;
    profitabilityFactors: string[];
  };
  competition: {
    level: 'Low' | 'Medium' | 'High';
    competitors: Array<{
      type: string;
      strengths: string[];
      weaknesses: string[];
    }>;
  };
  opportunities: {
    gaps: string[];
    contentIdeas: string[];
    longTailKeywords: string[];
  };
  monetization: {
    primaryPrograms: string[];
    complementaryCategories: string[];
    revenueStreams: string[];
  };
  audience: {
    demographics: string;
    interests: string[];
    reachChannels: string[];
    painPoints: string[];
  };
  recommendations: string[];
}

export default function NicheInsights() {
  const [targetMarket, setTargetMarket] = useState('');
  const [analysis, setAnalysis] = useState<NicheAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (market: string) => {
      const response = await apiRequest('POST', '/api/analyze-affiliate-niche', {
        target_market_or_product: market
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Niche insights have been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze niche. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMarket.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a target market or product.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(targetMarket);
  };

  const getViabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Niche & Competitor Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Get AI-powered market analysis and actionable recommendations for affiliate marketing success
        </p>
      </div>

      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Analysis
          </CardTitle>
          <CardDescription>
            Enter a target market or product category to analyze its affiliate potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <Label htmlFor="target-market">Target Market or Product</Label>
              <Input
                id="target-market"
                placeholder="e.g., eco-friendly home goods, electric bikes, fitness supplements"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              type="submit" 
              disabled={analyzeMutation.isPending}
              className="w-full sm:w-auto"
            >
              {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Niche & Competitors'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  AI Analysis Disclaimer
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This AI analysis provides insights to inform your decisions but should not replace thorough human validation and market research.
                </p>
              </div>
            </div>
          </div>

          {/* Viability Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Niche Viability & Profitability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getViabilityColor(analysis.viability.score)}`}>
                      {analysis.viability.score}/100
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Viability Score</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">{analysis.viability.reasoning}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Key Profitability Factors:</h4>
                  <div className="grid gap-2">
                    {analysis.viability.profitabilityFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competition Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Competition Landscape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Competition Level:</span>
                  <Badge className={getCompetitionColor(analysis.competition.level)}>
                    {analysis.competition.level}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {analysis.competition.competitors.map((competitor, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-lg">{competitor.type}</h4>
                      
                      <div>
                        <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                          Strengths:
                        </h5>
                        <ul className="text-sm space-y-1">
                          {competitor.strengths.map((strength, i) => (
                            <li key={i} className="text-gray-600 dark:text-gray-400">• {strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                          Weaknesses:
                        </h5>
                        <ul className="text-sm space-y-1">
                          {competitor.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-gray-600 dark:text-gray-400">• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Untapped Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-3">Market Gaps</h4>
                  <div className="space-y-2">
                    {analysis.opportunities.gaps.map((gap, index) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Content Ideas</h4>
                  <div className="space-y-2">
                    {analysis.opportunities.contentIdeas.map((idea, index) => (
                      <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">{idea}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Long-tail Keywords</h4>
                  <div className="space-y-2">
                    {analysis.opportunities.longTailKeywords.map((keyword, index) => (
                      <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <p className="text-sm text-purple-800 dark:text-purple-200">{keyword}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monetization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monetization Avenues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="font-medium mb-3">Primary Programs</h4>
                  <div className="space-y-2">
                    {analysis.monetization.primaryPrograms.map((program, index) => (
                      <Badge key={index} variant="secondary" className="block text-center py-2">
                        {program}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Complementary Categories</h4>
                  <div className="space-y-2">
                    {analysis.monetization.complementaryCategories.map((category, index) => (
                      <Badge key={index} variant="outline" className="block text-center py-2">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Revenue Streams</h4>
                  <div className="space-y-2">
                    {analysis.monetization.revenueStreams.map((stream, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm">{stream}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Demographics</h4>
                  <p className="text-gray-700 dark:text-gray-300">{analysis.audience.demographics}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-medium mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.audience.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Reach Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.audience.reachChannels.map((channel, index) => (
                        <Badge key={index} variant="outline">{channel}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Pain Points</h4>
                    <div className="space-y-2">
                      {analysis.audience.painPoints.map((point, index) => (
                        <div key={index} className="text-sm text-red-700 dark:text-red-400">
                          • {point}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Actionable Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-blue-800 dark:text-blue-200">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}