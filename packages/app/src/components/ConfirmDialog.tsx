import { Dialog } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
          <Dialog.Title className="text-xl font-bold text-white mb-4">{title}</Dialog.Title>
          <p className="text-slate-300 mb-6">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2 ${confirmButtonClass} text-white rounded-lg disabled:opacity-50`}
            >
              {isLoading ? t('common.deleting') : (confirmText || t('common.delete'))}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50"
            >
              {cancelText || t('common.cancel')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
