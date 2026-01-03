import { Dialog } from '@headlessui/react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Reminder } from '../stores/reminderStore';

interface ReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  currentOdometer: number;
}

export default function ReminderDialog({ isOpen, onClose, reminders, currentOdometer }: ReminderDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <BellIcon className="h-8 w-8 text-yellow-500" />
              <Dialog.Title className="text-xl font-bold text-white">
                {t('reminders.overdue')}
              </Dialog.Title>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.reminderId} className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">{reminder.title}</h3>
                <p className="text-slate-300 text-sm mb-2">{reminder.type}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-white font-mono">{currentOdometer} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Threshold:</span>
                  <span className="text-yellow-500 font-mono">{reminder.threshold} km</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            {t('common.close')}
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
