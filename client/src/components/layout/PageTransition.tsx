import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove any existing overlays
    const overlays = document.querySelectorAll('.page-loading-overlay');
    overlays.forEach(overlay => overlay.remove());

    // Add loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-loading-overlay';
    overlay.innerHTML = `
      <div class="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
    `;
    document.body.appendChild(overlay);

    // Fade out overlay after content loads
    const timer = setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        setIsLoading(false);
      }, 300);
    }, 100);

    return () => {
      clearTimeout(timer);
      overlay.remove();
    };
  }, []);

  return (
    <div className={`transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
      {children}
    </div>
  );
}