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
    bgColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Valid hex color required"),
    textColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Valid hex color required"),
    ctaColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Valid hex color required"),
    font: z.enum(["sans-serif", "serif", "monospace"]),
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

export default function CreateWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');

  const form = useForm<WidgetFormData>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      name: "",
      size: "300x250",
      theme: {
        bgColor: "#ffffff",
        textColor: "#333333",
        ctaColor: "#007cba",
        font: "sans-serif",
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
  });

  const watchedValues = form.watch();
  const currentAd = watchedValues.ads?.[currentAdIndex] || watchedValues.ads?.[0];

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
        title: "",
        description: "",
        imageUrl: "",
        ctaText: "Buy Now",
        url: "",
        tags: [],
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

              {/* Theme Customization */}
              <Card>
                <CardHeader>
                  <CardTitle>Theme Customization</CardTitle>
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
                    style={{
                      ...getSizeStyle(watchedValues.size),
                      backgroundColor: watchedValues.theme.bgColor,
                      color: watchedValues.theme.textColor,
                      fontFamily: watchedValues.theme.font,
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {currentAd && (
                      <>
                        {currentAd.imageUrl && (
                          <img
                            src={currentAd.imageUrl}
                            alt={currentAd.title}
                            style={{
                              width: '100%',
                              height: '60%',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              marginBottom: '8px',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <h3 style={{ 
                          fontSize: watchedValues.size === '728x90' ? '14px' : '16px',
                          fontWeight: 'bold',
                          margin: '0 0 4px 0',
                          lineHeight: '1.2',
                        }}>
                          {currentAd.title || 'Product Title'}
                        </h3>
                        <p style={{ 
                          fontSize: watchedValues.size === '728x90' ? '12px' : '14px',
                          margin: '0 0 8px 0',
                          lineHeight: '1.3',
                          opacity: 0.8,
                        }}>
                          {currentAd.description || 'Product description goes here...'}
                        </p>
                        <button
                          style={{
                            backgroundColor: watchedValues.theme.ctaColor,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: 'auto',
                          }}
                        >
                          {currentAd.ctaText || 'Buy Now'}
                        </button>
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