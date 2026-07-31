import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Deshabilitar',
  cancelText = 'Cancelar',
  confirmClassName = 'bg-gradient-to-b from-red-400 to-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus();
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white w-full max-w-md rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto modal-enter shadow-[0_16px_48px_rgba(0,0,0,0.1),-4px_-4px_12px_rgba(255,255,255,0.7)] border border-white/60">
        <h3 id="confirm-modal-title" className="text-lg font-heading font-semibold text-brand-800 mb-4">{title}</h3>
        <div className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="clay-btn-secondary px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`clay-btn px-4 py-2 transition-colors ${confirmClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
