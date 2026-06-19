import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  disabled?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  disabled,
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
            variant === 'danger' ? 'bg-stat-red-bg text-danger' : 'bg-stat-blue-bg text-warning'
          }`}
        >
          <FaExclamationTriangle />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {typeof message === 'string' ? (
          <p className="text-sm text-text-secondary max-w-xs">{message}</p>
        ) : (
          <div className="text-sm text-text-secondary w-full text-left">{message}</div>
        )}
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} disabled={disabled}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
