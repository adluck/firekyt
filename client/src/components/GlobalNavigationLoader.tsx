import React, { useEffect } from 'react';

export const GlobalNavigationLoader: React.FC = () => {
  useEffect(() => {
    // Set global background to prevent white flash
    document.documentElement.style.backgroundColor = 'hsl(var(--background))';
    document.body.style.backgroundColor = 'hsl(var(--background))';
    
    // Override default page loading behavior
    const style = document.createElement('style');
    style.id = 'global-nav-loader';
    style.textContent = `
      html, body {
        background-color: hsl(var(--background)) !important;
        transition: none !important;
      }
      
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: hsl(var(--background));
        z-index: -1;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('global-nav-loader');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
};