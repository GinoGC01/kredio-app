import React, { ReactNode, useState, useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Double rAF to ensure the browser paints the initial hidden state first
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(frameId);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onClose(), 250);
  }, [onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
      <div
        className="relative bg-bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          transition: visible
            ? 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'opacity 0.2s ease-in, transform 0.2s ease-in',
        }}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button onClick={handleClose} className="text-text-muted hover:text-text-secondary text-xl leading-none">&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
