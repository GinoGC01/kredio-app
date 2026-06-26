import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  exiting: boolean;
}

interface AlertContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const icons: Record<ToastType, React.ReactNode> = {
  success: <FaCheckCircle className="text-success" />,
  error: <FaExclamationCircle className="text-danger" />,
  info: <FaInfoCircle className="text-info" />,
  warning: <FaExclamationTriangle className="text-warning" />,
};

const borders: Record<ToastType, string> = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-info',
  warning: 'border-l-warning',
};

const glowColors: Record<ToastType, string> = {
  success: 'rgba(38, 166, 154, 0.08)',
  error: 'rgba(240, 95, 122, 0.08)',
  info: 'rgba(92, 124, 250, 0.08)',
  warning: 'rgba(255, 140, 66, 0.08)',
};

const progressColors: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 300);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, exiting: false }]);
      const timer = setTimeout(() => removeToast(id), 4000);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  // Trigger enter animation after mount
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (toast.exiting) {
      setVisible(false);
      setProgress(0);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / 4000) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [toast.exiting]);

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden
        flex items-start gap-3.5
        bg-bg-card border ${borders[toast.type]} border-l-4
        rounded-2xl shadow-2xl
        px-4 py-3.5 pr-3
      `}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
        transition: toast.exiting
          ? 'opacity 0.25s ease-in, transform 0.25s ease-in'
          : 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ backgroundColor: glowColors[toast.type] }}
      />
      <span className="shrink-0 mt-0.5 text-base relative z-10">{icons[toast.type]}</span>
      <p className="text-sm text-text-primary flex-1 leading-relaxed relative z-10">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 mt-0.5 text-text-muted hover:text-text-primary rounded-lg p-1 hover:bg-bg-card-hover transition-colors relative z-10"
      >
        <FaTimes className="w-3 h-3" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
        <div
          className="h-full rounded-full transition-none"
          style={{ width: `${progress}%`, backgroundColor: progressColors[toast.type] }}
        />
      </div>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useToast must be used within an AlertProvider');
  return { addToast: context.addToast };
};
