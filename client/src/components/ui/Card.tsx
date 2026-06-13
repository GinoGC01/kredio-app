import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ title, children, className = '', hover = true }: CardProps) => {
  return (
    <div className={`card-base ${hover ? '' : ''} ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};
