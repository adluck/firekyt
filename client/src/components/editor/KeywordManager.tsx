import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Save } from 'lucide-react';

interface KeywordManagerProps {
  contentId: number | null;
  initialKeywords: string[] | null;
  onKeywordsUpdate: (keywords: string[]) => void;
}

export function KeywordManager({ contentId, initialKeywords, onKeywordsUpdate }: KeywordManagerProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [displayKeywords, setDisplayKeywords] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize keywords from props
  useEffect(() => {
    if (initialKeywords && Array.isArray(initialKeywords)) {
      const keywordArray = initialKeywords.filter(k => k && k.trim().length > 0);
      setDisplayKeywords(keywordArray);
      setKeywordInput(keywordArray.join(', '));
    }
  }, [initialKeywords]);

  const keywordSaveMutation = useMutation({
    mutationFn: async (keywordArray: string[]) => {
      if (!contentId) throw new Error('Content ID required');
      
      const response = await apiRequest('PATCH', `/api/content/${contentId}`, {
        targetKeywords: keywordArray
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result && result.targetKeywords) {
        const savedKeywords = Array.isArray(result.targetKeywords) 
          ? result.targetKeywords 
          : [];
        
        setDisplayKeywords(savedKeywords);
        setKeywordInput(savedKeywords.join(', '));
        onKeywordsUpdate(savedKeywords);
        
        toast({
          title: 'Keywords saved',
          description: 'SEO keywords updated successfully',
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Keywords save failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSaveKeywords = () => {
    if (!contentId) {
      toast({
        title: 'Error',
        description: 'Content ID required for keyword updates',
        variant: 'destructive',
      });
      return;
    }

    const keywordArray = keywordInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    keywordSaveMutation.mutate(keywordArray);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="keywords">SEO Keywords (comma-separated)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="keywords"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Enter keywords separated by commas..."
            className="flex-1"
          />
          <Button 
            onClick={handleSaveKeywords}
            disabled={keywordSaveMutation.isPending || !contentId}
            size="sm"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {displayKeywords.length > 0 && (
        <div>
          <Label>Current Keywords</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {displayKeywords.map((keyword, index) => (
              <Badge key={`${keyword}-${index}`} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}