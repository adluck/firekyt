import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Save, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentEditorProps {
  initialContent?: {
    title: string;
    content: string;
    seoTitle: string;
    seoDescription: string;
    targetKeywords: string[];
    contentType: string;
  };
  onSave: (content: any) => void;
  onGenerate: (params: any) => void;
  isGenerating?: boolean;
  isSaving?: boolean;
}

export function ContentEditor({
  initialContent,
  onSave,
  onGenerate,
  isGenerating = false,
  isSaving = false,
}: ContentEditorProps) {
  const [title, setTitle] = useState(initialContent?.title || "");
  const [content, setContent] = useState(initialContent?.content || "");
  const [seoTitle, setSeoTitle] = useState(initialContent?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialContent?.seoDescription || "");
  const [contentType, setContentType] = useState(initialContent?.contentType || "blog_post");
  const [keywords, setKeywords] = useState<string[]>(initialContent?.targetKeywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  
  // Generation parameters
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleGenerate = () => {
    onGenerate({
      contentType,
      topic,
      keywords,
      targetAudience,
    });
  };

  const handleSave = () => {
    onSave({
      title,
      content,
      seoTitle,
      seoDescription,
      targetKeywords: keywords,
      contentType,
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Best wireless earbuds 2024"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog_post">Blog Post</SelectItem>
                  <SelectItem value="product_review">Product Review</SelectItem>
                  <SelectItem value="comparison">Product Comparison</SelectItem>
                  <SelectItem value="buying_guide">Buying Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience</Label>
            <Input
              id="target-audience"
              placeholder="e.g., Tech-savvy professionals, Budget-conscious consumers"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleGenerate}
            disabled={!topic || isGenerating}
            className="btn-gradient"
          >
            {isGenerating ? "Generating..." : "Generate Content"}
          </Button>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-editor min-h-96"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords">Target Keywords</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="Add keyword..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button type="button" onClick={handleAddKeyword}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              placeholder="SEO optimized title..."
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {seoTitle.length}/60 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seo-description">SEO Description</Label>
            <Textarea
              id="seo-description"
              placeholder="SEO meta description..."
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {seoDescription.length}/160 characters
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{title || "Untitled"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {content ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                ) : (
                  <p className="text-muted-foreground">No content to preview</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={!title || !content || isSaving}
          className="btn-gradient"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </div>
  );
}
