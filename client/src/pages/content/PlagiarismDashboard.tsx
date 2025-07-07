import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Search, AlertTriangle, CheckCircle, Clock, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface PlagiarismMatch {
  url?: string;
  title?: string;
  matchedText: string;
  similarity: number;
  startIndex: number;
  endIndex: number;
}

interface PlagiarismResultWithContent {
  id: string;
  contentId: number;
  contentTitle: string;
  originalityScore: number;
  similarityScore: number;
  status: 'pending' | 'completed' | 'failed';
  provider: string;
  totalMatches: number;
  matches: PlagiarismMatch[];
  checkedAt: string;
  interpretation: {
    score: number;
    level: 'excellent' | 'good' | 'moderate' | 'poor';
    color: 'green' | 'yellow' | 'orange' | 'red';
    message: string;
    recommendation: string;
  };
}

export default function PlagiarismDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const { toast } = useToast();

  const { data: plagiarismResults = [], isLoading, error } = useQuery<PlagiarismResultWithContent[]>({
    queryKey: ['plagiarism-results'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/plagiarism-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch plagiarism results');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number, level: string) => {
    if (score >= 80) return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">Good</Badge>;
    if (score >= 40) return <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-300">Moderate</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter results
  const filteredResults = plagiarismResults.filter(result => {
    const matchesSearch = result.contentTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    
    let matchesScore = true;
    if (scoreFilter === 'excellent') matchesScore = result.originalityScore >= 80;
    else if (scoreFilter === 'good') matchesScore = result.originalityScore >= 60 && result.originalityScore < 80;
    else if (scoreFilter === 'moderate') matchesScore = result.originalityScore >= 40 && result.originalityScore < 60;
    else if (scoreFilter === 'poor') matchesScore = result.originalityScore < 40;
    
    return matchesSearch && matchesStatus && matchesScore;
  });

  // Calculate stats
  const totalChecked = plagiarismResults.length;
  const completedResults = plagiarismResults.filter(r => r.status === 'completed');
  const averageScore = completedResults.length > 0 
    ? Math.round(completedResults.reduce((sum, r) => sum + r.originalityScore, 0) / completedResults.length)
    : 0;
  const excellentCount = completedResults.filter(r => r.originalityScore >= 80).length;
  const poorCount = completedResults.filter(r => r.originalityScore < 40).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Plagiarism Dashboard</h1>
            <p className="text-muted-foreground">Monitor content originality across your publications</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Plagiarism Dashboard</h1>
            <p className="text-muted-foreground">Monitor content originality across your publications</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load plagiarism results. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Plagiarism Dashboard</h1>
          <p className="text-muted-foreground">Monitor content originality across your publications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checked</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChecked}</div>
            <p className="text-xs text-muted-foreground">
              Content pieces analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              Originality rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excellent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
            <p className="text-xs text-muted-foreground">
              80%+ originality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{poorCount}</div>
            <p className="text-xs text-muted-foreground">
              Below 40% originality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Content</label>
              <Input
                placeholder="Search by content title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Score Range</label>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                  <SelectItem value="good">Good (60-79%)</SelectItem>
                  <SelectItem value="moderate">Moderate (40-59%)</SelectItem>
                  <SelectItem value="poor">Poor (0-39%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Plagiarism Check Results</CardTitle>
          <CardDescription>
            {filteredResults.length} of {totalChecked} results shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                {totalChecked === 0 
                  ? "No content has been checked for plagiarism yet. Start by editing content and running a plagiarism check."
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{result.contentTitle}</h3>
                          {getScoreBadge(result.originalityScore, result.interpretation.level)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getStatusIcon(result.status)}
                            <span className="capitalize">{result.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <span>Checked: {formatDate(result.checkedAt)}</span>
                          <span>Provider: {result.provider}</span>
                          {result.totalMatches > 0 && (
                            <span>{result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''} found</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(result.originalityScore)}`}>
                          {result.originalityScore}%
                        </div>
                        <p className="text-sm text-muted-foreground">Originality</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={result.originalityScore} className="w-full h-2" />
                    </div>

                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{result.interpretation.message}</strong>
                        <br />
                        {result.interpretation.recommendation}
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Link href={`/content/editor/${result.contentId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Content
                        </Button>
                      </Link>
                      
                      {result.matches && result.matches.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Matches Found",
                              description: `${result.matches.length} similar sources detected. Check the content editor for detailed match information.`,
                            });
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Matches ({result.matches.length})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}