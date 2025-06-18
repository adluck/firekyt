import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SimpleKeywordEditorProps {
  contentId: number | null;
  currentKeywords: string[] | null;
  onUpdate: (keywords: string[]) => void;
}

export function SimpleKeywordEditor({ contentId, currentKeywords, onUpdate }: SimpleKeywordEditorProps) {
  const [input, setInput] = useState('');
  const [savedKeywords, setSavedKeywords] = useState<string[]>([]);
  const [updateCounter, setUpdateCounter] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentKeywords && Array.isArray(currentKeywords)) {
      const validKeywords = currentKeywords.filter(k => k && k.trim());
      setSavedKeywords(validKeywords);
      setInput(validKeywords.join(', '));
    }
  }, [currentKeywords]);

  // Force refresh keywords display with immediate state updates
  const forceRefreshKeywords = useCallback((keywords: string[]) => {
    console.log('🔍 SimpleKeywordEditor: Force refreshing keywords display:', keywords);
    
    // Use functional state updates to ensure React processes changes
    setSavedKeywords(() => [...keywords]);
    setInput(() => keywords.join(', '));
    setUpdateCounter(prev => prev + 1);
    onUpdate([...keywords]);
    
    // Additional timeout to ensure complete re-render
    setTimeout(() => {
      setSavedKeywords(prevKeywords => {
        console.log('🔍 Previous keywords:', prevKeywords, 'New keywords:', keywords);
        return [...keywords];
      });
    }, 50);
  }, [onUpdate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!contentId) throw new Error('Content ID required');
      
      const keywords = input.split(',').map(k => k.trim()).filter(k => k.length > 0);
      const response = await apiRequest('PATCH', `/api/content/${contentId}`, {
        targetKeywords: keywords
      });
      return { result: await response.json(), keywords };
    },
    onSuccess: ({ result, keywords }) => {
      console.log('🔍 SimpleKeywordEditor: Save success, forcing keywords refresh:', keywords);
      
      // Force complete refresh of keywords display
      forceRefreshKeywords(keywords);
      
      toast({
        title: 'Keywords saved',
        description: 'SEO keywords updated successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return (
    <div className="space-y-4" key={`editor-${updateCounter}`}>
      <div>
        <Label htmlFor="keyword-input">Target Keywords (comma-separated)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="keyword-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="keyword1, keyword2, keyword3..."
            className="flex-1"
          />
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={!contentId || saveMutation.isPending}
            size="sm"
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {!contentId ? 'Save content first to enable keyword updates' : 'Separate keywords with commas'}
        </p>
      </div>

      {savedKeywords.length > 0 && (
        <div key={`keywords-${updateCounter}-${savedKeywords.length}`}>
          <Label>Current Keywords</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {savedKeywords.map((keyword, index) => (
              <Badge key={`${keyword}-${index}-${updateCounter}`} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}