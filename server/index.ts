import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureApplicationSecurity, securityAuditMiddleware, ipSecurityMiddleware, botDetectionMiddleware } from "./securityConfig";
import { schedulerService } from "./SchedulerService";

const app = express();

// Add iframe route BEFORE security middleware to bypass restrictions
app.get('/widgets/:id/iframe', async (req, res) => {
  try {
    // Set no-cache headers for immediate updates
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('Last-Modified', new Date().toUTCString());
    res.header('ETag', `"${Date.now()}-${Math.random()}"`);
    res.header('Vary', 'Accept-Encoding');
    res.header('X-Frame-Options', 'ALLOWALL');
    res.header('Content-Security-Policy', 'frame-ancestors *');
    
    const { storage } = await import('./storage');
    const widgetId = parseInt(req.params.id);
    const widget = await storage.getAdWidget(widgetId);
    
    if (!widget || !widget.isActive) {
      return res.status(404).send('<html><body>Widget not found</body></html>');
    }

    // Track view
    await storage.createAdWidgetAnalytics({
      widgetId,
      eventType: 'view',
      referrer: req.get('Referer') || null,
      userAgent: req.get('User-Agent') || null,
      ipAddress: req.ip || null
    });

    const sizeStyles = {
      '300x250': 'width: 300px; height: 250px;',
      '728x90': 'width: 728px; height: 90px;',
      '160x600': 'width: 160px; height: 600px;',
      '100%': 'width: 100%; height: 250px;'
    };

    const ads = typeof widget.ads === 'string' ? JSON.parse(widget.ads) : (widget.ads || []);
    const theme = typeof widget.theme === 'string' ? JSON.parse(widget.theme) : (widget.theme || {});
    const currentAd = ads[0] || {};
    
    // Use size parameter from query string for demo purposes, otherwise use widget's stored size
    const demoSize = req.query.size as string;
    const effectiveSize = demoSize || widget.size;
    
    // Auto-detect layout based on iframe dimensions from query parameters or widget size
    let layoutSize = effectiveSize;
    
    // Check if iframe dimensions are provided via query parameters (for external embedding)
    const iframeWidth = req.query.w ? parseInt(req.query.w as string) : null;
    const iframeHeight = req.query.h ? parseInt(req.query.h as string) : null;
    
    let detectionWidth, detectionHeight;
    
    if (iframeWidth && iframeHeight) {
      // Use iframe dimensions from query parameters
      detectionWidth = iframeWidth;
      detectionHeight = iframeHeight;
    } else if (effectiveSize !== '100%') {
      // Fall back to widget's stored size
      [detectionWidth, detectionHeight] = effectiveSize.split('x').map(Number);
    }
    
    if (detectionWidth && detectionHeight) {
      // If width is much larger than height, it's horizontal (leaderboard style)
      if (detectionWidth > detectionHeight * 1.5) {
        layoutSize = '728x90'; // Use horizontal layout template
        console.log(`🎯 Layout Detection: ${detectionWidth}x${detectionHeight} → HORIZONTAL (${layoutSize})`);
      }
      // If height is much larger than width, it's vertical (skyscraper style)  
      else if (detectionHeight > detectionWidth * 1.5) {
        layoutSize = '160x600'; // Use vertical layout template
        console.log(`🎯 Layout Detection: ${detectionWidth}x${detectionHeight} → VERTICAL (${layoutSize})`);
      }
      // Otherwise it's square/rectangular (medium rectangle style)
      else {
        layoutSize = '300x250'; // Use square layout template
        console.log(`🎯 Layout Detection: ${detectionWidth}x${detectionHeight} → SQUARE (${layoutSize})`);
      }
    }
    
    // Define specific layouts for each widget size
    const widgetLayouts = {
      '728x90': {
        flexDirection: 'row',
        textAlign: 'center',
        imageSize: { width: '80px', height: '60px' },
        imageMargin: '0 12px 0 0',
        contentDirection: 'row',
        contentAlign: 'center',
        buttonMargin: '0 0 0 15px'
      },
      '300x250': {
        flexDirection: 'column',
        textAlign: 'left',
        imageSize: { width: '140px', height: '140px' },
        imageMargin: '0 0 15px 0',
        contentDirection: 'column',
        contentAlign: 'stretch',
        buttonMargin: '0 auto'
      },
      '160x600': {
        flexDirection: 'column',
        textAlign: 'left',
        imageSize: { width: '140px', height: '140px' },
        imageMargin: '0 0 15px 0',
        contentDirection: 'column',
        contentAlign: 'stretch',
        buttonMargin: '0 auto'
      },
      '100%': {
        flexDirection: 'column',
        textAlign: 'left',
        imageSize: { width: '140px', height: '140px' },
        imageMargin: '0 0 15px 0',
        contentDirection: 'column',
        contentAlign: 'stretch',
        buttonMargin: '0 auto'
      }
    };
    
    const layout = widgetLayouts[layoutSize as keyof typeof widgetLayouts] || widgetLayouts['300x250'];
    
    const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FireKyt Affiliate Widget</title>
  <!-- Cache-busting v6: ${Date.now()}-${Math.random().toString(36).substr(2, 9)} -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <style>
    * { box-sizing: border-box !important; }
    html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; overflow: hidden !important; }
    body { 
      padding: 0; 
      font-family: ${theme?.font === 'serif' ? 'Georgia, "Times New Roman", Times, serif' : theme?.font === 'monospace' ? '"Courier New", Courier, monospace' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'}; 
      background: transparent; 
      color: ${theme?.textColor || '#000000'}; 
      ${(sizeStyles as any)[effectiveSize] || sizeStyles['300x250']}
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .widget { 
      display: flex !important; 
      flex-direction: ${layout.flexDirection} !important; 
      width: 100% !important;
      height: 100% !important; 
      align-items: center !important; 
      justify-content: center !important;
      background: ${theme?.bgColor || 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'};
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      text-align: ${layout.textAlign};
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
      width: ${layout.imageSize.width}; 
      height: ${layout.imageSize.height}; 
      border-radius: 8px; 
      margin: ${layout.imageMargin}; 
      flex-shrink: 0;
      background: #ffffff;
      border: 2px solid rgba(255,255,255,0.3);
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      position: relative;
      overflow: hidden;
      z-index: 2;
    }
    .image { 
      width: 100%; 
      height: 100%; 
      object-fit: ${theme?.imageFit || 'contain'}; 
      object-position: center;
      border-radius: 12px 0 0 12px;
      transform: scale(${(theme?.imageScale || 100) / 100});
      transition: transform 0.3s ease;
    }
    .content { 
      flex: 1 !important; 
      display: flex !important; 
      flex-direction: ${layout.contentDirection} !important; 
      justify-content: space-between !important;
      align-items: ${layout.contentAlign} !important;
      min-width: 0 !important;
      position: relative !important;
      z-index: 2 !important;
    }
    .text-section {
      flex-grow: 1;
    }
    .title { 
      font-size: 14px; 
      font-weight: 600; 
      margin: 0 0 4px 0; 
      line-height: 1.2; 
      color: ${theme?.textColor || '#ffffff'}; 
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .description { 
      font-size: 11px; 
      margin: 0 0 8px 0; 
      line-height: 1.3; 
      color: ${theme?.textColor || '#e5e7eb'}; 
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .button { 
      background: linear-gradient(135deg, ${theme?.ctaColor || '#10b981'}, ${theme?.ctaColor || '#059669'}); 
      color: white; 
      border: none; 
      border-radius: 8px; 
      padding: 8px 16px; 
      font-size: 12px; 
      font-weight: 700; 
      cursor: pointer; 
      width: fit-content; 
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
      letter-spacing: 0.5px;
      align-self: center;
      margin: ${layout.buttonMargin};
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }
    .button:hover { 
      transform: translateY(-1px); 
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .loading { 
      color: #9ca3af; 
      text-align: center; 
      padding: 20px; 
    }
  </style>
</head>
<body>
  <div class="widget" id="widget">
    ${currentAd.imageUrl ? `<div class="image-container"><img src="${currentAd.imageUrl}" alt="${currentAd.title || 'Product'}" class="image" onerror="this.parentElement.style.display='none'"></div>` : ''}
    <div class="content">
      <div class="text-section">
        <h3 class="title">${(currentAd.title || 'Premium Gaming Headset').replace(/"/g, '&quot;')}</h3>
        <p class="description">${(currentAd.description || 'High-quality wireless gaming headset with superior sound quality').replace(/"/g, '&quot;')}</p>
      </div>
      <button class="button" onclick="handleClick()" onkeypress="if(event.key==='Enter')handleClick()">${(currentAd.ctaText || 'Shop Now').replace(/"/g, '&quot;')}</button>
    </div>
  </div>
  <script>
    // Widget ads data
    const adsData = ${JSON.stringify(ads)};
    let currentAdIndex = 0;
    
    function handleClick() {
      try {
        // Track click analytics
        fetch('/api/widgets/${widgetId}/click', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            referrer: document.referrer || window.location.href,
            timestamp: Date.now() 
          })
        }).catch(e => console.log('Analytics failed:', e));
        
        // Open affiliate URL
        const currentAd = adsData[currentAdIndex] || {};
        const url = currentAd.url || '#';
        if (url && url !== '#') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (e) {
        console.log('Click handler error:', e);
      }
    }
    
    function updateAdDisplay() {
      if (!adsData || adsData.length === 0) return;
      
      const currentAd = adsData[currentAdIndex];
      const widget = document.getElementById('widget');
      const imageContainer = widget.querySelector('.image-container');
      const image = widget.querySelector('.image');
      const title = widget.querySelector('.title');
      const description = widget.querySelector('.description');
      const button = widget.querySelector('.button');
      
      // Update content with smooth transition
      widget.style.opacity = '0.7';
      
      setTimeout(() => {
        if (image && imageContainer) {
          image.src = currentAd.imageUrl || '';
          image.alt = currentAd.title || 'Product';
          imageContainer.style.display = currentAd.imageUrl ? 'flex' : 'none';
        }
        
        if (title) title.textContent = currentAd.title || 'Premium Gaming Headset';
        if (description) description.textContent = currentAd.description || 'High-quality wireless gaming headset';
        if (button) button.textContent = currentAd.ctaText || 'Shop Now';
        
        widget.style.opacity = '1';
      }, 150);
    }
    
    function rotateAds() {
      if (!adsData || adsData.length <= 1) return;
      
      currentAdIndex = (currentAdIndex + 1) % adsData.length;
      updateAdDisplay();
    }
    
    // Initialize widget
    document.addEventListener('DOMContentLoaded', function() {
      const widget = document.getElementById('widget');
      if (widget) {
        widget.style.opacity = '1';
        
        // Start rotation if multiple ads
        if (adsData && adsData.length > 1) {
          setInterval(rotateAds, 5000); // Rotate every 5 seconds
        }
      }
    });
  </script>
</body>
</html>`;

    // Set iframe-friendly headers for WordPress compatibility
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Changed to SAMEORIGIN for better WordPress compatibility
    res.setHeader('Content-Security-Policy', "frame-ancestors *; default-src 'self' 'unsafe-inline' data: *;");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Force fresh content on every load
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    res.send(iframeHtml);
  } catch (error: any) {
    console.error('Serve iframe widget error:', error);
    res.status(500).send('<html><body>Error loading widget</body></html>');
  }
});

// Configure comprehensive security before any other middleware
configureApplicationSecurity(app);

// Security middleware
app.use(securityAuditMiddleware);
app.use(ipSecurityMiddleware);
app.use(botDetectionMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Start the publication scheduler
  schedulerService.start();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully');
    schedulerService.stop();
    server.close(() => {
      log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    log('SIGINT received, shutting down gracefully');
    schedulerService.stop();
    server.close(() => {
      log('Process terminated');
    });
  });
})();
