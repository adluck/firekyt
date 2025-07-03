import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureApplicationSecurity, securityAuditMiddleware, ipSecurityMiddleware, botDetectionMiddleware } from "./securityConfig";
import { schedulerService } from "./SchedulerService";

const app = express();

// Add iframe route BEFORE security middleware to bypass restrictions
app.get('/widgets/:id/iframe', async (req, res) => {
  try {
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
    const isCompact = widget.size === '728x90';
    
    const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FireKyt Affiliate Widget</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
    body { 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
      background: transparent; 
      color: ${theme?.textColor || '#000000'}; 
      ${(sizeStyles as any)[widget.size] || sizeStyles['300x250']}
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .widget { 
      display: flex; 
      flex-direction: ${isCompact ? 'row' : 'column'}; 
      width: 100%;
      height: 100%; 
      align-items: ${isCompact ? 'center' : 'stretch'}; 
      justify-content: center;
      background: ${theme?.bgColor || 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'};
      border-radius: 8px;
      padding: ${isCompact ? '8px' : '16px'};
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .image { 
      width: ${isCompact ? '60px' : '80px'}; 
      height: ${isCompact ? '40px' : '80px'}; 
      object-fit: cover; 
      border-radius: 4px; 
      margin: ${isCompact ? '0 12px 0 0' : '0 0 12px 0'}; 
      flex-shrink: 0;
      background: #f3f4f6;
    }
    .content { 
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      min-width: 0;
    }
    .title { 
      font-size: ${isCompact ? '14px' : '16px'}; 
      font-weight: 600; 
      margin: 0 0 6px 0; 
      line-height: 1.3; 
      color: ${theme?.textColor || '#ffffff'}; 
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .description { 
      font-size: ${isCompact ? '11px' : '13px'}; 
      margin: 0 0 12px 0; 
      line-height: 1.4; 
      color: ${theme?.textColor || '#e5e7eb'}; 
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: ${isCompact ? '1' : '2'};
      -webkit-box-orient: vertical;
    }
    .button { 
      background: linear-gradient(135deg, ${theme?.ctaColor || '#10b981'}, ${theme?.ctaColor || '#059669'}); 
      color: white; 
      border: none; 
      border-radius: 6px; 
      padding: ${isCompact ? '8px 16px' : '10px 20px'}; 
      font-size: ${isCompact ? '12px' : '14px'}; 
      font-weight: 600; 
      cursor: pointer; 
      margin-top: auto; 
      width: fit-content; 
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-block;
      text-align: center;
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
    ${currentAd.imageUrl ? `<img src="${currentAd.imageUrl}" alt="${currentAd.title || 'Product'}" class="image" onerror="this.style.display='none'">` : ''}
    <div class="content">
      <h3 class="title">${(currentAd.title || 'Premium Gaming Headset').replace(/"/g, '&quot;')}</h3>
      <p class="description">${(currentAd.description || 'High-quality wireless gaming headset with superior sound quality').replace(/"/g, '&quot;')}</p>
      <button class="button" onclick="handleClick()" onkeypress="if(event.key==='Enter')handleClick()">${(currentAd.ctaText || 'Shop Now').replace(/"/g, '&quot;')}</button>
    </div>
  </div>
  <script>
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
        const url = "${currentAd.url || '#'}";
        if (url && url !== '#') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (e) {
        console.log('Click handler error:', e);
      }
    }
    
    // Ensure proper sizing
    document.addEventListener('DOMContentLoaded', function() {
      const widget = document.getElementById('widget');
      if (widget) {
        widget.style.opacity = '1';
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
    res.setHeader('Cache-Control', 'public, max-age=300');
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
