import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdSizesDemo = () => {
  const adSizes = [
    {
      size: "728x90",
      name: "Leaderboard",
      description: "Popular banner format for header/footer placement",
      usage: "High visibility, ideal for desktop websites",
      category: "Banner"
    },
    {
      size: "300x250", 
      name: "Medium Rectangle",
      description: "Most popular ad format, versatile placement",
      usage: "Works well in content areas, sidebars",
      category: "Rectangle"
    },
    {
      size: "160x600",
      name: "Wide Skyscraper", 
      description: "Vertical format for sidebar placement",
      usage: "Great for content-heavy pages with sidebars",
      category: "Skyscraper"
    },
    {
      size: "100%",
      name: "Responsive",
      description: "Adapts to container width, mobile-friendly",
      usage: "Perfect for mobile and responsive layouts",
      category: "Responsive"
    }
  ];

  const sampleAd = {
    title: "Sony WH-1000XM5",
    description: "Wireless Noise Canceling Headphones",
    imageUrl: "https://m.media-amazon.com/images/I/51QeS0jzEwL._AC_SL1500_.jpg",
    ctaText: "Shop Now",
    url: "https://amzn.to/example"
  };

  const getIframeSrc = (size: string) => {
    // Create inline widget HTML for demo purposes
    const theme = {
      bgColor: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
      textColor: "#ffffff",
      descriptionColor: "#e2e8f0", 
      ctaColor: "#10b981",
      font: "sans-serif"
    };

    const isCompact = size === '728x90';
    const sizeStyles = {
      '728x90': 'width: 728px; height: 90px;',
      '300x250': 'width: 300px; height: 250px;',
      '160x600': 'width: 160px; height: 600px;',
      '100%': 'width: 100%; height: 250px;'
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FireKyt Widget Demo</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
    body { 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
      background: transparent; 
      color: ${theme.textColor}; 
      ${(sizeStyles as any)[size] || sizeStyles['300x250']}
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .widget { 
      display: flex; 
      flex-direction: ${isCompact ? 'row' : 'column'}; 
      width: 100%;
      height: 100%; 
      align-items: center; 
      justify-content: center;
      background: ${theme.bgColor};
      border-radius: 8px;
      padding: ${isCompact ? '12px 16px' : '20px'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .widget::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 200%;
      height: 200%;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: rotate(45deg);
      z-index: 1;
    }
    .widget::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -30%;
      width: 120%;
      height: 120%;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      z-index: 1;
    }
    .image-container {
      width: ${isCompact ? '80px' : '120px'}; 
      height: ${isCompact ? '60px' : '120px'}; 
      border-radius: 12px; 
      margin: ${isCompact ? '0 15px 0 0' : '0 0 15px 0'}; 
      flex-shrink: 0;
      background: #ffffff;
      border: 3px solid rgba(255,255,255,0.3);
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
    }
    .image { 
      width: 100%; 
      height: 100%; 
      object-fit: contain; 
      object-position: center;
      border-radius: 8px;
    }
    .content { 
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      justify-content: space-between;
      min-width: 0;
      position: relative;
      z-index: 2;
    }
    .title { 
      font-size: ${isCompact ? '14px' : '16px'}; 
      font-weight: 600; 
      margin: 0 0 4px 0; 
      line-height: 1.2; 
      color: ${theme.textColor}; 
    }
    .description { 
      font-size: ${isCompact ? '11px' : '12px'}; 
      margin: 0 0 8px 0; 
      line-height: 1.3; 
      color: ${theme.descriptionColor}; 
      opacity: 0.9;
    }
    .button { 
      background: ${theme.ctaColor}; 
      color: white; 
      border: none; 
      border-radius: 6px; 
      padding: ${isCompact ? '6px 12px' : '8px 16px'}; 
      font-size: ${isCompact ? '11px' : '12px'}; 
      font-weight: 600; 
      cursor: pointer; 
      text-decoration: none;
      display: inline-block;
      text-align: center;
      margin: 0 auto;
      position: relative;
      z-index: 2;
      transition: transform 0.2s ease;
    }
    .button:hover { 
      transform: translateY(-1px); 
    }
  </style>
</head>
<body>
  <div class="widget">
    <div class="image-container">
      <img src="${sampleAd.imageUrl}" alt="${sampleAd.title}" class="image" />
    </div>
    <div class="content">
      <div class="title">${sampleAd.title}</div>
      <div class="description">${sampleAd.description}</div>
      <a href="${sampleAd.url}" class="button" target="_blank">${sampleAd.ctaText}</a>
    </div>
  </div>
</body>
</html>`;

    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Ad Widget Size Gallery
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Explore all available widget formats with live previews showing how they appear on websites
        </p>
      </div>

      <div className="grid gap-8">
        {adSizes.map((adSize) => (
          <Card key={adSize.size} className="border-slate-200 dark:border-slate-700">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                    {adSize.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-mono">
                      {adSize.size}
                    </Badge>
                    <Badge variant="secondary">
                      {adSize.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-slate-600 dark:text-slate-400">
                  {adSize.description}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  <strong>Best for:</strong> {adSize.usage}
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Live Preview
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/20 overflow-auto">
                    <div className="flex items-center justify-center min-h-[100px]">
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
                          maxWidth: '100%'
                        }}
                        title={`${adSize.name} Widget Demo`}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-80 space-y-4">
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
                        <span>Format:</span>
                        <span>{adSize.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Orientation:</span>
                        <span>
                          {adSize.size === '728x90' ? 'Horizontal' :
                           adSize.size === '160x600' ? 'Vertical' :
                           adSize.size === '100%' ? 'Responsive' : 'Square'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Common Placements
                    </h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      {adSize.size === '728x90' && (
                        <>
                          <li>• Website headers</li>
                          <li>• Above/below content</li>
                          <li>• Footer areas</li>
                        </>
                      )}
                      {adSize.size === '300x250' && (
                        <>
                          <li>• Sidebar placement</li>
                          <li>• Within content</li>
                          <li>• End of articles</li>
                        </>
                      )}
                      {adSize.size === '160x600' && (
                        <>
                          <li>• Side navigation</li>
                          <li>• Tall sidebars</li>
                          <li>• Desktop layouts</li>
                        </>
                      )}
                      {adSize.size === '100%' && (
                        <>
                          <li>• Mobile layouts</li>
                          <li>• Responsive content</li>
                          <li>• Flexible containers</li>
                        </>
                      )}
                    </ul>
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