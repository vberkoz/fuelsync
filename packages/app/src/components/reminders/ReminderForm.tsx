import { Field, Label, Listbox } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReminderFormProps {
  formData: {
    title: string;
    type: string;
    threshold: string;
    unit: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export function ReminderForm({ formData, onFieldChange, onSubmit, onCancel, isSubmitting, isEditing }: ReminderFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field>
        <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.reminderTitle')}</Label>
        <input 
          type="text" 
          value={formData.title} 
          onChange={(e) => onFieldChange('title', e.target.value)} 
          placeholder="Oil Change" 
          className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
        />
      </Field>

      <Field>
        <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.type')}</Label>
        <Listbox value={formData.type} onChange={(value) => onFieldChange('type', value)}>
          <div className="relative">
            <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <span>{formData.type}</span>
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
              {['Maintenance', 'Document', 'Inspection'].map((type) => (
                <Listbox.Option
                  key={type}
                  value={type}
                  className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                >
                  {({ selected }) => (
                    <div className="flex justify-between items-center">
                      <span className={selected ? 'font-semibold text-white' : 'text-white'}>{type}</span>
                      {selected && <Check className="h-5 w-5 text-indigo-500" />}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.threshold')}</Label>
          <input 
            type="number" 
            value={formData.threshold} 
            onChange={(e) => onFieldChange('threshold', e.target.value)} 
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </Field>

        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.unit')}</Label>
          <Listbox value={formData.unit} onChange={(value) => onFieldChange('unit', value)}>
            <div className="relative">
              <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <span>{formData.unit}</span>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                {['km', 'days', 'months'].map((unit) => (
                  <Listbox.Option
                    key={unit}
                    value={unit}
                    className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                  >
                    {({ selected }) => (
                      <div className="flex justify-between items-center">
                        <span className={selected ? 'font-semibold text-white' : 'text-white'}>{unit}</span>
                        {selected && <span className="text-indigo-500 text-lg">✓</span>}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </Field>
      </div>

      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isEditing ? t('common.save') : t('common.add')}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
