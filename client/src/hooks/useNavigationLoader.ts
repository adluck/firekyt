import { useState, useCallback } from 'react';

export const useNavigationLoader = () => {
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithLoader = useCallback((url: string, message: string = 'Loading...') => {
    setIsNavigating(true);
    
    // Prevent body scroll and set background immediately
    document.body.classList.add('navigation-loading');
    document.documentElement.style.backgroundColor = 'hsl(var(--background))';
    
    // Create immediate overlay to prevent white flash
    const overlay = document.createElement('div');
    overlay.id = 'navigation-loader';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: hsl(var(--background)) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: inherit !important;
      pointer-events: none !important;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      background: hsl(var(--card));
      padding: 24px 32px;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid hsl(var(--border));
      backdrop-filter: blur(8px);
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid hsl(var(--primary));
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    
    const text = document.createElement('span');
    text.textContent = message;
    text.style.cssText = `
      color: hsl(var(--foreground));
      font-weight: 500;
      font-size: 14px;
    `;
    
    // Add animation keyframes if not already present
    if (!document.getElementById('nav-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'nav-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    content.appendChild(spinner);
    content.appendChild(text);
    overlay.appendChild(content);
    
    // Ensure overlay covers everything
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    
    // Force immediate page navigation with overlay visible
    requestAnimationFrame(() => {
      window.location.href = url;
    });
    
    return () => {
      setIsNavigating(false);
      const existingOverlay = document.getElementById('navigation-loader');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      document.body.style.overflow = '';
    };
  }, []);

  return {
    isNavigating,
    navigateWithLoader
  };
};