import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>}
      <input
        className={`input-base ${error ? '!border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
};
