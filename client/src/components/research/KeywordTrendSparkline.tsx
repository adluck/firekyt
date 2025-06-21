import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Search, Calendar, BarChart3, X } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface TrendDataPoint {
  period: string;
  value: number;
  date: string;
}

interface KeywordTrend {
  keyword: string;
  currentVolume: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  data: TrendDataPoint[];
  category: string;
  difficulty: number;
}

const SAMPLE_TRENDS: KeywordTrend[] = [
  {
    keyword: "wireless headphones",
    currentVolume: 165000,
    trend: "up",
    trendPercentage: 12.5,
    category: "Electronics",
    difficulty: 78,
    data: [
      { period: "W1", value: 145000, date: "2024-05-01" },
      { period: "W2", value: 152000, date: "2024-05-08" },
      { period: "W3", value: 148000, date: "2024-05-15" },
      { period: "W4", value: 156000, date: "2024-05-22" },
      { period: "W5", value: 162000, date: "2024-05-29" },
      { period: "W6", value: 165000, date: "2024-06-05" },
    ]
  },
  {
    keyword: "best laptop 2024",
    currentVolume: 89000,
    trend: "up",
    trendPercentage: 23.8,
    category: "Technology",
    difficulty: 85,
    data: [
      { period: "W1", value: 72000, date: "2024-05-01" },
      { period: "W2", value: 75000, date: "2024-05-08" },
      { period: "W3", value: 78000, date: "2024-05-15" },
      { period: "W4", value: 82000, date: "2024-05-22" },
      { period: "W5", value: 86000, date: "2024-05-29" },
      { period: "W6", value: 89000, date: "2024-06-05" },
    ]
  },
  {
    keyword: "smartphone reviews",
    currentVolume: 134000,
    trend: "down",
    trendPercentage: -8.2,
    category: "Technology",
    difficulty: 72,
    data: [
      { period: "W1", value: 146000, date: "2024-05-01" },
      { period: "W2", value: 142000, date: "2024-05-08" },
      { period: "W3", value: 138000, date: "2024-05-15" },
      { period: "W4", value: 136000, date: "2024-05-22" },
      { period: "W5", value: 135000, date: "2024-05-29" },
      { period: "W6", value: 134000, date: "2024-06-05" },
    ]
  },
  {
    keyword: "gaming monitor",
    currentVolume: 98000,
    trend: "stable",
    trendPercentage: 1.2,
    category: "Gaming",
    difficulty: 65,
    data: [
      { period: "W1", value: 97000, date: "2024-05-01" },
      { period: "W2", value: 98500, date: "2024-05-08" },
      { period: "W3", value: 97500, date: "2024-05-15" },
      { period: "W4", value: 98000, date: "2024-05-22" },
      { period: "W5", value: 98200, date: "2024-05-29" },
      { period: "W6", value: 98000, date: "2024-06-05" },
    ]
  }
];

export default function KeywordTrendSparkline() {
  const [trends, setTrends] = useState<KeywordTrend[]>(SAMPLE_TRENDS);
  const [timeframe, setTimeframe] = useState("6w");
  const [sortBy, setSortBy] = useState("volume");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newKeyword, setNewKeyword] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      case "stable":
        return "text-yellow-600 dark:text-yellow-400";
    }
  };

  const getLineColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "#22c55e";
      case "down":
        return "#ef4444";
      case "stable":
        return "#eab308";
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toString();
  };

  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty >= 80) return { label: "High", variant: "destructive" as const };
    if (difficulty >= 60) return { label: "Medium", variant: "secondary" as const };
    return { label: "Low", variant: "default" as const };
  };

  const getCategories = () => {
    const categories = Array.from(new Set(trends.map(t => t.category)));
    return categories;
  };

  const filteredTrends = trends
    .filter(trend => filterCategory === "all" || trend.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "volume":
          return b.currentVolume - a.currentVolume;
        case "trend":
          return Math.abs(b.trendPercentage) - Math.abs(a.trendPercentage);
        case "difficulty":
          return a.difficulty - b.difficulty;
        default:
          return 0;
      }
    });

  const analyzeNewKeyword = async (keyword: string) => {
    setIsAnalyzing(true);
    
    // Simulate API analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const trendDirection = Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable";
    const baseVolume = Math.floor(Math.random() * 150000) + 20000;
    const trendPercent = trendDirection === "stable" 
      ? Math.random() * 4 - 2 
      : (Math.random() * 20 + 5) * (trendDirection === "down" ? -1 : 1);

    // Generate trend data
    const data: TrendDataPoint[] = [];
    let currentValue = baseVolume * (1 - trendPercent / 100);
    
    for (let i = 0; i < 6; i++) {
      data.push({
        period: `W${i + 1}`,
        value: Math.round(currentValue),
        date: new Date(Date.now() - (5 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      currentValue += (baseVolume - currentValue) / (6 - i);
    }

    const newTrend: KeywordTrend = {
      keyword,
      currentVolume: baseVolume,
      trend: trendDirection,
      trendPercentage: Math.round(trendPercent * 10) / 10,
      category: ["Technology", "Electronics", "Gaming", "Health", "Fashion"][Math.floor(Math.random() * 5)],
      difficulty: Math.floor(Math.random() * 40) + 40,
      data
    };

    setTrends(prev => [newTrend, ...prev]);
    setNewKeyword("");
    setIsAnalyzing(false);
  };

  const deleteTrend = (keywordToDelete: string) => {
    setTrends(prev => prev.filter(trend => trend.keyword !== keywordToDelete));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      analyzeNewKeyword(newKeyword.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Keyword Trend Sparklines</h2>
          <p className="text-muted-foreground">
            Track search volume trends with Google Trends integration
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Add Keyword</Label>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Enter keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || isAnalyzing}
                >
                  {isAnalyzing ? "..." : "Add"}
                </Button>
              </div>
            </div>

            <div>
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4w">4 weeks</SelectItem>
                  <SelectItem value="6w">6 weeks</SelectItem>
                  <SelectItem value="3m">3 months</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sort by</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Search Volume</SelectItem>
                  <SelectItem value="trend">Trend Strength</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategories().map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrends.map((trend, index) => {
          const difficultyBadge = getDifficultyBadge(trend.difficulty);
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTrend(trend.keyword)}
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between pr-8">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{trend.keyword}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{trend.category}</span>
                      <Badge variant={difficultyBadge.variant} className="text-xs">
                        {difficultyBadge.label}
                      </Badge>
                    </CardDescription>
                  </div>
                  {getTrendIcon(trend.trend)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Volume and Trend */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{formatVolume(trend.currentVolume)}</div>
                    <div className="text-xs text-muted-foreground">Monthly searches</div>
                  </div>
                  <div className={`text-right ${getTrendColor(trend.trend)}`}>
                    <div className="font-semibold">
                      {trend.trendPercentage > 0 ? '+' : ''}{trend.trendPercentage}%
                    </div>
                    <div className="text-xs">vs last period</div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.data}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={getLineColor(trend.trend)}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="text-sm font-medium">
                                  {formatVolume(payload[0].value as number)} searches
                                </p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span className="font-medium">{trend.difficulty}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Period:</span>
                    <span className="font-medium">{timeframe}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTrends.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No trends found for the selected filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}