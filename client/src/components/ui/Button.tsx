import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', children, className = '', ...props }: ButtonProps) => {
  const base = 'px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 disabled:opacity-50 inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-accent-purple text-white hover:opacity-90',
    secondary: 'bg-bg-input text-text-primary border border-border hover:border-accent-purple',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover',
    outline: 'border border-accent-purple text-accent-purple hover:bg-accent-purple-dim',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
