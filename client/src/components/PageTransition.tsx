import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { PageLoader } from './PageLoader';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(location);

  useEffect(() => {
    if (location !== previousLocation) {
      setIsTransitioning(true);
      
      // Brief delay to show loading state, then show new page
      const timer = setTimeout(() => {
        setPreviousLocation(location);
        setIsTransitioning(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location, previousLocation]);

  if (isTransitioning) {
    return <PageLoader message="Loading page..." />;
  }

  return <>{children}</>;
};