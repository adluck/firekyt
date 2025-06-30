import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, User, Calendar } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  tags?: string[];
  pageUrl?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackComment {
  id: number;
  feedbackId: number;
  userId: number;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function FeedbackDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showComments, setShowComments] = useState(false);

  // Fetch all feedback
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['/api/admin/feedback', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      const response = await apiRequest('GET', `/api/admin/feedback${params}`);
      return response.json();
    }
  });

  // Fetch comments for selected feedback
  const { data: commentsData } = useQuery({
    queryKey: ['/api/admin/feedback', selectedFeedback?.id, 'comments'],
    queryFn: async () => {
      if (!selectedFeedback) return null;
      const response = await apiRequest('GET', `/api/admin/feedback/${selectedFeedback.id}/comments`);
      return response.json();
    },
    enabled: !!selectedFeedback
  });

  // Update feedback mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PUT', `/api/admin/feedback/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
      toast({
        title: "Success",
        description: "Feedback updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ feedbackId, comment, isInternal }: { feedbackId: number; comment: string; isInternal: boolean }) => {
      const response = await apiRequest('POST', `/api/admin/feedback/${feedbackId}/comments`, {
        comment,
        isInternal
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback', selectedFeedback?.id, 'comments'] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'default',
      closed: 'secondary'
    };
    
    const colors = {
      open: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleStatusUpdate = (feedbackId: number, newStatus: string) => {
    updateFeedbackMutation.mutate({
      id: feedbackId,
      updates: { status: newStatus }
    });
  };

  const feedback = feedbackData?.feedback || [];
  const comments = commentsData?.comments || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Dashboard</h1>
          <p className="text-muted-foreground">Manage user feedback and support requests</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
              <p className="text-muted-foreground">
                {selectedStatus === 'all' 
                  ? "There are no feedback submissions yet."
                  : `No feedback with status "${selectedStatus}" found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item: Feedback) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        User ID: {item.userId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(item.priority)}
                        {item.priority}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {item.description}
                </p>
                {item.pageUrl && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Page: {item.pageUrl}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedFeedback(item)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{item.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Status:</span> {getStatusBadge(item.status)}
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span> 
                            <div className="flex items-center gap-1 mt-1">
                              {getPriorityIcon(item.priority)}
                              {item.priority}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {item.category}
                          </div>
                          <div>
                            <span className="font-medium">User ID:</span> {item.userId}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="mt-1 text-sm">{item.description}</p>
                        </div>
                        
                        {item.pageUrl && (
                          <div>
                            <span className="font-medium">Page URL:</span>
                            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">{item.pageUrl}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Select
                            value={item.status}
                            onValueChange={(newStatus) => handleStatusUpdate(item.id, newStatus)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Comments Section */}
                        <div className="border-t pt-4">
                          <h3 className="font-medium mb-3">Comments</h3>
                          <div className="space-y-3 max-h-40 overflow-y-auto">
                            {comments.map((comment: FeedbackComment) => (
                              <div key={comment.id} className="bg-muted p-3 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">
                                    {comment.user.firstName} {comment.user.lastName} (@{comment.user.username})
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.comment}</p>
                                {comment.isInternal && (
                                  <Badge variant="secondary" className="mt-1 text-xs">Internal</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const comment = formData.get('comment') as string;
                              const isInternal = formData.get('isInternal') === 'on';
                              
                              if (comment.trim()) {
                                addCommentMutation.mutate({
                                  feedbackId: item.id,
                                  comment: comment.trim(),
                                  isInternal
                                });
                                (e.target as HTMLFormElement).reset();
                              }
                            }}
                            className="mt-4 space-y-2"
                          >
                            <Textarea
                              name="comment"
                              placeholder="Add a comment..."
                              required
                            />
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" name="isInternal" />
                                Internal comment (not visible to user)
                              </label>
                              <Button type="submit" size="sm">
                                Add Comment
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {item.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(item.id, 'in_progress')}
                    >
                      Start Work
                    </Button>
                  )}
                  
                  {item.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(item.id, 'resolved')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}