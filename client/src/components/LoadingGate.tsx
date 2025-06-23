import React, { useState, useEffect } from 'react';
import { PageLoader } from './PageLoader';

interface LoadingGateProps {
  children: React.ReactNode;
  minLoadTime?: number;
}

export const LoadingGate: React.FC<LoadingGateProps> = ({ 
  children, 
  minLoadTime = 500 
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  if (isLoading) {
    return <PageLoader message="Loading page..." />;
  }

  return <>{children}</>;
};