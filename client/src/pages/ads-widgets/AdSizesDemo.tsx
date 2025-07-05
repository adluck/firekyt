import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const AdSizesDemo = () => {
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("");

  // Fetch user's saved widgets
  const { data: widgetsResponse, isLoading } = useQuery({
    queryKey: ['/api/widgets'],
    enabled: true
  });

  const widgets = (widgetsResponse as any)?.widgets || [];

  const adSizes = [
    {
      size: "728x90",
      name: "Leaderboard",
      description: "Popular banner format for header/footer placement",
      usage: "High visibility, ideal for desktop websites",
      category: "Banner",
      commonUses: ["Blog headers", "Above content", "Footer areas"]
    },
    {
      size: "300x250", 
      name: "Medium Rectangle",
      description: "Most popular ad format, versatile placement",
      usage: "Works well in content areas, sidebars",
      category: "Rectangle",
      commonUses: ["Content sidebars", "Within articles", "End of posts"]
    },
    {
      size: "160x600",
      name: "Wide Skyscraper", 
      description: "Vertical format for sidebar placement",
      usage: "Great for content-heavy pages with sidebars",
      category: "Skyscraper",
      commonUses: ["Side navigation", "Tall sidebars", "Desktop layouts"]
    },
    {
      size: "100%",
      name: "Responsive",
      description: "Adapts to container width, mobile-friendly",
      usage: "Perfect for mobile and responsive layouts",
      category: "Responsive",
      commonUses: ["Mobile layouts", "Responsive content", "Flexible containers"]
    }
  ];

  const getIframeSrc = (size: string) => {
    if (!selectedWidgetId) {
      return `data:text/html,<html><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:80px;"><div style="text-align:center;color:#666;"><p>Select a widget to preview</p></div></body></html>`;
    }

    const baseUrl = window.location.origin;
    return `${baseUrl}/widgets/${selectedWidgetId}/iframe?size=${encodeURIComponent(size)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Ad Sizes Demo
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
          Preview how your saved widgets look across different ad formats and sizes. Select a widget below to see it rendered in all standard ad dimensions.
        </p>

        {/* Widget Selection */}
        <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Select Widget to Preview
          </h3>
          
          <div className="flex items-center gap-4">
            <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Choose a widget to preview..." />
              </SelectTrigger>
              <SelectContent>
                {widgets.map((widget: any) => (
                  <SelectItem key={widget.id} value={widget.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{widget.name}</span>
                      <Badge variant={widget.isActive ? "default" : "secondary"} className="text-xs">
                        {widget.isActive ? "Active" : "Inactive"}
                      </Badge>
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
        </div>
      </div>

      {/* Size Demonstrations */}
      <div className="space-y-8">
        {adSizes.map((adSize) => (
          <Card key={adSize.size} className="overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                    {adSize.name} ({adSize.size})
                  </CardTitle>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {adSize.description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  {adSize.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
                    Live Preview
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/20 overflow-auto">
                    <div className={`${adSize.size === '728x90' ? 'min-w-[728px]' : ''} flex items-center justify-center min-h-[100px]`}>
                      <iframe
                        src={getIframeSrc(adSize.size)}
                        style={{
                          width: adSize.size === '728x90' ? '728px' : 
                                 adSize.size === '300x250' ? '300px' :
                                 adSize.size === '160x600' ? '160px' : '100%',
                          height: adSize.size === '728x90' ? '90px' :
                                  adSize.size === '300x250' ? '250px' :
                                  adSize.size === '160x600' ? '600px' : '250px',
                          border: 'none',
                          borderRadius: '8px',
                          maxWidth: adSize.size === '100%' ? '100%' : 'none'
                        }}
                        title={`${adSize.name} Widget Preview`}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Specifications
                    </h4>
                    <div className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span className="font-mono">{adSize.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span>{adSize.category}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Best Use Cases
                    </h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      {adSize.commonUses.map((use, index) => (
                        <li key={index}>• {use}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Performance Notes
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {adSize.usage}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Pro Tip: Choosing the Right Size
        </h3>
        <div className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>High Traffic:</strong> Use 300x250 (Medium Rectangle) for maximum visibility and click-through rates
          </p>
          <p>
            <strong>Content Integration:</strong> Use 728x90 (Leaderboard) for seamless header/footer integration
          </p>
          <p>
            <strong>Sidebar Monetization:</strong> Use 160x600 (Wide Skyscraper) for content-heavy pages
          </p>
          <p>
            <strong>Mobile-First:</strong> Use Responsive (100%) for optimal mobile experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdSizesDemo;