import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, Eye, Copy, Wand2, FileText, Clock, CheckCircle, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentEditorProps {
  generatedContent: any;
  onSave: (content: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ContentEditor({ generatedContent, onSave, onClose, isLoading = false }: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [editedContent, setEditedContent] = useState({
    title: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    metaTags: [] as string[],
    status: "draft" as "draft" | "published",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (generatedContent?.generated_text) {
      try {
        const parsed = JSON.parse(generatedContent.generated_text);
        setEditedContent({
          title: parsed.title || generatedContent.title || "",
          content: parsed.content || "",
          seoTitle: parsed.seo_title || generatedContent.seo_title || "",
          seoDescription: parsed.seo_description || generatedContent.seo_description || "",
          metaTags: parsed.meta_tags || generatedContent.meta_tags || [],
          status: "draft",
        });
      } catch {
        // If parsing fails, use raw text
        setEditedContent({
          title: generatedContent.title || "",
          content: generatedContent.generated_text || "",
          seoTitle: generatedContent.seo_title || "",
          seoDescription: generatedContent.seo_description || "",
          metaTags: generatedContent.meta_tags || [],
          status: "draft",
        });
      }
    }
  }, [generatedContent]);

  const handleSave = () => {
    if (!editedContent.title.trim() || !editedContent.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...editedContent,
      originalGenerationId: generatedContent.content_id,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied successfully",
    });
  };

  const addMetaTag = (tag: string) => {
    if (tag.trim() && !editedContent.metaTags.includes(tag.trim())) {
      setEditedContent(prev => ({
        ...prev,
        metaTags: [...prev.metaTags, tag.trim()]
      }));
    }
  };

  const removeMetaTag = (index: number) => {
    setEditedContent(prev => ({
      ...prev,
      metaTags: prev.metaTags.filter((_, i) => i !== index)
    }));
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (text: string) => {
    const words = getWordCount(text);
    return Math.ceil(words / 200); // Average reading speed: 200 words per minute
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Content Editor</h2>
          <Badge variant="secondary">
            {editedContent.status === "draft" ? "Draft" : "Published"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? "Preview" : "Edit"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="font-semibold">{getWordCount(editedContent.content)}</div>
          <div className="text-muted-foreground">Words</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="font-semibold">{getReadingTime(editedContent.content)} min</div>
          <div className="text-muted-foreground">Reading Time</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="font-semibold">{editedContent.metaTags.length}</div>
          <div className="text-muted-foreground">Meta Tags</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit Content</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{editedContent.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(editedContent.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {editedContent.seoDescription && (
                <CardDescription className="text-base">
                  {editedContent.seoDescription}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
                    p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                    li: ({children}) => <li className="ml-2">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                    a: ({children, href}) => <a href={href} className="text-primary underline hover:text-primary/80">{children}</a>,
                    code: ({children}) => <code className="bg-muted px-2 py-1 rounded text-sm">{children}</code>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>,
                  }}
                >
                  {editedContent.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {editedContent.metaTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Meta Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editedContent.metaTags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Edit Content Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>Edit the main content and title</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedContent.title}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={editedContent.content}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your content here..."
                  rows={20}
                  className="font-mono"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={editedContent.status === "published"}
                  onCheckedChange={(checked) => 
                    setEditedContent(prev => ({ ...prev, status: checked ? "published" : "draft" }))
                  }
                />
                <Label htmlFor="status">Publish immediately</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Optimization</CardTitle>
              <CardDescription>Configure SEO settings for better search visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={editedContent.seoTitle}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="SEO-optimized title (recommended: under 60 characters)"
                  maxLength={60}
                />
                <div className="text-xs text-muted-foreground">
                  {editedContent.seoTitle.length}/60 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  value={editedContent.seoDescription}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="Brief description for search results (recommended: under 160 characters)"
                  rows={3}
                  maxLength={160}
                />
                <div className="text-xs text-muted-foreground">
                  {editedContent.seoDescription.length}/160 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedContent.metaTags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => removeMetaTag(index)}
                    >
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add meta tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addMetaTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      if (input) {
                        addMetaTag(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Generated {generatedContent?.generation_time_ms}ms ago using {generatedContent?.ai_model_used}</span>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Content
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}