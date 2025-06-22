import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Eye, MousePointer, Target } from 'lucide-react';
import { parseContextMatch } from '@/utils/parseContextMatch';

interface LinkInsertionPreviewProps {
  content: string;
  suggestions: Array<{
    id: number;
    linkId: number;
    anchorText: string;
    position: number;
    confidence: number;
    reasoning: string;
    contextMatch: string[];
    linkTitle?: string;
    linkUrl?: string;
  }>;
  onAccept: (suggestionId: number) => void;
  onReject: (suggestionId: number) => void;
}

export default function LinkInsertionPreview({ 
  content, 
  suggestions, 
  onAccept, 
  onReject 
}: LinkInsertionPreviewProps) {
  const insertSuggestionsIntoContent = (text: string, suggestions: any[]) => {
    const sortedSuggestions = [...suggestions].sort((a, b) => b.position - a.position);
    let modifiedContent = text;
    
    sortedSuggestions.forEach((suggestion, index) => {
      const insertionPoint = Math.min(suggestion.position, modifiedContent.length);
      const beforeText = modifiedContent.substring(0, insertionPoint);
      const afterText = modifiedContent.substring(insertionPoint);
      
      const linkElement = `<span class="suggestion-highlight" data-suggestion-id="${suggestion.id}" style="background-color: ${getConfidenceColor(suggestion.confidence, true)}; padding: 2px 4px; border-radius: 3px; border: 1px dashed ${getConfidenceColor(suggestion.confidence, false)};">${suggestion.anchorText}</span>`;
      
      modifiedContent = beforeText + linkElement + afterText;
    });
    
    return modifiedContent;
  };

  const getConfidenceColor = (confidence: number, background: boolean = false) => {
    if (confidence >= 0.8) {
      return background ? 'rgba(34, 197, 94, 0.1)' : '#22c55e';
    }
    if (confidence >= 0.6) {
      return background ? 'rgba(234, 179, 8, 0.1)' : '#eab308';
    }
    return background ? 'rgba(239, 68, 68, 0.1)' : '#ef4444';
  };

  const getConfidenceBadge = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    if (confidence >= 0.8) return <Badge className="bg-green-100 text-green-800">{percentage}% High</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">{percentage}% Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">{percentage}% Low</Badge>;
  };

  const previewContent = insertSuggestionsIntoContent(content, suggestions);

  return (
    <div className="space-y-6">
      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Content Preview with Link Suggestions
          </CardTitle>
          <CardDescription>
            See how your content will look with the suggested affiliate links inserted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="prose max-w-none p-4 border rounded-lg bg-gray-50 min-h-48"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-500"></div>
              High Confidence (80%+)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-500"></div>
              Medium Confidence (60-79%)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-500"></div>
              Low Confidence (&lt;60%)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Link Suggestions ({suggestions.length})</h3>
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    "{suggestion.anchorText}"
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {suggestion.reasoning}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getConfidenceBadge(suggestion.confidence)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Link Details */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Target Link:</div>
                  <div className="text-sm text-muted-foreground">
                    {suggestion.linkTitle || 'Affiliate Link'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {suggestion.linkUrl || 'URL not provided'}
                  </div>
                </div>

                {/* Context Matches */}
                {suggestion.contextMatch && (
                  <div>
                    <div className="text-sm font-medium mb-2">Matched Keywords:</div>
                    <div className="flex flex-wrap gap-1">
                      {parseContextMatch(suggestion.contextMatch).map((match: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {match}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Position: {suggestion.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-4 w-4" />
                      Ready to insert
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(suggestion.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onAccept(suggestion.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept & Insert
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}