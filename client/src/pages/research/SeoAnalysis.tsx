import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  TrendingUp, 
  Target, 
  Globe, 
  Users, 
  DollarSign, 
  Lightbulb,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Eye,
  Hash,
  FileText,
  Crown
} from "lucide-react";

interface SeoAnalysis {
  id: number;
  keyword: string;
  targetRegion: string;
  searchVolume: number;
  keywordDifficulty: number;
  competitionLevel: string;
  cpcEstimate: number;
  topCompetitors: Array<{
    rank: number;
    title: string;
    link: string;
    snippet: string;
    domain: string;
  }>;
  suggestedTitles: string[];
  suggestedDescriptions: string[];
  suggestedHeaders: string[];
  relatedKeywords: string[];
  serpFeatures: string[];
  trendsData: any;
  apiSource: string;
  analysisDate: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis: SeoAnalysis;
  cached: boolean;
  message: string;
}

export default function SeoAnalysis() {
  const [keyword, setKeyword] = useState("");
  const [targetRegion, setTargetRegion] = useState("US");
  const [analysisResult, setAnalysisResult] = useState<SeoAnalysis | null>(null);

  // Fetch user's previous analyses
  const { data: previousAnalyses, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['/api/seo-analyses'],
  });

  // SEO analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { keyword: string; target_region: string }) => {
      const response = await apiRequest('POST', '/api/analyze-seo', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.userMessage || errorData.details || errorData.error || 'Analysis failed');
      }
      return response.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      queryClient.invalidateQueries({ queryKey: ['/api/seo-analyses'] });
    },
  });

  const handleAnalyze = () => {
    if (!keyword.trim()) return;
    
    analysisMutation.mutate({
      keyword: keyword.trim(),
      target_region: targetRegion
    });
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return "text-green-600 bg-green-50 border-green-200";
    if (difficulty <= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 30) return "Easy";
    if (difficulty <= 60) return "Medium";
    return "Hard";
  };

  const getCompetitionIcon = (level: string) => {
    switch (level) {
      case 'low': return <Target className="w-4 h-4 text-green-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'high': return <Crown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO & SERP Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Analyze keyword difficulty, search volume, and competitor insights
          </p>
        </div>
      </div>

      {/* Analysis Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Keyword Analysis
          </CardTitle>
          <CardDescription>
            Enter a keyword to analyze its SEO potential and competition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., best wireless headphones"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <div>
              <Label htmlFor="region">Target Region</Label>
              <Select value={targetRegion} onValueChange={setTargetRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={handleAnalyze}
              disabled={!keyword.trim() || analysisMutation.isPending}
              className="w-full md:w-auto"
            >
              {analysisMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Keyword
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Search Volume</p>
                    <p className="text-2xl font-bold">{analysisResult.searchVolume?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{analysisResult.keywordDifficulty || 'N/A'}</span>
                      <Badge className={getDifficultyColor(analysisResult.keywordDifficulty || 0)}>
                        {getDifficultyLabel(analysisResult.keywordDifficulty || 0)}
                      </Badge>
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Competition</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold capitalize">{analysisResult.competitionLevel}</span>
                      {getCompetitionIcon(analysisResult.competitionLevel)}
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Est. CPC</p>
                    <p className="text-2xl font-bold">
                      ${analysisResult.cpcEstimate ? parseFloat(analysisResult.cpcEstimate).toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Tabs defaultValue="competitors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="competitors">Top Competitors</TabsTrigger>
              <TabsTrigger value="suggestions">Content Ideas</TabsTrigger>
              <TabsTrigger value="keywords">Related Keywords</TabsTrigger>
              <TabsTrigger value="serp">SERP Features</TabsTrigger>
            </TabsList>

            <TabsContent value="competitors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Competitors</CardTitle>
                  <CardDescription>
                    Analyze the top-ranking pages for your target keyword
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {analysisResult.topCompetitors?.map((competitor, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">#{competitor.rank}</Badge>
                                <span className="text-sm text-muted-foreground">{competitor.domain}</span>
                              </div>
                              <h4 className="font-semibold text-sm mb-1">{competitor.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {competitor.snippet}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={competitor.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Suggested Titles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResult.suggestedTitles?.map((title, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm">{title}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Hash className="w-5 h-5 mr-2" />
                      Suggested Headers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResult.suggestedHeaders?.map((header, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium">{header}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Meta Descriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.suggestedDescriptions?.map((description, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <p className="text-sm">{description}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Characters: {description.length}</span>
                          <Badge variant={description.length <= 160 ? "default" : "destructive"}>
                            {description.length <= 160 ? "Good length" : "Too long"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related Keywords</CardTitle>
                  <CardDescription>
                    Expand your content strategy with these related terms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {analysisResult.relatedKeywords?.map((relatedKeyword, index) => (
                      <Badge key={index} variant="secondary" className="justify-center p-2">
                        {relatedKeyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="serp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SERP Features</CardTitle>
                  <CardDescription>
                    Special features appearing in search results for this keyword
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {analysisResult.serpFeatures?.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                  {(!analysisResult.serpFeatures || analysisResult.serpFeatures.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No special SERP features detected for this keyword</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Analysis Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Analyzed: {new Date(analysisResult.analysisDate).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <span>Source: {analysisResult.apiSource}</span>
                  </div>
                </div>
                <Badge variant="outline">
                  Region: {analysisResult.targetRegion}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Previous Analyses */}
      {previousAnalyses && previousAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>Your previous keyword analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previousAnalyses.slice(0, 6).map((analysis: SeoAnalysis) => (
                <div 
                  key={analysis.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setAnalysisResult(analysis)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">{analysis.keyword}</h4>
                    <Badge variant="outline" className={getDifficultyColor(analysis.keywordDifficulty || 0)}>
                      {analysis.keywordDifficulty || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{analysis.searchVolume?.toLocaleString() || 'N/A'} searches</span>
                    <span>{new Date(analysis.analysisDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Handling */}
      {analysisMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {analysisMutation.error instanceof Error 
              ? analysisMutation.error.message 
              : 'Failed to analyze keyword. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}