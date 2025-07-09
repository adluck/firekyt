import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SeoAnalysis {
  id: number;
  keyword: string;
  targetRegion: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  competitionLevel: string | null;
  cpcEstimate: number | null;
  topCompetitors: string[] | null;
  suggestedTitles: string[] | null;
  suggestedDescriptions: string[] | null;
  suggestedHeaders: string[] | null;
  relatedKeywords: string[] | null;
  serpFeatures: string[] | null;
  trendsData: any | null;
  apiSource: string | null;
  analysisDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function SeoAnalysisStorage() {
  const [analyses, setAnalyses] = useState<SeoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<SeoAnalysis | null>(null);
  const { toast } = useToast();

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/seo-analysis');
      const data = await response.json();
      
      if (data.success) {
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Failed to fetch SEO analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load saved keyword analyses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/seo-analysis/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyses(analyses.filter(a => a.id !== id));
        if (selectedAnalysis?.id === id) {
          setSelectedAnalysis(null);
        }
        toast({
          title: "Success",
          description: "Analysis deleted successfully"
        });
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete analysis",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'bg-gray-500';
    if (difficulty < 30) return 'bg-green-500';
    if (difficulty < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Saved Keyword Analyses
        </h1>
        <Badge variant="secondary">
          {analyses.length} saved
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analysis List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Analysis History</h2>
          
          {filteredAnalyses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                {searchTerm ? 'No analyses match your search' : 'No keyword analyses saved yet'}
              </CardContent>
            </Card>
          ) : (
            filteredAnalyses.map((analysis) => (
              <Card 
                key={analysis.id}
                className={`cursor-pointer transition-colors ${
                  selectedAnalysis?.id === analysis.id 
                    ? 'ring-2 ring-primary' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{analysis.keyword}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnalysis(analysis.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">
                      {analysis.targetRegion}
                    </Badge>
                    {analysis.searchVolume && (
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {analysis.searchVolume.toLocaleString()}
                      </Badge>
                    )}
                    {analysis.keywordDifficulty && (
                      <Badge 
                        variant="outline"
                        className={`${getDifficultyColor(analysis.keywordDifficulty)} text-white`}
                      >
                        KD: {analysis.keywordDifficulty}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(analysis.analysisDate)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Analysis Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Analysis Details</h2>
          
          {selectedAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {selectedAnalysis.keyword}
                  <Badge variant="outline">
                    {selectedAnalysis.targetRegion}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedAnalysis.searchVolume && (
                    <div>
                      <div className="text-sm text-gray-500">Search Volume</div>
                      <div className="text-lg font-semibold">
                        {Number(selectedAnalysis.searchVolume).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedAnalysis.keywordDifficulty && (
                    <div>
                      <div className="text-sm text-gray-500">Keyword Difficulty</div>
                      <div className="text-lg font-semibold">
                        {Number(selectedAnalysis.keywordDifficulty)}/100
                      </div>
                    </div>
                  )}
                  {selectedAnalysis.cpcEstimate && (
                    <div>
                      <div className="text-sm text-gray-500">CPC Estimate</div>
                      <div className="text-lg font-semibold">
                        ${Number(selectedAnalysis.cpcEstimate).toFixed(2)}
                      </div>
                    </div>
                  )}
                  {selectedAnalysis.competitionLevel && (
                    <div>
                      <div className="text-sm text-gray-500">Competition</div>
                      <div className="text-lg font-semibold capitalize">
                        {selectedAnalysis.competitionLevel}
                      </div>
                    </div>
                  )}
                </div>

                {/* Related Keywords */}
                {selectedAnalysis.relatedKeywords && selectedAnalysis.relatedKeywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.relatedKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Titles */}
                {selectedAnalysis.suggestedTitles && selectedAnalysis.suggestedTitles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Suggested Titles</h4>
                    <ul className="space-y-1">
                      {selectedAnalysis.suggestedTitles.map((title, index) => (
                        <li key={index} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Top Competitors */}
                {selectedAnalysis.topCompetitors && selectedAnalysis.topCompetitors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Top Competitors</h4>
                    <div className="space-y-1">
                      {selectedAnalysis.topCompetitors.map((competitor, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          {typeof competitor === 'string' ? competitor : (
                            <div>
                              <div className="font-medium">{competitor.title || competitor.domain || 'Unknown'}</div>
                              {competitor.snippet && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {competitor.snippet}
                                </div>
                              )}
                              {competitor.link && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  {competitor.link}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SERP Features */}
                {selectedAnalysis.serpFeatures && selectedAnalysis.serpFeatures.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">SERP Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.serpFeatures.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t text-xs text-gray-500">
                  <div>Analysis Date: {formatDate(selectedAnalysis.analysisDate)}</div>
                  {selectedAnalysis.apiSource && (
                    <div>Source: {selectedAnalysis.apiSource}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select an analysis from the list to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}