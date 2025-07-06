import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
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
import { Plus, Trash2, Eye, Code, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import JSZip from "jszip";

// Validation schemas
const adSchema = z.object({
  title: z.string().max(100, "Title too long"),
  description: z.string().max(200, "Description too long"),
  imageUrl: z.string().refine(val => val === "" || z.string().url().safeParse(val).success, "Valid image URL required"),
  ctaText: z.string().min(1, "CTA text is required").max(30, "CTA text too long"),
  url: z.string().refine(val => val === "" || (z.string().url().safeParse(val).success && val.startsWith('https://')), "Valid HTTPS URL required"),
  tags: z.array(z.string()).optional(),
});

const widgetSchema = z.object({
  name: z.string().min(1, "Widget name is required").max(100, "Name too long"),
  size: z.enum(["300x250", "728x90", "160x600", "100%"]),
  theme: z.object({
    bgColor: z.string().min(1, "Background color required"),
    textColor: z.string().min(1, "Text color required"),
    descriptionColor: z.string().min(1, "Description color required"),
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
      descriptionColor: "#e2e8f0",
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
      descriptionColor: "#cbd5e1",
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
      descriptionColor: "#6b7280",
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
      descriptionColor: "#fef3c7",
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
      descriptionColor: "#4b5563",
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
      descriptionColor: "#dbeafe",
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
  const [, navigate] = useLocation();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
  const [embedMode, setEmbedMode] = useState<'javascript' | 'iframe' | 'plugin' | 'wordpress-plugin'>('wordpress-plugin');
  const [previewAdIndex, setPreviewAdIndex] = useState(0);
  
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editWidgetId = urlParams.get('edit');
  const isEditMode = !!editWidgetId;

  // Fetch widget data when in edit mode
  const { data: widgetData, isLoading: isLoadingWidget } = useQuery({
    queryKey: ["/api/widgets", editWidgetId],
    queryFn: async () => {
      if (!editWidgetId) return null;
      const response = await apiRequest("GET", `/api/widgets/${editWidgetId}`);
      return response.json();
    },
    enabled: isEditMode,
  });

  const form = useForm<WidgetFormData>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      name: "My Ad Widget",
      size: "300x250",
      theme: {
        bgColor: "#ffffff",
        textColor: "#333333",
        descriptionColor: "#666666",
        ctaColor: "#007cba",
        font: "sans-serif",
        imageScale: 100,
        imageFit: "cover",
      },
      rotationInterval: 5,
      ads: [
        {
          title: "",
          description: "",
          imageUrl: "",
          ctaText: "Buy Now",
          url: "",
          tags: [],
        },
      ],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ads"
  });

  // Load widget data into form when in edit mode
  useEffect(() => {
    if (widgetData?.widget && isEditMode) {
      const widget = widgetData.widget;
      form.reset({
        name: widget.name,
        size: widget.size,
        theme: widget.theme,
        rotationInterval: widget.rotationInterval,
        ads: widget.ads || [{
          title: "",
          description: "",
          imageUrl: "",
          ctaText: "Buy Now",
          url: "",
          tags: [],
        }]
      });
    }
  }, [widgetData, isEditMode, form]);

  const watchedValues = form.watch();
  const currentAd = watchedValues.ads?.[currentAdIndex] || watchedValues.ads?.[0];
  const previewAd = watchedValues.ads?.[previewAdIndex] || watchedValues.ads?.[0];

  // Add preview rotation effect
  useEffect(() => {
    if (previewMode === 'preview' && watchedValues.ads?.length > 1) {
      const interval = setInterval(() => {
        setPreviewAdIndex(prevIndex => 
          prevIndex >= (watchedValues.ads?.length || 1) - 1 ? 0 : prevIndex + 1
        );
      }, watchedValues.rotationInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [previewMode, watchedValues.ads?.length, watchedValues.rotationInterval]);

  const applyTemplate = (template: typeof templateOptions[0]) => {
    form.setValue("theme", {
      bgColor: template.theme.bgColor,
      textColor: template.theme.textColor,
      descriptionColor: template.theme.descriptionColor || "#666666",
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

  // State for created widget ID
  const [createdWidgetId, setCreatedWidgetId] = useState<number | null>(null);

  const saveWidget = useMutation({
    mutationFn: async (data: WidgetFormData) => {
      if (isEditMode && editWidgetId) {
        console.log('🔄 Making PUT request to:', `/api/widgets/${editWidgetId}`);
        try {
          const response = await apiRequest("PUT", `/api/widgets/${editWidgetId}`, data);
          console.log('✅ PUT request successful, response status:', response.status);
          const responseText = await response.text();
          console.log('✅ Response body:', responseText);
          
          // Create a new response with the same data for the mutation to use
          const clonedResponse = new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
          
          return clonedResponse;
        } catch (error) {
          console.error('❌ PUT request failed:', error);
          throw error;
        }
      } else {
        return apiRequest("POST", "/api/widgets", data);
      }
    },
    onSuccess: async (response) => {
      const result = await response.json();
      
      toast({
        title: isEditMode ? "Widget Updated" : "Widget Created",
        description: isEditMode 
          ? "Your ad widget has been updated successfully."
          : "Your ad widget has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ["/api/widgets", editWidgetId] });
      }
      
      // Store the created widget ID for embed code generation
      if (!isEditMode && result.widget?.id) {
        setCreatedWidgetId(result.widget.id);
      }
      
      if (!isEditMode) {
        form.reset();
      }
      
      // Navigate to widgets management page
      setTimeout(() => {
        navigate("/ads-widgets");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditMode ? "Failed to update widget" : "Failed to create widget"),
        variant: "destructive",
      });
    },
  });

  const addAd = () => {
    const newAdIndex = fields.length;
    
    // Create the new empty ad using useFieldArray append
    append({
      title: "",
      description: "",
      imageUrl: "",
      ctaText: "Buy Now",
      url: "",
      tags: [],
    });
    
    // Switch to the new ad
    setCurrentAdIndex(newAdIndex);
  };

  const removeAd = (index: number) => {
    if (fields.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one ad is required",
        variant: "destructive",
      });
      return;
    }
    remove(index);
    if (currentAdIndex >= fields.length - 1) {
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
          padding: 'px-4 pt-1 pb-7',
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
    const widgetId = isEditMode ? editWidgetId : createdWidgetId;
    if (widgetId) {
      return `<script src="${window.location.origin}/widgets/${widgetId}/embed.js"></script>`;
    }
    return `<script src="${window.location.origin}/widgets/{widget-id}/embed.js"></script>`;
  };

  const generateIframeCode = () => {
    const widgetId = isEditMode ? editWidgetId : createdWidgetId;
    const size = watchedValues.size || '300x250';
    const [width, height] = size === '100%' ? ['100%', '250px'] : size.split('x').map(s => s + 'px');
    
    // For responsive widgets (100% width), don't add query parameters
    // For fixed-size widgets, add query parameters for layout detection
    let iframeSrc;
    if (size === '100%') {
      // Responsive - no query parameters needed
      iframeSrc = widgetId 
        ? `${window.location.origin}/widgets/${widgetId}/iframe`
        : `${window.location.origin}/widgets/{widget-id}/iframe`;
    } else {
      // Fixed size - add query parameters for layout detection
      const widthNum = width.replace('px', '');
      const heightNum = height.replace('px', '');
      iframeSrc = widgetId 
        ? `${window.location.origin}/widgets/${widgetId}/iframe?w=${widthNum}&h=${heightNum}`
        : `${window.location.origin}/widgets/{widget-id}/iframe?w=${widthNum}&h=${heightNum}`;
    }
    
    return `<iframe src="${iframeSrc}" width="${width}" height="${height}" frameborder="0" scrolling="no" style="border: none; display: block; margin: 10px 0;"></iframe>`;
  };

  const onSubmit = (data: WidgetFormData) => {
    console.log('🚀 Form submission triggered with data:', data);
    console.log('🚀 Edit mode:', isEditMode, 'Widget ID:', editWidgetId);
    saveWidget.mutate(data);
  };

  // Show loading state while fetching widget data
  if (isEditMode && isLoadingWidget) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group" 
          onClick={() => navigate('/ads-widgets')}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isEditMode ? "Edit Ad Widget" : "Create Ad Widget"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {isEditMode 
              ? "Modify and optimize your existing ad widget configuration"
              : "Design and customize a professional affiliate ad widget with real-time preview"
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Form Section */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log('❌ Form validation errors:', errors);
            })} className="space-y-6">
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

              {/* Advertisement Content */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Advertisement Content
                      </CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create multiple ads with automatic rotation for better performance</p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={addAd} 
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm hover:shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Advertisement
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Ad Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={currentAdIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentAdIndex(index)}
                        >
                          Ad {index + 1}
                        </Button>
                        {fields.length > 1 && (
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
                  {currentAdIndex < fields.length && (
                    <div key={`ad-form-${currentAdIndex}`} className="space-y-4 border rounded-lg p-4">
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

              {/* Professional Design Templates */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Design Templates</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Professional pre-built designs optimized for conversion</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templateOptions.map((template) => (
                      <div
                        key={template.id}
                        className="template-card relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                        onClick={() => applyTemplate(template)}
                      >
                        <div className={`${template.preview} h-20 rounded-xl p-4 border border-slate-200 hover:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-md`}>
                          <div className="text-white text-sm font-medium mb-1 drop-shadow-md">
                            {template.name}
                          </div>
                          <div className="text-white text-xs opacity-90 line-clamp-1 drop-shadow-sm">
                            {template.description}
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <div className="bg-white/95 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                              <span className="text-xs text-emerald-600 font-medium">✓</span>
                            </div>
                          </div>
                        </div>
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

              {/* Advanced Customization */}
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Advanced Customization
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Fine-tune colors and typography for perfect brand alignment</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
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
                          <FormLabel>Title Color</FormLabel>
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
                      name="theme.descriptionColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-16 h-10" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#666666" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="theme.ctaColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Button Color</FormLabel>
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 py-3"
                disabled={saveWidget.isPending}
              >
                {saveWidget.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {isEditMode ? "Updating Widget..." : "Creating Widget..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{isEditMode ? "Update Widget" : "Create Widget"}</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Live Preview Section - Sticky */}
        <div className="space-y-6 sticky top-6 h-fit">
          <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  Live Preview
                </CardTitle>
                <div className="flex items-center gap-4">
                  {watchedValues.ads?.length > 1 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>Ad {previewAdIndex + 1} of {watchedValues.ads.length}</span>
                      <span>•</span>
                      <span>{watchedValues.rotationInterval}s rotation</span>
                    </div>
                  )}
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <Button
                      type="button"
                      variant={previewMode === 'preview' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewMode('preview')}
                      className={previewMode === 'preview' 
                        ? 'bg-white dark:bg-slate-800 shadow-sm' 
                        : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant={previewMode === 'code' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPreviewMode('code')}
                      className={previewMode === 'code' 
                        ? 'bg-white dark:bg-slate-800 shadow-sm' 
                        : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                      }
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Embed Code
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
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
                    {previewAd && (
                      <>
                        {previewAd.imageUrl && (
                          <div className={`${getContentStyling(watchedValues.size).imageSize} flex-shrink-0`}>
                            <img
                              src={previewAd.imageUrl}
                              alt={previewAd.title}
                              className="w-full h-full object-center rounded-lg"
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
                                const title = previewAd.title || 'Product Title';
                                const maxTitleLength = watchedValues.size === '160x600' ? 25 : 
                                                     watchedValues.size === '728x90' ? 35 : 50;
                                return title.length > maxTitleLength 
                                  ? title.substring(0, maxTitleLength) + '...'
                                  : title;
                              })()}
                            </h3>
                            <p 
                              className={`${getContentStyling(watchedValues.size).descriptionSize} ${getContentStyling(watchedValues.size).descriptionLines} leading-tight`}
                              style={{ color: watchedValues.theme.descriptionColor }}
                            >
                              {(() => {
                                const maxLength = getContentStyling(watchedValues.size).maxDescription;
                                const description = previewAd.description || 'Enter your product description here...';
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
                            {previewAd.ctaText || 'Buy Now'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {((isEditMode && editWidgetId) || createdWidgetId) ? (
                    <>
                      <div className="space-y-4">
                        {/* Embed Options Tabs */}
                        <div className="border rounded-lg">
                          <div className="flex border-b">
                            <button
                              className={`px-3 py-2 text-sm font-medium border-r ${
                                embedMode === 'wordpress-plugin' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setEmbedMode('wordpress-plugin')}
                            >
                              WP Plugin
                            </button>
                            <button
                              className={`px-3 py-2 text-sm font-medium border-r ${
                                embedMode === 'javascript' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setEmbedMode('javascript')}
                            >
                              JavaScript
                            </button>
                            <button
                              className={`px-3 py-2 text-sm font-medium border-r ${
                                embedMode === 'iframe' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setEmbedMode('iframe')}
                            >
                              Iframe
                            </button>
                            <button
                              className={`px-3 py-2 text-sm font-medium ${
                                embedMode === 'plugin' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setEmbedMode('plugin')}
                            >
                              WP Functions
                            </button>
                          </div>
                          
                          <div className="p-4">
                            {embedMode === 'javascript' ? (
                              <>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">JavaScript Embed Code</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(generateEmbedCode());
                                        toast({
                                          title: "Copied!",
                                          description: "JavaScript embed code copied to clipboard",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Copy failed",
                                          description: "Please copy the code manually",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    Copy to Clipboard
                                  </Button>
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-3">
                                  <code className="text-sm break-all">{generateEmbedCode()}</code>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Best for:</strong> Most websites, blogs, and content management systems. Provides dynamic content and analytics tracking.
                                </p>
                              </>
                            ) : embedMode === 'iframe' ? (
                              <>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">Iframe Embed Code</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(generateIframeCode());
                                        toast({
                                          title: "Copied!",
                                          description: "Iframe embed code copied to clipboard",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Copy failed",
                                          description: "Please copy the code manually",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    Copy to Clipboard
                                  </Button>
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-3">
                                  <code className="text-sm break-all">{generateIframeCode()}</code>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Best for:</strong> WordPress, platforms with strict security policies, or when JavaScript embed doesn't work.
                                </p>
                              </>
                            ) : embedMode === 'plugin' ? (
                              <>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">WordPress Functions.php Solution</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const functionsCode = `// FireKyt Widget Support - Add to your theme's functions.php
// Allow iframes in WordPress content
add_filter('wp_kses_allowed_html', 'firekyt_allow_iframes', 10, 2);
function firekyt_allow_iframes($tags, $context) {
    if ($context === 'post') {
        $tags['iframe'] = array(
            'src' => true,
            'width' => true,
            'height' => true,
            'frameborder' => true,
            'scrolling' => true,
            'style' => true,
            'allow' => true,
            'allowfullscreen' => true,
            'loading' => true,
            'title' => true,
            'alt' => true
        );
    }
    return $tags;
}

// Remove X-Frame-Options for FireKyt widgets
add_action('init', 'firekyt_remove_frame_options');
function firekyt_remove_frame_options() {
    if (isset($_GET['firekyt_widget']) || strpos($_SERVER['REQUEST_URI'], 'firekyt') !== false) {
        remove_action('wp_head', 'wp_frame_options_headers');
        header_remove('X-Frame-Options');
    }
}

// FireKyt Shortcode Support
add_shortcode('firekyt_widget', 'firekyt_widget_shortcode');
function firekyt_widget_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'domain' => '',
        'width' => '',
        'height' => ''
    ), $atts);
    
    if (empty($atts['id'])) return '';
    if (empty($atts['domain'])) $atts['domain'] = '${window.location.hostname}';
    
    // Fetch widget data to get actual dimensions
    $widget_data_url = 'https://' . $atts['domain'] . '/widgets/' . $atts['id'] . '/data';
    $widget_response = wp_remote_get($widget_data_url);
    
    $width = $atts['width'];
    $height = $atts['height'];
    
    // If dimensions not provided, get from widget data
    if (empty($width) || empty($height)) {
        if (!is_wp_error($widget_response)) {
            $widget_data = json_decode(wp_remote_retrieve_body($widget_response), true);
            if ($widget_data && isset($widget_data['widget']['size'])) {
                $size = $widget_data['widget']['size'];
                if ($size === '100%') {
                    $width = $width ?: '100%';
                    $height = $height ?: '250';
                } else {
                    $dimensions = explode('x', $size);
                    if (count($dimensions) === 2) {
                        $width = $width ?: $dimensions[0];
                        $height = $height ?: $dimensions[1];
                    }
                }
            }
        }
        
        // Fallback dimensions if API call fails
        if (empty($width)) $width = '300';
        if (empty($height)) $height = '250';
    }
    
    $iframe_src = 'https://' . $atts['domain'] . '/widgets/' . esc_attr($atts['id']) . '/iframe';
    
    return '<div style="margin: 20px 0; text-align: center;">
        <iframe 
            src="' . esc_url($iframe_src) . '" 
            width="' . esc_attr($width) . '" 
            height="' . esc_attr($height) . '" 
            frameborder="0" 
            scrolling="no" 
            style="border: none; display: block; margin: 0 auto; max-width: 100%;"
            title="FireKyt Affiliate Widget"
            loading="lazy">
            <p>Your browser does not support iframes. <a href="' . $iframe_src . '" target="_blank">View widget</a></p>
        </iframe>
    </div>';
}`;
                                      
                                      try {
                                        await navigator.clipboard.writeText(functionsCode);
                                        toast({
                                          title: "Copied!",
                                          description: "Functions.php code copied to clipboard",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Copy failed",
                                          description: "Please copy the code manually",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    Copy Functions Code
                                  </Button>
                                </div>
                                <div className="space-y-4">
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">⚠️ Plugin Upload Blocked?</p>
                                    <p className="text-sm text-muted-foreground">
                                      Many WordPress hosts block PHP file uploads for security. Use this functions.php approach instead.
                                    </p>
                                  </div>
                                  
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">🔧 Setup Instructions</p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                      <li>Copy the code above using the button</li>
                                      <li>Go to WordPress Admin → Appearance → Theme Editor</li>
                                      <li>Select "functions.php" from the file list</li>
                                      <li>Paste the code at the end of the file</li>
                                      <li>Click "Update File"</li>
                                    </ol>
                                  </div>
                                  
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">🎯 Usage Options</p>
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-sm font-medium">Option 1: Shortcode (After functions.php update)</p>
                                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                                          {`[firekyt_widget id="${(isEditMode && editWidgetId) || createdWidgetId || '{widget-id}'}"]`}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Option 2: Direct iframe (Works immediately)</p>
                                        <p className="text-sm text-muted-foreground">
                                          Use the iframe embed code from the "Iframe" tab in Text/HTML editor mode.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Best for:</strong> WordPress users when plugin upload is blocked. Provides both shortcode and iframe support.
                                </p>
                              </>
                            ) : embedMode === 'wordpress-plugin' ? (
                              <>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">WordPress Plugin (Recommended)</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Create the complete WordPress plugin file content
                                      const pluginContent = `<?php
/**
 * Plugin Name: FireKyt Widget Embedder
 * Description: Safely embed FireKyt affiliate widgets with shortcodes and iframe support.
 * Version: 1.0.0
 * Author: FireKyt
 * Text Domain: firekyt-widgets
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Add iframe allowlist for FireKyt widgets
add_filter('wp_kses_allowed_html', 'firekyt_allow_iframe_tags', 10, 2);
function firekyt_allow_iframe_tags($allowed, $context) {
    if ($context === 'post') {
        $allowed['iframe'] = array(
            'src' => true,
            'width' => true,
            'height' => true,
            'frameborder' => true,
            'style' => true,
            'allowfullscreen' => true,
            'loading' => true,
            'title' => true
        );
    }
    return $allowed;
}

// Register shortcode for FireKyt widgets
add_shortcode('firekyt_widget', 'firekyt_widget_shortcode');
function firekyt_widget_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'domain' => '',
        'width' => '',
        'height' => '',
        'style' => ''
    ), $atts);

    if (empty($atts['id'])) {
        return '<p style="color: red;">FireKyt Widget Error: No widget ID specified</p>';
    }

    if (empty($atts['domain'])) {
        return '<p style="color: red;">FireKyt Widget Error: Domain parameter is required</p>';
    }

    // Fetch widget data to get actual dimensions
    $widget_data_url = 'https://' . $atts['domain'] . '/widgets/' . $atts['id'] . '/data';
    $widget_response = wp_remote_get($widget_data_url);
    
    $width = $atts['width'];
    $height = $atts['height'];
    
    // If dimensions not provided in shortcode, get from widget data
    if (empty($width) || empty($height)) {
        if (!is_wp_error($widget_response)) {
            $widget_data = json_decode(wp_remote_retrieve_body($widget_response), true);
            if ($widget_data && isset($widget_data['widget']['size'])) {
                $size = $widget_data['widget']['size'];
                if ($size === '100%') {
                    $width = $width ?: '100%';
                    $height = $height ?: '250';
                } else {
                    $dimensions = explode('x', $size);
                    if (count($dimensions) === 2) {
                        $width = $width ?: $dimensions[0];
                        $height = $height ?: $dimensions[1];
                    }
                }
            }
        }
        
        // Fallback dimensions if API call fails
        if (empty($width)) $width = '300';
        if (empty($height)) $height = '250';
    }

    $widget_url = 'https://' . $atts['domain'] . '/widgets/' . $atts['id'] . '/iframe';
    
    $style = !empty($atts['style']) ? $atts['style'] : 'border: none; display: block; margin: 10px 0;';
    
    return sprintf(
        '<iframe src="%s" width="%s" height="%s" style="%s" frameborder="0" loading="lazy" title="FireKyt Affiliate Widget"></iframe>',
        esc_url($widget_url),
        esc_attr($width),
        esc_attr($height),
        esc_attr($style)
    );
}

// Add admin menu for plugin settings
add_action('admin_menu', 'firekyt_admin_menu');
function firekyt_admin_menu() {
    add_options_page(
        'FireKyt Widgets',
        'FireKyt Widgets',
        'manage_options',
        'firekyt-widgets',
        'firekyt_admin_page'
    );
}

function firekyt_admin_page() {
    ?>
    <div class="wrap">
        <h1>FireKyt Widget Settings</h1>
        <div class="card" style="max-width: 800px;">
            <h2>How to Use FireKyt Widgets</h2>
            <p>Use the shortcode <code>[firekyt_widget id="YOUR_WIDGET_ID"]</code> to embed widgets in your posts and pages.</p>
            
            <h3>Shortcode Parameters:</h3>
            <ul>
                <li><strong>id</strong> (required): Your widget ID from FireKyt dashboard</li>
                <li><strong>width</strong> (optional): Widget width (default: 100%)</li>
                <li><strong>height</strong> (optional): Widget height (default: 250px)</li>
                <li><strong>style</strong> (optional): Custom CSS styles</li>
            </ul>
            
            <h3>Examples:</h3>
            <code>[firekyt_widget id="123"]</code><br>
            <code>[firekyt_widget id="123" width="300" height="200"]</code><br>
            <code>[firekyt_widget id="123" style="border: 1px solid #ccc; border-radius: 8px;"]</code>
            
            <h3>Support:</h3>
            <p>For help and support, visit your FireKyt dashboard or contact support.</p>
        </div>
    </div>
    <?php
}

// Add TinyMCE button for easy widget insertion
add_action('init', 'firekyt_add_tinymce_button');
function firekyt_add_tinymce_button() {
    if (current_user_can('edit_posts') && current_user_can('edit_pages')) {
        add_filter('mce_buttons', 'firekyt_register_tinymce_button');
        add_filter('mce_external_plugins', 'firekyt_add_tinymce_plugin');
    }
}

function firekyt_register_tinymce_button($buttons) {
    array_push($buttons, 'firekyt_widget_button');
    return $buttons;
}

function firekyt_add_tinymce_plugin($plugin_array) {
    $plugin_array['firekyt_widget_button'] = plugin_dir_url(__FILE__) . 'firekyt-tinymce.js';
    return $plugin_array;
}
?>`;

                                      // Create the TinyMCE JavaScript file content
                                      const tinymceContent = `(function() {
    tinymce.PluginManager.add('firekyt_widget_button', function(editor, url) {
        editor.addButton('firekyt_widget_button', {
            title: 'Insert FireKyt Widget',
            icon: 'dashicon dashicons-format-image',
            onclick: function() {
                var widgetId = prompt('Enter your FireKyt Widget ID:');
                if (widgetId) {
                    editor.insertContent('[firekyt_widget id="' + widgetId + '"]');
                }
            }
        });
    });
})();`;

                                      // Create and download the plugin as a zip file
                                      const zip = new JSZip();
                                      const folder = zip.folder("firekyt-widget-embedder");
                                      
                                      folder!.file("firekyt-widget-embedder.php", pluginContent);
                                      folder!.file("firekyt-tinymce.js", tinymceContent);
                                      folder!.file("README.txt", `=== FireKyt Widget Embedder ===
Contributors: FireKyt
Tags: affiliate, widgets, shortcode, iframe
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPL v2 or later

Safely embed FireKyt affiliate widgets with shortcodes and iframe support.

== Description ==

The FireKyt Widget Embedder plugin allows you to easily embed affiliate widgets from your FireKyt dashboard directly into your WordPress posts and pages using simple shortcodes.

Features:
* Simple shortcode: [firekyt_widget id="123"]
* Automatic iframe security handling
* Customizable widget dimensions
* TinyMCE editor button for easy insertion
* Responsive design support

== Installation ==

1. Upload the plugin files to /wp-content/plugins/firekyt-widget-embedder/
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Use the shortcode [firekyt_widget id="YOUR_WIDGET_ID"] in your content

== Frequently Asked Questions ==

= How do I get a widget ID? =
Create widgets in your FireKyt dashboard and copy the widget ID from the embed section.

= Can I customize the widget appearance? =
Yes, use the style parameter: [firekyt_widget id="123" style="border: 1px solid #ccc;"]

== Changelog ==

= 1.0.0 =
* Initial release
* Shortcode support
* TinyMCE button
* Iframe security handling
`);

                                      zip.generateAsync({type:"blob"}).then((content: Blob) => {
                                        const link = document.createElement('a');
                                        link.href = URL.createObjectURL(content);
                                        link.download = 'firekyt-widget-embedder.zip';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        
                                        toast({
                                          title: "Plugin Downloaded!",
                                          description: "firekyt-widget-embedder.zip has been downloaded to your computer.",
                                        });
                                      });
                                    }}
                                    className="text-xs"
                                  >
                                    Download Plugin
                                  </Button>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">✅ Easiest WordPress Solution</p>
                                    <p className="text-sm text-muted-foreground">
                                      Our WordPress plugin automatically handles iframe security and provides simple shortcodes for widget embedding.
                                    </p>
                                  </div>
                                  
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">📥 Installation Steps</p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                      <li>Download the plugin files using the button above</li>
                                      <li>Go to WordPress Admin → Plugins → Add New → Upload Plugin</li>
                                      <li>Upload the plugin zip file and activate</li>
                                      <li>Configure settings in Settings → FireKyt Widgets</li>
                                    </ol>
                                  </div>
                                  
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">🎯 Usage After Installation</p>
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-sm font-medium">Shortcode Method:</p>
                                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                                          {`[firekyt_widget id="${(isEditMode && editWidgetId) || createdWidgetId || '{widget-id}'}" domain="${window.location.hostname}"]`}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Gutenberg Block:</p>
                                        <p className="text-sm text-muted-foreground">
                                          Search for "FireKyt Widget" in the block editor and enter your widget details.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm font-medium mb-2">🛡️ Security Features</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                      <li>Automatic iframe security validation</li>
                                      <li>Domain whitelist protection</li>
                                      <li>XSS and malicious content filtering</li>
                                      <li>WordPress security standards compliance</li>
                                    </ul>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground">
                                  <strong>Best for:</strong> WordPress users who want the simplest, most secure solution with full Gutenberg and Classic Editor support.
                                </p>
                              </>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">WordPress Users - Important:</h4>
                          <div className="text-sm text-muted-foreground space-y-3">
                            <div>
                              <p><strong>If you see a gray box instead of the widget:</strong></p>
                              <ol className="list-decimal list-inside space-y-1 ml-2 mt-1">
                                <li>Use the <strong>Iframe</strong> embed code (not JavaScript)</li>
                                <li>Switch to <strong>"Text" or "HTML" editor</strong> in WordPress (not Visual)</li>
                                <li>Paste the iframe code where you want the widget</li>
                                <li>Add this line to your theme's functions.php file:</li>
                              </ol>
                            </div>
                            
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono whitespace-pre">
{`add_filter('wp_kses_allowed_html', function($tags) {
    $tags['iframe'] = array(
        'src' => true, 'width' => true, 'height' => true,
        'frameborder' => true, 'style' => true, 'scrolling' => true
    );
    return $tags;
});`}
                            </div>
                            
                            <div className="text-xs">
                              <p className="font-medium">Alternative for Gutenberg Editor:</p>
                              <p>Use a "Custom HTML" block instead of "Paragraph" block</p>
                            </div>
                            
                            <p className="text-xs text-foreground">
                              This code tells WordPress to allow iframe tags for widget embedding.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Create your widget to generate the embed code</p>
                    </div>
                  )}
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