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
      // Only set input if it's empty (avoid overwriting user input)
      if (!input.trim()) {
        setInput(validKeywords.join(', '));
      }
    }
  }, [currentKeywords, input]);

  // Handle successful save with proper state management
  const handleSaveSuccess = useCallback((keywords: string[]) => {
    console.log('🔍 SimpleKeywordEditor: Handling save success:', keywords);
    
    // Update keywords display immediately
    setSavedKeywords([...keywords]);
    
    // Clear input field
    setInput('');
    
    // Trigger parent update
    onUpdate([...keywords]);
    
    // Force re-render with counter
    setUpdateCounter(prev => prev + 1);
    
    console.log('🔍 SimpleKeywordEditor: Save success handled - input cleared, keywords updated');
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
      console.log('🔍 SimpleKeywordEditor: Save success, handling success:', keywords);
      
      // Handle successful save with proper state management
      handleSaveSuccess(keywords);
      
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