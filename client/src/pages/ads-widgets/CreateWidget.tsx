import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Eye, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Validation schemas
const adSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(200, "Description too long"),
  imageUrl: z.string().url("Valid image URL required"),
  ctaText: z.string().min(1, "CTA text is required").max(30, "CTA text too long"),
  url: z.string().url("Valid HTTPS URL required").refine(url => url.startsWith('https://'), "Must use HTTPS"),
  tags: z.array(z.string()).optional(),
});

const widgetSchema = z.object({
  name: z.string().min(1, "Widget name is required").max(100, "Name too long"),
  size: z.enum(["300x250", "728x90", "160x600", "100%"]),
  theme: z.object({
    bgColor: z.string().min(1, "Background color required"),
    textColor: z.string().min(1, "Text color required"),
    ctaColor: z.string().min(1, "CTA color required"),
    font: z.enum(["sans-serif", "serif", "monospace"]),
    imageScale: z.number().min(80).max(150).optional(),
    imageFit: z.enum(["cover", "contain", "fill"]).optional(),
  }),
  rotationInterval: z.number().min(3, "Minimum 3 seconds").max(60, "Maximum 60 seconds"),
  ads: z.array(adSchema).min(1, "At least one ad is required"),
});

type WidgetFormData = z.infer<typeof widgetSchema>;

const sizePresets = [
  { value: "300x250", label: "Medium Rectangle (300x250)" },
  { value: "728x90", label: "Leaderboard (728x90)" },
  { value: "160x600", label: "Wide Skyscraper (160x600)" },
  { value: "100%", label: "Responsive Width (100%)" },
];

