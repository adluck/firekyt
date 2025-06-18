import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface KeywordModalProps {
  contentId: number | null;
  currentKeywords: string[] | null;
  onUpdate: (keywords: string[]) => void;
  trigger?: React.ReactNode;
}

export function KeywordModal({ contentId, currentKeywords, onUpdate, trigger }: KeywordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize keywords when modal opens
  useEffect(() => {
    if (isOpen) {
      setKeywords(currentKeywords || []);
      setNewKeyword('');
    }
  }, [isOpen, currentKeywords]);

  const saveMutation = useMutation({
    mutationFn: async (keywordsToSave: string[]) => {
      if (!contentId) throw new Error('Content ID required');
      
      console.log('🔍 KeywordModal: Saving keywords:', keywordsToSave);
      
      const response = await apiRequest('PATCH', `/api/content/${contentId}`, {
        targetKeywords: keywordsToSave
      });
      
      return response.json();
    },
    onSuccess: (result) => {
      console.log('🔍 KeywordModal: Save success:', result);
      const savedKeywords = result.targetKeywords || keywords;
      
      // Update parent component
      onUpdate(savedKeywords);
      
      // Close modal
      setIsOpen(false);
      
      // Refresh content list
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      toast({
        title: 'Keywords saved',
        description: 'SEO keywords updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleSave = () => {
    saveMutation.mutate(keywords);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Manage Keywords
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage SEO Keywords</DialogTitle>
          <DialogDescription>
            Add and manage target keywords for better SEO performance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new keyword */}
          <div className="space-y-2">
            <Label htmlFor="new-keyword">Add Keyword</Label>
            <div className="flex gap-2">
              <Input
                id="new-keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter keyword..."
                className="flex-1"
              />
              <Button 
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim() || keywords.includes(newKeyword.trim())}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Current keywords */}
          <div className="space-y-2">
            <Label>Current Keywords ({keywords.length})</Label>
            <div className="min-h-[100px] max-h-[200px] overflow-y-auto border rounded-md p-3">
              {keywords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No keywords added yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!contentId || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Keywords'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}