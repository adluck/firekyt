import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedContentEditor } from "@/components/editor/UnifiedContentEditor";

interface Content {
  id: number;
  title: string;
  content: string;
  status: "draft" | "published";
  contentType: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  targetKeywords?: string[];
  wordCount?: number;
}

export default function ContentManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUpdatingEditor, setIsUpdatingEditor] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch content list
  const { data: contentList = [], isLoading, error } = useQuery<Content[]>({
    queryKey: ["/api/content"],
    refetchOnWindowFocus: false,
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await apiRequest("DELETE", `/api/content/${contentId}`);
      if (!response.ok) {
        throw new Error("Failed to delete content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Content Deleted",
        description: "Content has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/content/${id}`, updates);
      if (!response.ok) {
        throw new Error("Failed to update content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setIsEditorOpen(false);
      setEditingContent(null);
      toast({
        title: "Content Updated",
        description: "Content has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update content",
        variant: "destructive",
      });
    },
  });



  // Filter content based on search and filters
  const filteredContent = contentList.filter((content: Content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || content.status === statusFilter;
    const matchesType = typeFilter === "all" || content.contentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleEdit = (content: Content) => {
    setEditingContent(content);
    setIsEditorOpen(true);
  };

  const handleDelete = (contentId: number) => {
    deleteContentMutation.mutate(contentId);
  };



  const handleSaveEdit = (editedContent: any) => {
    if (editingContent) {
      updateContentMutation.mutate({
        id: editingContent.id,
        updates: {
          title: editedContent.title,
          content: editedContent.content,
          seoTitle: editedContent.seoTitle,
          seoDescription: editedContent.seoDescription,
          status: editedContent.status,
        }
      });
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (text: string) => {
    const words = getWordCount(text);
    return Math.ceil(words / 200);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "draft":
        return <Edit className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "blog_post":
        return <FileText className="h-4 w-4" />;
      case "product_comparison":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isEditorOpen && editingContent) {
    if (isUpdatingEditor) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Updating editor with fresh data...</p>
          </div>
        </div>
      );
    }
    
    return (
      <UnifiedContentEditor
        key={`editor-${editingContent.id}-${editingContent.siteId}`}
        mode="edit"
        contentId={editingContent.id}
        showHeader={true}
        showSidebar={true}
        enableTables={true}
        enableSEO={true}
        enablePreview={true}
        enableSkeletonLoader={true}
        requiredFields={['title', 'content']}
        initialContent={{
          id: editingContent.id,
          title: editingContent.title,
          content: editingContent.content,
          contentType: editingContent.contentType,
          status: editingContent.status,
          seoTitle: editingContent.seoTitle,
          seoDescription: editingContent.seoDescription,
          targetKeywords: editingContent.targetKeywords,
          siteId: editingContent.siteId, // Use the actual siteId from the content
          metaTags: editingContent.metaTags || [],
        }}
        onSave={async (data) => {
          console.log('ContentManager onSave called with data:', data);
          console.log('ContentManager saving with siteId:', data.siteId);
          
          // Use the updateContentMutation directly to ensure proper state handling
          try {
            const result = await updateContentMutation.mutateAsync({
              id: editingContent.id,
              data: {
                title: data.title,
                content: data.content,
                contentType: data.contentType,
                status: data.status,
                siteId: data.siteId, // Preserve the siteId from the form
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                targetKeywords: data.targetKeywords,
                metaTags: data.metaTags,
              }
            });
            
            console.log('ContentManager save result:', result);
            
            // Update editingContent with the fresh data to prevent stale state
            const updatedContent = {
              ...editingContent,
              ...result,
              siteId: result.siteId || data.siteId
            };
            
            console.log('ContentManager updating editingContent with:', updatedContent);
            
            // Show loader while updating
            setIsUpdatingEditor(true);
            
            // Update content and allow component to re-render
            setEditingContent(updatedContent);
            
            // Hide loader after brief delay to allow re-render
            setTimeout(() => {
              setIsUpdatingEditor(false);
            }, 100);
            
            return Promise.resolve();
          } catch (error) {
            console.error('ContentManager save error:', error);
            throw error;
          }
        }}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingContent(null);
        }}
        isSaving={updateContentMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Manager</h1>
          <p className="text-muted-foreground">Manage your created content</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog_post">Blog Post</SelectItem>
                <SelectItem value="product_comparison">Product Comparison</SelectItem>
                <SelectItem value="review_article">Review Article</SelectItem>
                <SelectItem value="video_script">Video Script</SelectItem>
                <SelectItem value="social_post">Social Post</SelectItem>
                <SelectItem value="email_campaign">Email Campaign</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredContent.length} content{filteredContent.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load content. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-6 bg-slate-700 rounded-full w-20"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-3 bg-slate-700 rounded w-20"></div>
                    <div className="h-3 bg-slate-700 rounded w-24"></div>
                    <div className="h-3 bg-slate-700 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content List */}
      {!isLoading && filteredContent.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                ? "Try adjusting your filters or search term."
                : "Create your first piece of content to get started."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredContent.length > 0 && (
        <div className="space-y-4">
          {filteredContent.map((content: Content) => (
            <Card key={content.id} className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-800 hover:shadow-lg transition-all duration-200 hover:border-slate-600 dark:hover:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Main content */}
                  <div className="flex-1 min-w-0 pr-4">
                    {/* Title and status */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white leading-tight">
                        {content.title}
                      </h3>
                      <Badge 
                        variant="secondary"
                        className={content.status === "published" 
                          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 font-medium px-3 py-1 rounded-full" 
                          : "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 font-medium px-3 py-1 rounded-full"
                        }
                      >
                        {content.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    {/* Content preview */}
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {content.content.length > 150 
                        ? content.content.substring(0, 150) + "..."
                        : content.content
                      }
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(content.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{content.contentType.replace('_', ' ')}</span>
                      </div>

                      {content.targetKeywords && content.targetKeywords.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>{content.targetKeywords.slice(0, 2).join(', ')}</span>
                          {content.targetKeywords.length > 2 && (
                            <span className="text-slate-600">+{content.targetKeywords.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(content)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600 hover:border-slate-500"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600 hover:border-slate-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Content</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{content.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(content.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}