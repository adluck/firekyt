import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
  className?: string;
}

export function LinkManagementWidget({ content, onContentUpdate, className }: LinkManagementWidgetProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    url: '',
    text: '',
    title: '',
  });

  // Extract links from HTML content
  const extractLinksFromContent = (htmlContent: string): LinkData[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const linkElements = doc.querySelectorAll('a[href]');
    
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
    
    return extractedLinks;
  };

  // Update links when content changes
  useEffect(() => {
    const extractedLinks = extractLinksFromContent(content);
    setLinks(extractedLinks);
  }, [content]);

  // Handle link editing
  const startEditing = (link: LinkData) => {
    setEditingLinkId(link.id);
    setEditForm({
      url: link.url,
      text: link.text,
      title: link.title || '',
    });
  };

  const cancelEditing = () => {
    setEditingLinkId(null);
    setEditForm({ url: '', text: '', title: '' });
  };

  const saveLink = (linkId: string) => {
    const linkIndex = links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) return;

    const originalLink = links[linkIndex];
    
    // Update content by replacing the specific link
    let updatedContent = content;
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
      
      // Update the content
      onContentUpdate(updatedContent);
      
      toast({
        title: "Link Updated",
        description: "The link has been successfully updated in your content.",
      });
    }
    
    cancelEditing();
  };

  // Remove a link (convert to plain text)
  const removeLink = (linkId: string) => {
    const linkIndex = links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) return;

    const originalLink = links[linkIndex];
    
    let updatedContent = content;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const linkElements = doc.querySelectorAll('a[href]');
    
    if (linkElements[originalLink.position]) {
      const linkElement = linkElements[originalLink.position];
      const textNode = doc.createTextNode(linkElement.textContent || '');
      linkElement.parentNode?.replaceChild(textNode, linkElement);
      
      updatedContent = doc.body.innerHTML;
      onContentUpdate(updatedContent);
      
      toast({
        title: "Link Removed",
        description: "The link has been converted to plain text.",
      });
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
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Link Management
          </CardTitle>
        </CardHeader>
        <CardContent>
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
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Link Management
          <Badge variant="secondary" className="ml-auto">
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
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {links.map((link, index) => (
              <div key={link.id} className="border rounded-lg p-3 space-y-2">
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
                            onClick={() => saveLink(link.id)}
                            className="flex-1"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
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