import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Eye, CheckCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface ConversionStatus {
  totalContent: number;
  contentWithTracking: number;
  contentNeedingConversion: number;
  intelligentLinksAvailable: number;
}

interface ConversionPreview {
  linksFound: Array<{
    linkId: number;
    linkTitle: string;
    originalUrl: string;
    anchorText: string;
    occurrences: number;
  }>;
  conversionPreview: string;
}

interface ConversionResult {
  contentId: number;
  title: string;
  linksFound: number;
  linksConverted: number;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

export default function RetroactiveConversion() {
  const [selectedContentIds, setSelectedContentIds] = useState<number[]>([]);
  const [previewContentId, setPreviewContentId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get conversion status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/links/conversion-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/links/conversion-status');
      return response.json() as Promise<ConversionStatus>;
    }
  });

  // Get user content
  const { data: content = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/content');
      return response.json();
    }
  });

  // Get conversion preview
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['/api/content', previewContentId, 'conversion-preview'],
    queryFn: async () => {
      if (!previewContentId) return null;
      const response = await apiRequest('GET', `/api/content/${previewContentId}/conversion-preview`);
      return response.json() as Promise<ConversionPreview>;
    },
    enabled: !!previewContentId
  });

  // Single content conversion
  const convertSingleMutation = useMutation({
    mutationFn: (contentId: number) => apiRequest('POST', `/api/content/${contentId}/convert-tracking`),
    onSuccess: (response, contentId) => {
      response.json().then((result: ConversionResult) => {
        queryClient.invalidateQueries({ queryKey: ['/api/links/conversion-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
        
        if (result.status === 'success') {
          toast({
            title: 'Conversion Successful',
            description: `Converted ${result.linksConverted} links in "${result.title}"`
          });
        } else if (result.status === 'partial') {
          toast({
            title: 'Partial Conversion',
            description: `Converted ${result.linksConverted} of ${result.linksFound} links. Check errors.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Conversion Failed',
            description: result.errors?.[0] || 'Unknown error occurred',
            variant: 'destructive'
          });
        }
      });
    }
  });

  // Batch conversion
  const convertBatchMutation = useMutation({
    mutationFn: (contentIds: number[]) => 
      apiRequest('POST', '/api/content/batch-convert-tracking', { contentIds }),
    onSuccess: (response) => {
      response.json().then((summary: any) => {
        queryClient.invalidateQueries({ queryKey: ['/api/links/conversion-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
        
        toast({
          title: 'Batch Conversion Complete',
          description: `Processed ${summary.totalProcessed} items. ${summary.successful} successful, ${summary.failed} failed.`
        });
        
        setSelectedContentIds([]);
      });
    }
  });

  if (statusLoading || contentLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Retroactive Link Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const contentNeedingConversion = content.filter((item: any) => {
    // Filter content that doesn't have intelligent links or tracking
    return true; // Simplified for demo - in reality, check for existing insertions
  });

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Retroactive Link Tracking
          </CardTitle>
          <CardDescription>
            Convert existing published content to use intelligent link tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.totalContent}</div>
                <div className="text-sm text-muted-foreground">Total Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.contentWithTracking}</div>
                <div className="text-sm text-muted-foreground">With Tracking</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{status.contentNeedingConversion}</div>
                <div className="text-sm text-muted-foreground">Need Conversion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{status.intelligentLinksAvailable}</div>
                <div className="text-sm text-muted-foreground">Smart Links</div>
              </div>
            </div>
          )}

          {status && status.contentNeedingConversion > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversion Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((status.contentWithTracking / status.totalContent) * 100)}%
                </span>
              </div>
              <Progress 
                value={(status.contentWithTracking / status.totalContent) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content List */}
      {contentNeedingConversion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Available for Conversion</CardTitle>
            <CardDescription>
              Select content to convert to tracking-enabled intelligent links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedContentIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedContentIds.length} items selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedContentIds([])}
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => convertBatchMutation.mutate(selectedContentIds)}
                    disabled={convertBatchMutation.isPending}
                  >
                    {convertBatchMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Convert Selected
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {contentNeedingConversion.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedContentIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContentIds([...selectedContentIds, item.id]);
                        } else {
                          setSelectedContentIds(selectedContentIds.filter(id => id !== item.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.contentType} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={isPreviewOpen && previewContentId === item.id} onOpenChange={setIsPreviewOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setPreviewContentId(item.id);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Conversion Preview: {item.title}</DialogTitle>
                          <DialogDescription>
                            See what links would be converted to tracking URLs
                          </DialogDescription>
                        </DialogHeader>
                        
                        {previewLoading ? (
                          <div className="p-4">Loading preview...</div>
                        ) : preview && (
                          <div className="space-y-4">
                            {preview.linksFound.length > 0 ? (
                              <>
                                <div>
                                  <h4 className="font-medium mb-2">Links Found ({preview.linksFound.length})</h4>
                                  <div className="space-y-2">
                                    {preview.linksFound.map((link, idx) => (
                                      <div key={idx} className="p-3 bg-muted rounded text-sm">
                                        <div className="font-medium">{link.linkTitle}</div>
                                        <div className="text-muted-foreground">
                                          Anchor: "{link.anchorText}" • {link.occurrences} occurrence(s)
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <Separator />
                                <div>
                                  <h4 className="font-medium mb-2">Preview (first 500 characters)</h4>
                                  <div className="p-3 bg-muted rounded text-sm font-mono">
                                    {preview.conversionPreview.substring(0, 500)}...
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No intelligent links found in this content
                              </div>
                            )}
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Close
                          </Button>
                          {preview && preview.linksFound.length > 0 && (
                            <Button 
                              onClick={() => {
                                convertSingleMutation.mutate(item.id);
                                setIsPreviewOpen(false);
                              }}
                              disabled={convertSingleMutation.isPending}
                            >
                              Convert Now
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      size="sm"
                      onClick={() => convertSingleMutation.mutate(item.id)}
                      disabled={convertSingleMutation.isPending}
                    >
                      {convertSingleMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Convert
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {status && status.contentNeedingConversion === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Content Converted</h3>
            <p className="text-muted-foreground text-center">
              All your content is already using intelligent link tracking
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}