const fontOptions = [
  { value: "sans-serif", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
];

const templateOptions = [
  {
    id: "modern-gradient",
    name: "Modern Gradient",
    description: "Clean design with gradient background and circular image frame",
    preview: "bg-gradient-to-br from-blue-600 to-purple-700",
    theme: {
      bgColor: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
      textColor: "#ffffff",
      ctaColor: "#10b981",
      font: "sans-serif",
      borderRadius: "12px",
      imageStyle: "rounded-full",
      layout: "modern"
    }
  },
  {
    id: "professional-dark",
    name: "Professional Dark",
    description: "Dark theme with blue accents, perfect for tech products",
    preview: "bg-slate-800",
    theme: {
      bgColor: "#1e293b",
      textColor: "#f1f5f9",
      ctaColor: "#3b82f6",
      font: "sans-serif",
      borderRadius: "8px",
      imageStyle: "rounded",
      layout: "professional"
    }
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    description: "Clean white background with subtle shadows",
    preview: "bg-white border border-gray-200",
    theme: {
      bgColor: "#ffffff",
      textColor: "#374151",
      ctaColor: "#059669",
      font: "sans-serif",
      borderRadius: "6px",
      imageStyle: "rounded",
      layout: "minimal"
    }
  },
  {
    id: "vibrant-orange",
    name: "Vibrant Orange",
    description: "Eye-catching orange theme for high conversion",
    preview: "bg-gradient-to-r from-orange-500 to-red-500",
    theme: {
      bgColor: "linear-gradient(90deg, #f97316 0%, #ef4444 100%)",
      textColor: "#ffffff",
      ctaColor: "#fbbf24",
      font: "sans-serif",
      borderRadius: "10px",
      imageStyle: "rounded",
      layout: "vibrant"
    }
  },
  {
    id: "e-commerce-classic",
    name: "E-commerce Classic",
    description: "Traditional e-commerce layout with product focus",
    preview: "bg-gray-50 border border-gray-300",
    theme: {
      bgColor: "#f9fafb",
      textColor: "#111827",
      ctaColor: "#dc2626",
      font: "sans-serif",
      borderRadius: "4px",
      imageStyle: "rounded",
      layout: "ecommerce"
    }
  },
  {
    id: "curved-modern",
    name: "Curved Modern",
    description: "Google Ads inspired design with curved elements and circular image frames",
    preview: "bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800",
    theme: {
      bgColor: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
      textColor: "#ffffff",
      ctaColor: "#60a5fa",
      font: "sans-serif",
      borderRadius: "12px",
      imageStyle: "circular",
      layout: "curved"
    }
  }
];

export default function CreateWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');

  const form = useForm<WidgetFormData>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      name: "Gaming Gear Widget",
      size: "300x250",
      theme: {
        bgColor: "#ffffff",
        textColor: "#333333",
        ctaColor: "#007cba",
        font: "sans-serif",
        imageScale: 100,
        imageFit: "cover",
      },
      rotationInterval: 5,
      ads: [
        {
          title: "HyperX Cloud Alpha Wireless",
          description: "Gaming Headset for PC, 300-hour battery life, DTS Headphone:X Spatial Audio, Memory foam, Dual Chamber Drivers, Noise-canceling mic, Durable aluminum frame, Red",
          imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&h=300&fit=crop",
          ctaText: "Buy Now",
          url: "https://amazon.com/hyperx-cloud-alpha-wireless",
          tags: ["gaming", "headset", "wireless"],
        },
      ],
    },
  });

  const watchedValues = form.watch();
  const currentAd = watchedValues.ads?.[currentAdIndex] || watchedValues.ads?.[0];

  const applyTemplate = (template: typeof templateOptions[0]) => {
    form.setValue("theme", {
      bgColor: template.theme.bgColor,
      textColor: template.theme.textColor,
      ctaColor: template.theme.ctaColor,
      font: template.theme.font as "sans-serif" | "serif" | "monospace",
      imageScale: watchedValues.theme.imageScale || 100,
      imageFit: watchedValues.theme.imageFit || "cover",
    });
    
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied to your widget.`,
    });
  };

  const createWidget = useMutation({
    mutationFn: async (data: WidgetFormData) => {
      return apiRequest("POST", "/api/widgets", data);
    },
    onSuccess: () => {
      toast({
        title: "Widget Created",
        description: "Your ad widget has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create widget",
        variant: "destructive",
      });
    },
  });

  const addAd = () => {
    const currentAds = form.getValues("ads");
    form.setValue("ads", [
      ...currentAds,
      {
        title: "HyperX Cloud Alpha Wireless",
        description: "Gaming Headset for PC, 300-hour battery life, DTS Headphone:X Spatial Audio, Memory foam, Dual Chamber Drivers, Noise-canceling mic, Durable aluminum frame, Red",
        imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&h=300&fit=crop",
        ctaText: "Buy Now",
        url: "https://amazon.com/hyperx-cloud-alpha-wireless",
        tags: ["gaming", "headset", "wireless"],
      },
    ]);
    setCurrentAdIndex(currentAds.length);
  };

  const removeAd = (index: number) => {
    const currentAds = form.getValues("ads");
    if (currentAds.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one ad is required",
        variant: "destructive",
      });
      return;
    }
    form.setValue("ads", currentAds.filter((_, i) => i !== index));
    if (currentAdIndex >= currentAds.length - 1) {
      setCurrentAdIndex(0);
    }
  };

  const getSizeStyle = (size: string) => {
    switch (size) {
      case "300x250":
        return { width: "300px", height: "250px" };
      case "728x90":
        return { width: "728px", height: "90px" };
      case "160x600":
        return { width: "160px", height: "600px" };
      case "100%":
        return { width: "100%", height: "250px", maxWidth: "500px" };
      default:
        return { width: "300px", height: "250px" };
    }
  };

  // Get optimized content styling based on ad size
  const getContentStyling = (size: string) => {
    switch (size) {
      case "728x90": // Leaderboard - horizontal layout
        return {
          layout: 'flex-row',
          padding: 'px-4 pt-2 pb-6',
          titleSize: 'text-sm font-semibold',
          descriptionSize: 'text-xs',
          descriptionLines: 'line-clamp-2',
          imageSize: 'w-20 h-20',
          buttonSize: 'px-4 py-2 text-sm',
          buttonWidth: 'w-24',
          spacing: 'gap-4',
          textAlign: 'text-left',
          maxDescription: 80
        };
      case "160x600": // Skyscraper - vertical, compact
        return {
          layout: 'flex-col',
          padding: 'p-2',
          titleSize: 'text-xs font-semibold',
          descriptionSize: 'text-[10px]',
          descriptionLines: 'line-clamp-4',
          imageSize: 'w-full h-28',
          buttonSize: 'px-2 py-1 text-[10px]',
          spacing: 'gap-2',
          textAlign: 'text-center',
          maxDescription: 120
        };
      case "300x250": // Medium Rectangle - balanced
        return {
          layout: 'flex-col',
          padding: 'p-3',
          titleSize: 'text-sm font-semibold',
          descriptionSize: 'text-xs',
          descriptionLines: 'line-clamp-3',
          imageSize: 'w-full h-32',
          buttonSize: 'px-4 py-2 text-xs',
          spacing: 'gap-2',
          textAlign: 'text-center',
          maxDescription: 100
        };
      case "100%": // Responsive - flexible
        return {
          layout: 'flex-col',
          padding: 'p-4',
          titleSize: 'text-base font-semibold',
          descriptionSize: 'text-sm',
          descriptionLines: 'line-clamp-3',
          imageSize: 'w-full h-40',
          buttonSize: 'px-6 py-2 text-sm',
          spacing: 'gap-3',
          textAlign: 'text-center',
          maxDescription: 150
        };
      default:
        return {
          layout: 'flex-col',
          padding: 'p-3',
          titleSize: 'text-sm font-semibold',
          descriptionSize: 'text-xs',
          descriptionLines: 'line-clamp-3',
          imageSize: 'w-full h-32',
          buttonSize: 'px-4 py-2 text-xs',
          spacing: 'gap-2',
          textAlign: 'text-center',
          maxDescription: 100
        };
    }
  };

  const generateEmbedCode = () => {
    return `<script src="${window.location.origin}/widgets/{widget-id}/embed.js"></script>`;
  };

  const onSubmit = (data: WidgetFormData) => {
    createWidget.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Ad Widget</h1>
        <p className="text-muted-foreground mt-2">
          Design and customize your affiliate ad widget with live preview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Widget Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Widget Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Widget Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Coffee Sidebar Widget" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ad size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sizePresets.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rotationInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Rotation Interval (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="3"
                            max="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Theme Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Templates</CardTitle>
                  <p className="text-sm text-muted-foreground">Choose a pre-designed template or customize manually below</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templateOptions.map((template) => (
                      <div
                        key={template.id}
                        className="template-card relative group cursor-pointer"
                        onClick={() => applyTemplate(template)}
                      >
                        <div className={`${template.preview} h-28 rounded-lg p-3 border-2 border-transparent hover:border-primary/50 shadow-sm`}>
                          <div className="text-white text-sm font-semibold mb-1 drop-shadow-sm">
                            {template.name}
                          </div>
                          <div className="text-white text-xs opacity-90 line-clamp-2 drop-shadow-sm">
                            {template.description}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded px-2 py-1">
                            <span className="text-white text-xs font-medium">Click to Apply</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Image Sizing Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Image Display Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">Customize how product images fill the available space</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="theme.imageScale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Scale ({field.value || 100}%)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="80"
                              max="150"
                              step="5"
                              value={field.value || 100}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-slider"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>80% (Smaller)</span>
                              <span>100% (Default)</span>
                              <span>150% (Larger)</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="theme.imageFit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Fit Style</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "cover"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose image fit style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cover">Cover (Fill completely, may crop)</SelectItem>
                            <SelectItem value="contain">Contain (Show full image, may have gaps)</SelectItem>
                            <SelectItem value="fill">Fill (Stretch to fit, may distort)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Theme Customization */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Theme Customization</CardTitle>
                  <p className="text-sm text-muted-foreground">Fine-tune colors and fonts manually</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="theme.bgColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-16 h-10" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#ffffff" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="theme.textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-16 h-10" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#333333" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="theme.ctaColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CTA Button Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-16 h-10" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#007cba" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="theme.font"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Family</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fontOptions.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ad Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Ad Content</CardTitle>
                    <Button type="button" onClick={addAd} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ad
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ad Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.ads?.map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={currentAdIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentAdIndex(index)}
                        >
                          Ad {index + 1}
                        </Button>
                        {watchedValues.ads.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAd(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Current Ad Form */}
                  {currentAdIndex < watchedValues.ads.length && (
                    <div className="space-y-4 border rounded-lg p-4">
                      <FormField
                        control={form.control}
                        name={`ads.${currentAdIndex}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Delonghi Espresso Machine" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`ads.${currentAdIndex}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Save 20% on top-rated gear"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`ads.${currentAdIndex}.imageUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`ads.${currentAdIndex}.ctaText`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CTA Text</FormLabel>
                              <FormControl>
                                <Input placeholder="Buy Now" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`ads.${currentAdIndex}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Affiliate URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                disabled={createWidget.isPending}
              >
                {createWidget.isPending ? "Creating..." : "Create Widget"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Live Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Preview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={previewMode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('preview')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode === 'code' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('code')}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Embed Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {previewMode === 'preview' ? (
                <div className="flex justify-center">
                  <div
                    className={`border rounded-lg overflow-hidden curved-decoration ${getContentStyling(watchedValues.size).layout === 'flex-row' ? 'flex-row' : 'flex-col'} ${getContentStyling(watchedValues.size).padding} ${getContentStyling(watchedValues.size).spacing} ${getContentStyling(watchedValues.size).textAlign}`}
                    style={{
                      ...getSizeStyle(watchedValues.size),
                      background: watchedValues.theme.bgColor.includes('gradient') 
                        ? watchedValues.theme.bgColor 
                        : watchedValues.theme.bgColor,
                      color: watchedValues.theme.textColor,
                      fontFamily: watchedValues.theme.font,
                      display: 'flex',
                      position: 'relative',
                    }}
                  >
                    {currentAd && (
                      <>
                        {currentAd.imageUrl && (
                          <div className={`${getContentStyling(watchedValues.size).imageSize} flex-shrink-0`}>
                            <img
                              src={currentAd.imageUrl}
                              alt={currentAd.title}
                              className="w-full h-full object-center rounded-lg shadow-lg"
                              style={{ 
                                objectFit: watchedValues.theme.imageFit || 'cover' as any,
                                transform: `scale(${(watchedValues.theme.imageScale || 100) / 100})`,
                                transition: 'transform 0.3s ease'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className={`flex-1 flex ${getContentStyling(watchedValues.size).layout === 'flex-row' ? 'flex-row items-center justify-between' : 'flex-col items-center'}`}>
                          <div className="flex-1 min-w-0">
                            <h3 className={`${getContentStyling(watchedValues.size).titleSize} mb-1 leading-tight`}>
                              {(() => {
                                const title = currentAd.title || 'HyperX Cloud Alpha Wireless';
                                const maxTitleLength = watchedValues.size === '160x600' ? 25 : 
                                                     watchedValues.size === '728x90' ? 35 : 50;
                                return title.length > maxTitleLength 
                                  ? title.substring(0, maxTitleLength) + '...'
                                  : title;
                              })()}
                            </h3>
                            <p className={`${getContentStyling(watchedValues.size).descriptionSize} ${getContentStyling(watchedValues.size).descriptionLines} opacity-80 leading-tight`}>
                              {(() => {
                                const maxLength = getContentStyling(watchedValues.size).maxDescription;
                                const description = currentAd.description || 'Gaming Headset for PC, 300-hour battery life, DTS Headphone:X Spatial Audio, Memory foam, Dual Chamber Drivers, Noise-canceling mic, Durable aluminum frame, Red';
                                return description.length > maxLength 
                                  ? description.substring(0, maxLength) + '...'
                                  : description;
                              })()}
                            </p>
                          </div>
                          <button
                            className={`${getContentStyling(watchedValues.size).buttonSize} ${getContentStyling(watchedValues.size).buttonWidth || ''} rounded font-semibold transition-colors ${getContentStyling(watchedValues.size).layout === 'flex-row' ? 'ml-4' : 'mt-2'} flex-shrink-0`}
                            style={{
                              backgroundColor: watchedValues.theme.ctaColor,
                              color: 'white',
                            }}
                          >
                            {currentAd.ctaText || 'Buy Now'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Embed Code</Label>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <code className="text-sm">{generateEmbedCode()}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Copy and paste this code into your website where you want the ad to appear.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Widget Info */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size:</span>
                <Badge variant="outline">{watchedValues.size}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ad Count:</span>
                <Badge variant="outline">{watchedValues.ads?.length || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rotation:</span>
                <Badge variant="outline">{watchedValues.rotationInterval}s</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}