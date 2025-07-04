import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Monitor, BarChart3, Copy, Trash2, ExternalLink, Eye, MousePointer, Edit } from "lucide-react";

interface AdWidget {
  id: number;
  name: string;
  size: string;
  theme: any;
  rotationInterval: number;
  ads: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    views: number;
    clicks: number;
    ctr: number;
  };
}

export default function ManageWidgets() {
  const { toast } = useToast();
  const [selectedWidget, setSelectedWidget] = useState<AdWidget | null>(null);

  const { data: widgetsData, isLoading } = useQuery({
    queryKey: ["/api/widgets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/widgets");
      return response.json();
    },
  });

  const deleteWidget = useMutation({
    mutationFn: async (widgetId: number) => {
      return apiRequest("DELETE", `/api/widgets/${widgetId}`);
    },
    onSuccess: () => {
      toast({
        title: "Widget Deleted",
        description: "Your ad widget has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete widget",
        variant: "destructive",
      });
    },
  });

  const toggleWidget = useMutation({
    mutationFn: async ({ widgetId, isActive }: { widgetId: number; isActive: boolean }) => {
      return apiRequest("PUT", `/api/widgets/${widgetId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Widget Updated",
        description: "Widget status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update widget",
        variant: "destructive",
      });
    },
  });

  const copyEmbedCode = (widgetId: number) => {
    const embedCode = `<script src="${window.location.protocol}//${window.location.host}/widgets/${widgetId}/embed.js"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed Code Copied",
      description: "The embed code has been copied to your clipboard.",
    });
  };

  const widgets = widgetsData?.widgets || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Ad Widgets</h1>
          <p className="text-muted-foreground">Create, edit, and manage your dynamic affiliate ad widgets</p>
        </div>
        <Link href="/ads-widgets/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Widget
          </Button>
        </Link>
      </div>

      {widgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No widgets created yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first dynamic affiliate ad widget to start generating revenue from your content.
            </p>
            <Link href="/ads-widgets/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Widget
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget: AdWidget) => (
            <Card key={widget.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge 
                    variant={widget.isActive ? "default" : "secondary"} 
                    className="text-xs font-medium px-2.5 py-0.5"
                  >
                    {widget.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyEmbedCode(widget.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Link href={`/ads-widgets/create?edit=${widget.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/ads-widgets/analytics?widget=${widget.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Widget</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{widget.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteWidget.mutate(widget.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold mb-1 text-foreground">{widget.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  {widget.size} • {widget.ads.length} ads • {widget.rotationInterval}s rotation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-foreground">{widget.stats.views.toLocaleString()}</div>
                    <div className="text-sm font-medium text-muted-foreground tracking-wide">Views</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-foreground">{widget.stats.clicks.toLocaleString()}</div>
                    <div className="text-sm font-medium text-muted-foreground tracking-wide">Clicks</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-foreground">{widget.stats.ctr.toFixed(1)}%</div>
                    <div className="text-sm font-medium text-muted-foreground tracking-wide">CTR</div>
                  </div>
                </div>
                
                <div className="border-t border-border/40 pt-4">
                  <div className="flex gap-3">
                    <Button
                      variant={widget.isActive ? "outline" : "default"}
                      size="sm"
                      className="flex-1 h-9 font-medium"
                      onClick={() => toggleWidget.mutate({ widgetId: widget.id, isActive: !widget.isActive })}
                    >
                      {widget.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Link href={`/ads-widgets/create?edit=${widget.id}`}>
                      <Button variant="outline" size="sm" className="h-9 px-4 font-medium">
                        Edit
                      </Button>
                    </Link>
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