import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { Link2, ExternalLink, Save, RefreshCw } from 'lucide-react';

interface LinkData {
  id: string;
  url: string;
  text: string;
  title?: string;
  isAffiliate: boolean;
  position: number;
}

interface LinkManagementWidgetProps {
  content: string;
  onContentUpdate: (newContent: string) => void;
  contentId?: string | number;
  className?: string;
}

export function LinkManagementWidget({ content, onContentUpdate, contentId, className }: LinkManagementWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    url: '',
    text: '',
    title: '',
  });

  // Extract links from HTML content
  const extractLinksFromContent = (htmlContent: string): LinkData[] => {
    if (!htmlContent || htmlContent.trim() === '') {
      console.log('🔗 LinkWidget: No content to parse');
      return [];
    }

    console.log('🔗 LinkWidget: Parsing content:', htmlContent.substring(0, 200) + '...');
    
    // Check if content is Markdown by looking for Markdown link syntax
    const isMarkdown = htmlContent.includes('[') && htmlContent.includes('](');
    console.log('🔗 LinkWidget: Content appears to be Markdown:', isMarkdown);
    
    if (isMarkdown) {
      // Extract Markdown links using regex
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const extractedLinks: LinkData[] = [];
      let match;
      let index = 0;
      
      while ((match = markdownLinkRegex.exec(htmlContent)) !== null) {
        const text = match[1];
        const url = match[2];
        
        // Check if it's likely an affiliate link
        const isAffiliate = url.includes('tag=') || 
                           url.includes('affiliate') || 
                           url.includes('ref=') ||
                           url.includes('utm_') ||
                           url.includes('?id=');
        
        extractedLinks.push({
          id: `link-${index}`,
          url,
          text,
          title: '',
          isAffiliate,
          position: index,
        });
        index++;
      }
      
      console.log('🔗 LinkWidget: Found Markdown links:', extractedLinks);
      return extractedLinks;
    }
    
    // Parse as HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const linkElements = doc.querySelectorAll('a[href]');
    
    console.log('🔗 LinkWidget: Found HTML link elements:', linkElements.length);
    
    const extractedLinks: LinkData[] = [];
    
    linkElements.forEach((link, index) => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      const title = link.getAttribute('title') || '';
      
      // Check if it's likely an affiliate link (contains common affiliate indicators)
      const isAffiliate = href.includes('tag=') || 
                         href.includes('affiliate') || 
                         href.includes('ref=') ||
                         href.includes('utm_') ||
                         href.includes('?id=');
      
      extractedLinks.push({
        id: `link-${index}`,
        url: href,
        text,
        title,
        isAffiliate,
        position: index,
      });
    });
    
    console.log('🔗 LinkWidget: Extracted HTML links:', extractedLinks);
    return extractedLinks;
  };

  // Update links when content changes
  useEffect(() => {
    const extractedLinks = extractLinksFromContent(content);
    setLinks(extractedLinks);
  }, [content]);

  // Handle link editing
  const startEditing = (link: LinkData) => {
    console.log('🔗 LinkWidget: Starting edit for link:', link);
    setEditingLinkId(link.id);
    setEditForm({
      url: link.url,
      text: link.text,
      title: link.title || '',
    });
    console.log('🔗 LinkWidget: Edit form set to:', {
      url: link.url,
      text: link.text,
      title: link.title || ''
    });
  };

  const cancelEditing = () => {
    setEditingLinkId(null);
    setEditForm({ url: '', text: '', title: '' });
  };

  const saveLink = async (linkId: string) => {
    console.log('🔗 LinkWidget: saveLink called for linkId:', linkId);
    const linkIndex = links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) {
      console.log('🔗 LinkWidget: Link not found for id:', linkId);
      return;
    }

    const originalLink = links[linkIndex];
    console.log('🔗 LinkWidget: Found link to save:', originalLink);
    console.log('🔗 LinkWidget: Edit form data:', editForm);
    setIsSaving(true);
    
    try {
      let updatedContent = content;
      
      // Check if content is Markdown
      const isMarkdown = content.includes('[') && content.includes('](');
      
      if (isMarkdown) {
        // Handle Markdown content
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let currentIndex = 0;
        
        updatedContent = content.replace(markdownLinkRegex, (match, text, url) => {
          if (currentIndex === originalLink.position) {
            currentIndex++;
            return `[${editForm.text}](${editForm.url})`;
          }
          currentIndex++;
          return match;
        });
      } else {
        // Handle HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const linkElements = doc.querySelectorAll('a[href]');
        
        if (linkElements[originalLink.position]) {
          const linkElement = linkElements[originalLink.position];
          
          // Update the link attributes
          linkElement.setAttribute('href', editForm.url);
          linkElement.textContent = editForm.text;
          if (editForm.title) {
            linkElement.setAttribute('title', editForm.title);
          } else {
            linkElement.removeAttribute('title');
          }
          
          // Get the updated HTML
          updatedContent = doc.body.innerHTML;
        }
      }
      
      // Update the content in the editor
      console.log('🔗 LinkWidget: Calling onContentUpdate with:', updatedContent.substring(0, 100) + '...');
      onContentUpdate(updatedContent);
      
      // Force refresh of links after content update
      setTimeout(() => {
        refreshLinks();
      }, 100);
      
      // Save to database if contentId is provided
      if (contentId) {
        const response = await apiRequest('PATCH', `/api/content/${contentId}`, {
          content: updatedContent
        });
        
        if (response.ok) {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/content'] });
          queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}`] });
          
          toast({
            title: "Link Updated & Saved",
            description: "The link has been updated in your content and saved to the database.",
          });
        } else {
          throw new Error('Failed to save content');
        }
      } else {
        toast({
          title: "Link Updated",
          description: "The link has been updated in your content.",
        });
      }
    } catch (error) {
      console.error('Error saving link:', error);
      toast({
        title: "Error",
        description: "Failed to save the link update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      cancelEditing();
    }
  };

  // Remove a link (convert to plain text)
  const removeLink = async (linkId: string) => {
    const linkIndex = links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) return;

    const originalLink = links[linkIndex];
    setIsSaving(true);
    
    try {
      let updatedContent = content;
      
      // Check if content is Markdown
      const isMarkdown = content.includes('[') && content.includes('](');
      
      if (isMarkdown) {
        // Handle Markdown content
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let currentIndex = 0;
        
        updatedContent = content.replace(markdownLinkRegex, (match, text, url) => {
          if (currentIndex === originalLink.position) {
            currentIndex++;
            return text; // Replace link with just the text
          }
          currentIndex++;
          return match;
        });
      } else {
        // Handle HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const linkElements = doc.querySelectorAll('a[href]');
        
        if (linkElements[originalLink.position]) {
          const linkElement = linkElements[originalLink.position];
          const textNode = doc.createTextNode(linkElement.textContent || '');
          linkElement.parentNode?.replaceChild(textNode, linkElement);
          
          updatedContent = doc.body.innerHTML;
        }
      }
      
      onContentUpdate(updatedContent);
      
      // Save to database if contentId is provided
      if (contentId) {
        const response = await apiRequest('PATCH', `/api/content/${contentId}`, {
          content: updatedContent
        });
        
        if (response.ok) {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/content'] });
          queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}`] });
          
          toast({
            title: "Link Removed & Saved",
            description: "The link has been removed and changes saved to the database.",
          });
        } else {
          throw new Error('Failed to save content');
        }
      } else {
        toast({
          title: "Link Removed",
          description: "The link has been converted to plain text.",
        });
      }
    } catch (error) {
      console.error('Error removing link:', error);
      toast({
        title: "Error",
        description: "Failed to remove the link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Refresh links from content
  const refreshLinks = () => {
    const extractedLinks = extractLinksFromContent(content);
    setLinks(extractedLinks);
    toast({
      title: "Links Refreshed",
      description: `Found ${extractedLinks.length} links in your content.`,
    });
  };

  if (links.length === 0) {
    return (
      <Card className={`bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
        <CardHeader className="py-3 mb-4 bg-slate-100 dark:bg-slate-800/50 rounded-t-lg">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Link Management
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900 rounded-b-lg">
          <div className="text-center py-6 text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No links found in content</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLinks}
              className="mt-3"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <CardHeader className="py-3 mb-4 bg-slate-100 dark:bg-slate-800/50 rounded-t-lg">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Link Management
          <Badge variant="secondary" className="ml-auto bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
            {links.length}
          </Badge>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshLinks}
          className="w-full"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Links
        </Button>
      </CardHeader>
      <CardContent className="p-0 bg-white dark:bg-slate-900 rounded-b-lg">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {links.map((link, index) => (
              <div key={link.id} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Link {index + 1}
                      </span>
                      {link.isAffiliate && (
                        <Badge variant="default" className="text-xs">
                          Affiliate
                        </Badge>
                      )}
                    </div>
                    
                    {editingLinkId === link.id ? (
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`url-${link.id}`} className="text-xs">
                            URL
                          </Label>
                          <Input
                            id={`url-${link.id}`}
                            value={editForm.url}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            placeholder="https://..."
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`text-${link.id}`} className="text-xs">
                            Link Text
                          </Label>
                          <Input
                            id={`text-${link.id}`}
                            value={editForm.text}
                            onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                            placeholder="Link text"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`title-${link.id}`} className="text-xs">
                            Title (Optional)
                          </Label>
                          <Input
                            id={`title-${link.id}`}
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Link title"
                            className="text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('🔗 LinkWidget: Save button clicked for link:', link.id);
                              saveLink(link.id);
                            }}
                            className="flex-1"
                            disabled={isSaving}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate" title={link.text}>
                          {link.text}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={link.url}>
                          {link.url}
                        </p>
                        {link.title && (
                          <p className="text-xs text-muted-foreground italic truncate" title={link.title}>
                            "{link.title}"
                          </p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(link)}
                            className="flex-1 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeLink(link.id)}
                            className="flex-1 text-xs"
                          >
                            Remove
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(link.url, '_blank')}
                            className="px-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {index < links.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}