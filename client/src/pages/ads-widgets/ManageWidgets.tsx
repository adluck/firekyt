import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Copy, Trash2, Edit, ExternalLink, Calendar, Settings, Code, Globe, Download } from "lucide-react";
import JSZip from "jszip";

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
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("");

  const { data: widgetsData, isLoading } = useQuery({
    queryKey: ["/api/widgets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/widgets");
      return response.json();
    },
  });

  // Auto-select first widget on page load
  useEffect(() => {
    const widgets = widgetsData?.widgets || [];
    if (widgets.length > 0 && !selectedWidgetId) {
      setSelectedWidgetId(widgets[0].id.toString());
    }
  }, [widgetsData, selectedWidgetId]);

  const widgets = widgetsData?.widgets || [];
  const selectedWidget = widgets.find((w: AdWidget) => w.id.toString() === selectedWidgetId);

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

  // Enhanced embed code functions
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: description,
    });
  };

  const getJavaScriptEmbedCode = (widgetId: number) => {
    return `<script src="${window.location.protocol}//${window.location.host}/widgets/${widgetId}/embed.js"></script>`;
  };

  const getIframeEmbedCode = (widgetId: number, widget: AdWidget) => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    if (widget.size === "100%") {
      return `<iframe src="${baseUrl}/widgets/${widgetId}/iframe" style="width: 100%; min-height: 200px; border: none;" allowtransparency="true"></iframe>`;
    } else {
      const [width, height] = widget.size.split('x');
      return `<iframe src="${baseUrl}/widgets/${widgetId}/iframe?w=${width}&h=${height}" width="${width}" height="${height}" style="border: none;" allowtransparency="true"></iframe>`;
    }
  };

  const getWordPressShortcode = (widgetId: number) => {
    return `[firekyt_widget id="${widgetId}" domain="${window.location.hostname}"]`;
  };

  const getFunctionsPhpCode = (widgetId: number) => {
    return `// Add to your theme's functions.php file
// Allowlist iframe sources for FireKyt widgets
function allow_firekyt_iframes($content) {
    $content = str_replace('<iframe', '<iframe sandbox="allow-scripts allow-same-origin allow-top-navigation allow-popups"', $content);
    return $content;
}
add_filter('the_content', 'allow_firekyt_iframes');

// FireKyt Widget Shortcode
function firekyt_widget_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'domain' => '${window.location.hostname}'
    ), $atts);
    
    if (empty($atts['id'])) {
        return '<p>Error: Widget ID is required</p>';
    }
    
    $iframe_url = 'https://' . $atts['domain'] . '/widgets/' . $atts['id'] . '/iframe';
    return '<iframe src="' . esc_url($iframe_url) . '" style="width: 100%; min-height: 200px; border: none;" allowtransparency="true"></iframe>';
}
add_shortcode('firekyt_widget', 'firekyt_widget_shortcode');`;
  };



  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Ad Widgets</h1>
          <p className="text-muted-foreground">Create, edit, and manage your dynamic affiliate ad widgets</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No widgets created yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first dynamic affiliate ad widget to start generating revenue from your content.
            </p>
            <Link href="/ads-widgets/create">
              <Button>
                Create Your First Widget
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Ad Widgets</h1>
        <p className="text-muted-foreground">Select a widget to view details and manage settings</p>
      </div>

      {/* Widget Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Widget to Manage</CardTitle>
          <CardDescription>
            Choose from your {widgets.length} saved widget{widgets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
              <SelectTrigger className="w-full max-w-2xl">
                <SelectValue placeholder="Choose a widget to manage..." />
              </SelectTrigger>
              <SelectContent>
                {widgets.map((widget: AdWidget) => (
                  <SelectItem key={widget.id} value={widget.id.toString()}>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{widget.name}</span>
                      <Badge variant={widget.isActive ? "default" : "secondary"} className="text-xs">
                        {widget.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {widget.size} • {widget.ads.length} ads
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedWidgetId && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedWidgetId("")}
                className="shrink-0"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Widget Management Panel */}
      {selectedWidget && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Widget Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedWidget.name}</CardTitle>
                  <CardDescription>
                    {selectedWidget.size} • {selectedWidget.ads.length} ads • {selectedWidget.rotationInterval}s rotation
                  </CardDescription>
                </div>
                <Badge variant={selectedWidget.isActive ? "default" : "secondary"}>
                  {selectedWidget.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold">{selectedWidget.stats.views.toLocaleString()}</div>
                  <div className="text-sm font-medium text-muted-foreground">Views</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold">{selectedWidget.stats.clicks.toLocaleString()}</div>
                  <div className="text-sm font-medium text-muted-foreground">Clicks</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold">{selectedWidget.stats.ctr.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-muted-foreground">CTR</div>
                </div>
              </div>

              {/* Widget Info */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(selectedWidget.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(selectedWidget.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Management Actions</CardTitle>
              <CardDescription>
                Control your widget settings and access analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Actions */}
              <div className="space-y-2">
                <Button
                  variant={selectedWidget.isActive ? "outline" : "default"}
                  className="h-9 px-3 text-sm font-medium transition-all hover:scale-[1.01]"
                  onClick={() => toggleWidget.mutate({ widgetId: selectedWidget.id, isActive: !selectedWidget.isActive })}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {selectedWidget.isActive ? "Deactivate Widget" : "Activate Widget"}
                </Button>
                
                <Link href={`/ads-widgets/create?edit=${selectedWidget.id}`}>
                  <Button variant="outline" className="h-9 px-3 text-sm font-medium transition-all hover:scale-[1.01] hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Widget Settings
                  </Button>
                </Link>
                

                
                <Button
                  variant="outline"
                  className="h-9 px-3 text-sm font-medium transition-all hover:scale-[1.01] hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  onClick={() => copyToClipboard(getWordPressShortcode(selectedWidget.id), "WordPress shortcode copied to clipboard")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy WordPress Shortcode
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2 text-muted-foreground">Danger Zone</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="h-9 px-3 text-sm font-medium transition-all hover:scale-[1.01] hover:bg-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Widget Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Widget</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{selectedWidget.name}"? This action cannot be undone and will remove all associated analytics data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteWidget.mutate(selectedWidget.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Widget
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Embed Code Section */}
          <Card>
            <CardHeader>
              <CardTitle>Embed Code Options</CardTitle>
              <CardDescription>
                Choose your preferred embedding method for Widget {selectedWidget.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="javascript">
                    <Code className="w-4 h-4 mr-2" />
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="iframe">
                    <Globe className="w-4 h-4 mr-2" />
                    Iframe
                  </TabsTrigger>
                  <TabsTrigger value="wordpress">
                    <Download className="w-4 h-4 mr-2" />
                    WordPress
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="javascript" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Standard JavaScript Embed</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Recommended for most websites. Copy and paste this code into your HTML.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono break-all">
                      {getJavaScriptEmbedCode(selectedWidget.id)}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(getJavaScriptEmbedCode(selectedWidget.id), "JavaScript embed code copied")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JavaScript Code
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="iframe" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Iframe Embed</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Use this for platforms with JavaScript restrictions.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono break-all">
                      {getIframeEmbedCode(selectedWidget.id, selectedWidget)}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(getIframeEmbedCode(selectedWidget.id, selectedWidget), "Iframe embed code copied")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Iframe Code
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="wordpress" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">WordPress Shortcode</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Use this shortcode in WordPress posts and pages.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
                        {getWordPressShortcode(selectedWidget.id)}
                      </div>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => copyToClipboard(getWordPressShortcode(selectedWidget.id), "WordPress shortcode copied")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Shortcode
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Functions.php Code</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        If shortcodes don't work, add this to your theme's functions.php file.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                        {getFunctionsPhpCode(selectedWidget.id)}
                      </div>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => copyToClipboard(getFunctionsPhpCode(selectedWidget.id), "Functions.php code copied")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Functions Code
                      </Button>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Setup Instructions:</strong><br />
                        1. Copy the WordPress shortcode above<br />
                        2. Paste it into any WordPress post or page<br />
                        3. If it doesn't work, copy the functions.php code and add it to your theme's functions.php file
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}