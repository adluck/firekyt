import React from 'react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center">
      <div className="flex items-center gap-3 bg-card p-6 rounded-lg shadow-lg border">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-foreground font-medium">{message}</span>
      </div>
    </div>
  );
};