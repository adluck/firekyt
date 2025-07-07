import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface PlagiarismMatch {
  url?: string;
  title?: string;
  matchedText: string;
  similarity: number;
  startIndex: number;
  endIndex: number;
}

interface PlagiarismResult {
  id: string;
  contentId: number;
  originalityScore: number;
  similarityScore: number;
  matches: PlagiarismMatch[];
  status: 'pending' | 'completed' | 'failed';
  checkedAt: Date;
  provider: string;
}

interface PlagiarismInterpretation {
  score: number;
  level: 'excellent' | 'good' | 'moderate' | 'poor';
  color: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
  recommendation: string;
}

interface PlagiarismResponse {
  result: PlagiarismResult;
  interpretation: PlagiarismInterpretation;
}

interface PlagiarismCheckerProps {
  contentId: number;
  contentTitle: string;
}

export function PlagiarismChecker({ contentId, contentTitle }: PlagiarismCheckerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Query to get existing plagiarism results
  const { data: existingResult, refetch: refetchResult } = useQuery<PlagiarismResponse>({
    queryKey: ['plagiarism-result', contentId],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/content/${contentId}/plagiarism-result`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No plagiarism result exists yet
        }
        throw new Error('Failed to fetch plagiarism result');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Mutation to check plagiarism
  const checkPlagiarismMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/content/${contentId}/check-plagiarism`),
    onSuccess: (data: any) => {
      console.log('Plagiarism check response:', data);
      
      // Handle different response structures safely
      const score = data?.result?.originalityScore || data?.interpretation?.score || 0;
      const message = data?.interpretation?.message || 'Check completed';
      
      toast({
        title: "Plagiarism Check Complete",
        description: `Originality score: ${score}% - ${message}`,
      });
      refetchResult();
    },
    onError: (error: any) => {
      console.error('Plagiarism check error:', error);
      toast({
        title: "Plagiarism Check Failed",
        description: error.message || "Unable to perform plagiarism check",
        variant: "destructive",
      });
    },
  });

  const handleCheckPlagiarism = () => {
    checkPlagiarismMutation.mutate();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string, score?: number) => {
    if (status === 'pending') return <Badge variant="outline">Checking...</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    
    if (score !== undefined) {
      if (score >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
      if (score >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
      if (score >= 40) return <Badge variant="default" className="bg-orange-100 text-orange-800">Moderate</Badge>;
      return <Badge variant="destructive">Poor</Badge>;
    }
    
    return <Badge variant="outline">Unknown</Badge>;
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Plagiarism Check</CardTitle>
          </div>
          <Button
            onClick={handleCheckPlagiarism}
            disabled={checkPlagiarismMutation.isPending}
            size="sm"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {checkPlagiarismMutation.isPending ? 'Checking...' : 'Check Plagiarism'}
          </Button>
        </div>
        <CardDescription>
          Verify the originality of your content with AI-powered plagiarism detection
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {checkPlagiarismMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm text-muted-foreground">Analyzing content for plagiarism...</span>
            </div>
            <Progress value={33} className="w-full" />
          </div>
        )}

        {existingResult && existingResult.result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">
                  <span className={getScoreColor(existingResult.result.originalityScore)}>
                    {existingResult.result.originalityScore}%
                  </span>
                </div>
                <div>
                  <div className="font-medium">Originality Score</div>
                  <div className="text-sm text-muted-foreground">
                    Last checked: {formatDate(existingResult.result.checkedAt.toString())}
                  </div>
                </div>
              </div>
              {getStatusBadge(existingResult.result.status, existingResult.result.originalityScore)}
            </div>

            <Progress 
              value={existingResult.result.originalityScore} 
              className="w-full"
            />

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{existingResult.interpretation.message}</strong>
                <br />
                {existingResult.interpretation.recommendation}
              </AlertDescription>
            </Alert>

            {existingResult.result.matches && existingResult.result.matches.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {existingResult.result.matches.length} potential matches found
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {existingResult.result.matches.map((match, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{match.similarity}% similar</Badge>
                            {match.url && (
                              <a
                                href={match.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                              >
                                {match.title || 'Source'}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-sm bg-muted p-2 rounded">
                          "{match.matchedText}"
                        </div>
                      </div>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Powered by {existingResult.result.provider} • 
              Results are cached for 1 hour to optimize performance
            </div>
          </div>
        )}

        {!existingResult && !checkPlagiarismMutation.isPending && (
          <div className="text-center py-6">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">No plagiarism check performed yet</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Check Plagiarism" to analyze your content for originality
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}