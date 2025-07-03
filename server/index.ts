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

    const currentAd = widget.ads[0] || {};
    const isCompact = widget.size === '728x90';
    
    const iframeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 16px; font-family: Arial, sans-serif; background: ${widget.theme?.bgColor || '#ffffff'}; color: ${widget.theme?.textColor || '#000000'}; ${sizeStyles[widget.size] || sizeStyles['300x250']} overflow: hidden; }
    .widget { display: flex; flex-direction: ${isCompact ? 'row' : 'column'}; height: 100%; align-items: ${isCompact ? 'center' : 'stretch'}; }
    .image { width: ${isCompact ? '60px' : '80px'}; height: ${isCompact ? '40px' : '80px'}; object-fit: cover; border-radius: 4px; margin: ${isCompact ? '0 8px 0 0' : '0 0 8px 0'}; flex-shrink: 0; }
    .content { flex: 1; display: flex; flex-direction: column; }
    .title { font-size: ${isCompact ? '14px' : '16px'}; font-weight: bold; margin: 0 0 4px 0; line-height: 1.2; color: #1f2937; }
    .description { font-size: ${isCompact ? '11px' : '14px'}; margin: 0 0 8px 0; line-height: 1.3; color: #4b5563; }
    .button { background-color: ${widget.theme?.ctaColor || '#10b981'}; color: white; border: none; border-radius: 4px; padding: ${isCompact ? '6px 12px' : '8px 16px'}; font-size: ${isCompact ? '12px' : '14px'}; font-weight: bold; cursor: pointer; margin-top: auto; width: fit-content; transition: background-color 0.2s; }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="widget">
    ${currentAd.imageUrl ? `<img src="${currentAd.imageUrl}" class="image" onerror="this.style.display='none'">` : ''}
    <div class="content">
      <h3 class="title">${currentAd.title || 'Premium Product'}</h3>
      <p class="description">${currentAd.description || 'High-quality product with excellent features'}</p>
      <button class="button" onclick="window.open('${currentAd.url}', '_blank')">${currentAd.ctaText || 'Shop Now'}</button>
    </div>
  </div>
</body>
</html>`;

    // Set iframe-friendly headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    
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
