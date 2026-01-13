import React from 'react';
import { Menu } from '@headlessui/react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReminderForm } from './ReminderForm';

interface Reminder {
  reminderId: string;
  vehicleId: string;
  title: string;
  type: string;
  threshold: number;
  unit: string;
  createdAt: string;
}

interface ReminderTableProps {
  reminders: Reminder[];
  currentOdometer: number;
  editingId: string | null;
  formData: any;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

export function ReminderTable({ reminders, currentOdometer, editingId, formData, onFieldChange, onSubmit, onEdit, onDelete, onCancelEdit, isSubmitting }: ReminderTableProps) {
  const { t } = useTranslation();

  const isOverdue = (reminder: Reminder) => {
    if (reminder.unit === 'km') {
      return currentOdometer >= reminder.threshold;
    } else if (reminder.unit === 'days') {
      const daysSinceCreated = Math.floor((Date.now() - new Date(reminder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreated >= reminder.threshold;
    } else if (reminder.unit === 'months') {
      const createdDate = new Date(reminder.createdAt);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
      return monthsDiff >= reminder.threshold;
    }
    return false;
  };

  return (
    <table className="w-full table-fixed">
      <thead>
        <tr className="border-b border-slate-700">
          <th className="text-left p-4 text-slate-400 font-semibold">{t('reminders.reminderTitle')}</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-40">{t('reminders.type')}</th>
          <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('reminders.threshold')}</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-24">{t('reminders.unit')}</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-32">Status</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-16"></th>
        </tr>
      </thead>
      <tbody>
        {reminders.map(r => (
          <React.Fragment key={r.reminderId}>
            <tr className="border-b border-slate-800 hover:bg-slate-800">
              <td className="p-4 text-white">{r.title}</td>
              <td className="p-4 text-white">{r.type}</td>
              <td className="p-4 text-white font-mono text-right">{r.threshold}</td>
              <td className="p-4 text-white">{r.unit}</td>
              <td className="p-4">
                {isOverdue(r) ? (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-semibold">
                    Overdue
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">Active</span>
                )}
              </td>
              <td className="p-4 text-white">
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <MoreVertical className="h-5 w-5 text-slate-400" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => onEdit(r)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <Pencil className="h-4 w-4" />
                          {t('common.edit')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => onDelete(r.reminderId)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </td>
            </tr>
            {editingId === r.reminderId && (
              <tr>
                <td colSpan={6} className="p-0">
                  <div className="bg-slate-750 p-6 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">{t('reminders.edit')}</h3>
                    <ReminderForm 
                      formData={formData}
                      onFieldChange={onFieldChange}
                      onSubmit={onSubmit}
                      onCancel={onCancelEdit}
                      isSubmitting={isSubmitting}
                      isEditing={true}
                    />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
