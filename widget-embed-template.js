(function() {
  var widgetId = __WIDGET_ID__;
  var baseUrl = '__BASE_URL__';
  
  // Create widget container
  var container = document.createElement('div');
  container.id = 'affiliate-widget-' + widgetId;
  container.style.cssText = 'position: relative; overflow: hidden; border-radius: 8px; font-family: Arial, sans-serif;';
  
  // Insert container where script is loaded
  var currentScript = document.currentScript || document.scripts[document.scripts.length - 1];
  currentScript.parentNode.insertBefore(container, currentScript);
  
  // Load widget data using JSONP to avoid CORS issues
  var callbackName = 'widgetCallback_' + widgetId + '_' + Math.random().toString(36).substr(2, 9);
  window[callbackName] = function(data) {
    try {
      if (!data.success) {
        throw new Error('Widget data invalid');
      }
      
      var widget = data.widget;
      
      // Size configurations for different ad formats
      var sizeConfigs = {
        '160x600': { width: 160, height: 600, layout: 'vertical' },
        '300x250': { width: 300, height: 250, layout: 'vertical' },
        '300x600': { width: 300, height: 600, layout: 'vertical' },
        '728x90': { width: 728, height: 90, layout: 'horizontal' },
        '970x250': { width: 970, height: 250, layout: 'horizontal' },
        '320x50': { width: 320, height: 50, layout: 'horizontal' },
        '468x60': { width: 468, height: 60, layout: 'horizontal' }
      };
      
      var config = sizeConfigs[widget.size] || sizeConfigs['300x250'];
      container.style.width = config.width + 'px';
      container.style.height = config.height + 'px';
      
      var currentAdIndex = 0;

      function renderAd(ad, index) {
        var gradient = widget.theme.bgColor.startsWith('linear-gradient') ? widget.theme.bgColor : 'linear-gradient(135deg, ' + widget.theme.bgColor + ' 0%, ' + widget.theme.bgColor + ' 100%)';
        
        var adHtml = '<div style="background: ' + gradient + '; color: ' + widget.theme.textColor + '; width: 100%; height: 100%; display: flex; align-items: center; padding: ' + (config.layout === 'horizontal' ? '4px' : '16px') + '; box-sizing: border-box; font-family: ' + widget.theme.font + ', Arial, sans-serif; position: relative; overflow: hidden;">';
        
        if (config.layout === 'horizontal') {
          // Horizontal layout for leaderboard formats
          adHtml += '<img src="' + ad.imageUrl + '" style="width: 80px; height: 80px; object-fit: ' + widget.theme.imageFit + '; border-radius: 8px; margin-right: 12px; transform: scale(' + (widget.theme.imageScale / 100) + ');" alt="' + ad.title + '">';
          adHtml += '<div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">';
          adHtml += '<h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; line-height: 1.2;">' + ad.title + '</h3>';
          adHtml += '<p style="margin: 0 0 8px 0; font-size: 11px; color: ' + widget.theme.descriptionColor + '; line-height: 1.2;">' + ad.description + '</p>';
          adHtml += '</div>';
          adHtml += '<button onclick="window.open(\\''+ad.url+'\\', \\'_blank\\');" style="background: ' + widget.theme.ctaColor + '; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 80px; height: 32px;">' + ad.ctaText + '</button>';
        } else {
          // Vertical layout for rectangle formats
          adHtml += '<div style="text-align: center; width: 100%;">';
          adHtml += '<img src="' + ad.imageUrl + '" style="width: ' + Math.min(config.width * 0.7, 160) + 'px; height: ' + Math.min(config.width * 0.7, 160) + 'px; object-fit: ' + widget.theme.imageFit + '; border-radius: 8px; margin-bottom: 12px; transform: scale(' + (widget.theme.imageScale / 100) + ');" alt="' + ad.title + '">';
          adHtml += '<h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; line-height: 1.2;">' + ad.title + '</h3>';
          adHtml += '<p style="margin: 0 0 12px 0; font-size: 14px; color: ' + widget.theme.descriptionColor + '; line-height: 1.4;">' + ad.description + '</p>';
          adHtml += '<button onclick="window.open(\\''+ad.url+'\\', \\'_blank\\');" style="background: ' + widget.theme.ctaColor + '; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; width: 120px;">' + ad.ctaText + '</button>';
          adHtml += '</div>';
        }
        
        adHtml += '</div>';
        container.innerHTML = adHtml;
      }

      if (widget.ads && widget.ads.length > 0) {
        renderAd(widget.ads[currentAdIndex], currentAdIndex);
        
        if (widget.ads.length > 1 && widget.rotationInterval > 0) {
          setInterval(function() {
            currentAdIndex = (currentAdIndex + 1) % widget.ads.length;
            renderAd(widget.ads[currentAdIndex], currentAdIndex);
          }, widget.rotationInterval * 1000);
        }
      }
      
      // Clean up callback
      delete window[callbackName];
    } catch (error) {
      console.error('Affiliate widget error:', error.message || error);
      container.innerHTML = '<div style="padding: 16px; text-align: center; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">Unable to load advertisement</p><p style="color: #9ca3af; font-size: 10px; margin: 4px 0 0 0;">Error: ' + (error.message || 'Network error') + '</p></div>';
      delete window[callbackName];
    }
  };
  
  // Create and load JSONP script
  var script = document.createElement('script');
  script.src = baseUrl + '/widgets/' + widgetId + '/data?callback=' + callbackName;
  script.onerror = function() {
    console.error('Affiliate widget error:', 'Failed to load widget data script');
    container.innerHTML = '<div style="padding: 16px; text-align: center; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">Unable to load advertisement</p><p style="color: #9ca3af; font-size: 10px; margin: 4px 0 0 0;">Error: Script loading failed</p></div>';
    delete window[callbackName];
  };
  document.head.appendChild(script);
})();