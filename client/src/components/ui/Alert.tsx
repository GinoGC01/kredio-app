import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const config: Record<AlertType, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  success: {
    icon: <FaCheckCircle className="text-success" />,
    bg: 'bg-stat-teal-bg',
    border: 'border-success',
    text: 'text-success',
  },
  error: {
    icon: <FaExclamationCircle className="text-danger" />,
    bg: 'bg-stat-red-bg',
    border: 'border-danger',
    text: 'text-danger',
  },
  warning: {
    icon: <FaExclamationTriangle className="text-warning" />,
    bg: 'bg-stat-blue-bg',
    border: 'border-warning',
    text: 'text-warning',
  },
  info: {
    icon: <FaInfoCircle className="text-info" />,
    bg: 'bg-stat-purple-bg',
    border: 'border-info',
    text: 'text-accent-purple',
  },
};

export const Alert = ({ type, message, onClose }: AlertProps) => {
  const { icon, bg, border, text } = config[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${border} ${text}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="text-sm flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="shrink-0 hover:opacity-70">
          <FaTimes />
        </button>
      )}
    </div>
  );
};
