import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target, TrendingUp, Users, Zap } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

interface KeywordMetrics {
  keyword: string;
  seoImpact: number;      // 0-100
  searchVolume: number;   // 0-100 (normalized)
  competitiveness: number; // 0-100 (inverted difficulty)
  trendScore: number;     // 0-100
  commercialIntent: number; // 0-100
}

interface RadarDataPoint {
  metric: string;
  value: number;
  fullMark: 100;
}

const SAMPLE_KEYWORDS: KeywordMetrics[] = [
  {
    keyword: "best wireless headphones 2024",
    seoImpact: 85,
    searchVolume: 78,
    competitiveness: 45,
    trendScore: 92,
    commercialIntent: 88
  },
  {
    keyword: "budget bluetooth earbuds",
    seoImpact: 72,
    searchVolume: 65,
    competitiveness: 68,
    trendScore: 75,
    commercialIntent: 82
  },
  {
    keyword: "noise cancelling headphones review",
    seoImpact: 68,
    searchVolume: 58,
    competitiveness: 52,
    trendScore: 70,
    commercialIntent: 75
  }
];

export default function KeywordEffectivenessRadar() {
  const [keywords, setKeywords] = useState<KeywordMetrics[]>(SAMPLE_KEYWORDS);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordMetrics>(SAMPLE_KEYWORDS[0]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateRadarData = (keyword: KeywordMetrics): RadarDataPoint[] => [
    {
      metric: "SEO Impact",
      value: keyword.seoImpact,
      fullMark: 100
    },
    {
      metric: "Search Volume",
      value: keyword.searchVolume,
      fullMark: 100
    },
    {
      metric: "Low Competition",
      value: keyword.competitiveness,
      fullMark: 100
    },
    {
      metric: "Trend Score",
      value: keyword.trendScore,
      fullMark: 100
    },
    {
      metric: "Commercial Intent",
      value: keyword.commercialIntent,
      fullMark: 100
    }
  ];

  const getEffectivenessScore = (keyword: KeywordMetrics): number => {
    return Math.round(
      (keyword.seoImpact + keyword.searchVolume + keyword.competitiveness + keyword.trendScore + keyword.commercialIntent) / 5
    );
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const analyzeKeyword = async (keyword: string) => {
    setIsAnalyzing(true);
    
    // Simulate API analysis with realistic variations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newMetrics: KeywordMetrics = {
      keyword,
      seoImpact: Math.floor(Math.random() * 40) + 50, // 50-90
      searchVolume: Math.floor(Math.random() * 60) + 30, // 30-90
      competitiveness: Math.floor(Math.random() * 50) + 30, // 30-80
      trendScore: Math.floor(Math.random() * 50) + 40, // 40-90
      commercialIntent: Math.floor(Math.random() * 40) + 50, // 50-90
    };

    setKeywords(prev => [newMetrics, ...prev]);
    setSelectedKeyword(newMetrics);
    setNewKeyword("");
    setIsAnalyzing(false);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      analyzeKeyword(newKeyword.trim());
    }
  };

  const radarData = generateRadarData(selectedKeyword);
  const effectivenessScore = getEffectivenessScore(selectedKeyword);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Keyword Effectiveness Radar</h2>
          <p className="text-muted-foreground">
            Visual analysis of keyword potential across multiple SEO dimensions
          </p>
        </div>
      </div>

      {/* Add Keyword Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Analyze New Keyword
          </CardTitle>
          <CardDescription>
            Enter a keyword to analyze its SEO effectiveness across multiple metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyword-input">Keyword</Label>
              <Input
                id="keyword-input"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g., best wireless headphones 2024"
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim() || isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keyword List */}
        <Card>
          <CardHeader>
            <CardTitle>Analyzed Keywords</CardTitle>
            <CardDescription>
              Click on a keyword to view its radar analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {keywords.map((keyword, index) => {
              const score = getEffectivenessScore(keyword);
              const isSelected = selectedKeyword.keyword === keyword.keyword;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedKeyword(keyword)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{keyword.keyword}</h4>
                    <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"}>
                      {getScoreBadge(score)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{score}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{keyword.trendScore}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{keyword.searchVolume}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {selectedKeyword.keyword}
            </CardTitle>
            <CardDescription>
              Multi-dimensional effectiveness analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Effectiveness"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Metrics Breakdown */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(effectivenessScore)}`}>
                    {effectivenessScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Effectiveness</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SEO Impact</span>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium ${getScoreColor(selectedKeyword.seoImpact)}`}>
                        {selectedKeyword.seoImpact}%
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Search Volume</span>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium ${getScoreColor(selectedKeyword.searchVolume)}`}>
                        {selectedKeyword.searchVolume}%
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Competition</span>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium ${getScoreColor(selectedKeyword.competitiveness)}`}>
                        {selectedKeyword.competitiveness}%
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Trend Score</span>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium ${getScoreColor(selectedKeyword.trendScore)}`}>
                        {selectedKeyword.trendScore}%
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commercial Intent</span>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium ${getScoreColor(selectedKeyword.commercialIntent)}`}>
                        {selectedKeyword.commercialIntent}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Badge 
                    variant={effectivenessScore >= 70 ? "default" : effectivenessScore >= 50 ? "secondary" : "destructive"}
                    className="w-full justify-center"
                  >
                    {getScoreBadge(effectivenessScore)} Keyword
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}