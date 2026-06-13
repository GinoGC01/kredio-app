import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-[4px]',
};

export const Loader = ({ size = 'md', text }: LoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizes[size]} rounded-full border-border border-t-accent-purple animate-spin`}
      />
      {text && <p className="text-sm text-text-muted">{text}</p>}
    </div>
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader size="lg" />
  </div>
);
