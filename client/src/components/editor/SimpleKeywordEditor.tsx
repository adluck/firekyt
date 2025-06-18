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
      // Don't auto-populate input field - let user manually enter keywords
    }
  }, [currentKeywords]);

  // Handle successful save with immediate UI refresh
  const handleSaveSuccess = useCallback((keywords: string[]) => {
    console.log('🔍 SimpleKeywordEditor: Handling save success:', keywords);
    
    // Force immediate state updates
    setSavedKeywords(() => {
      console.log('🔍 Setting saved keywords to:', keywords);
      return [...keywords];
    });
    
    // Clear input field immediately
    setInput(() => {
      console.log('🔍 Clearing input field');
      return '';
    });
    
    // Update parent component
    onUpdate([...keywords]);
    
    // Force complete component re-render
    setUpdateCounter(prev => {
      const newCounter = prev + 1;
      console.log('🔍 Update counter incremented to:', newCounter);
      return newCounter;
    });
    
    console.log('🔍 SimpleKeywordEditor: Save success handled - UI should refresh now');
  }, [onUpdate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 SimpleKeywordEditor: Starting save mutation');
      console.log('🔍 ContentId:', contentId);
      console.log('🔍 Current input:', input);
      
      if (!contentId) {
        console.error('🔍 ERROR: No content ID available');
        throw new Error('Content ID required');
      }
      
      const keywords = input.split(',').map(k => k.trim()).filter(k => k.length > 0);
      console.log('🔍 Parsed keywords:', keywords);
      
      if (keywords.length === 0) {
        console.warn('🔍 WARNING: No valid keywords to save');
        throw new Error('Please enter at least one keyword');
      }
      
      console.log('🔍 Making API request to:', `/api/content/${contentId}`);
      const response = await apiRequest('PATCH', `/api/content/${contentId}`, {
        targetKeywords: keywords
      });
      
      const result = await response.json();
      console.log('🔍 API response:', result);
      
      return { result, keywords };
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
            key={`input-${updateCounter}-${savedKeywords.length}`}
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