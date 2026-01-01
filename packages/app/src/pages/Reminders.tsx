import { useState } from 'react';
import { Dialog, Field, Label, Listbox } from '@headlessui/react';
import { BellIcon, PlusIcon, XMarkIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const mockReminders = [
  { id: '1', title: 'Oil Change', type: 'Maintenance', threshold: 5000, currentValue: 4200, unit: 'km', status: 'active' },
  { id: '2', title: 'Tire Rotation', type: 'Maintenance', threshold: 10000, currentValue: 8500, unit: 'km', status: 'active' },
  { id: '3', title: 'Insurance Renewal', type: 'Document', threshold: 30, currentValue: 15, unit: 'days', status: 'active' },
];

export default function Reminders() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'Maintenance', threshold: '', unit: 'km' });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BellIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('reminders.title')}</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
          {showForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              <span>{t('common.cancel')}</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              <span>{t('reminders.add')}</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <Dialog open={showForm} onClose={() => setShowForm(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">{t('reminders.add')}</Dialog.Title>
              <form className="space-y-5">
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.reminderTitle')}</Label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="Oil Change" 
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </Field>

                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.type')}</Label>
                  <Listbox value={formData.type} onChange={(value) => setFormData({...formData, type: value})}>
                    <div className="relative">
                      <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <span>{formData.type}</span>
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
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
                                {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
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
                      onChange={(e) => setFormData({...formData, threshold: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </Field>

                  <Field>
                    <Label className="block text-sm font-semibold text-white mb-1.5">{t('reminders.unit')}</Label>
                    <Listbox value={formData.unit} onChange={(value) => setFormData({...formData, unit: value})}>
                      <div className="relative">
                        <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <span>{formData.unit}</span>
                          <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
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
                                  {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
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
                  <button type="button" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                    {t('common.add')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {mockReminders.map((reminder) => {
          const progress = (reminder.currentValue / reminder.threshold) * 100;
          const isUrgent = progress >= 80;
          
          return (
            <div key={reminder.id} className={`bg-slate-800 p-6 rounded-lg border-2 ${
              isUrgent ? 'border-yellow-500' : 'border-transparent'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{reminder.title}</h3>
                  <p className="text-slate-400 text-sm">{reminder.type}</p>
                </div>
                {isUrgent && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded">{t('reminders.urgent')}</span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('reminders.current')}</span>
                  <span className="text-white font-mono">{reminder.currentValue} {reminder.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('reminders.threshold')}</span>
                  <span className="text-white font-mono">{reminder.threshold} {reminder.unit}</span>
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        isUrgent ? 'bg-yellow-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-slate-400 text-xs mt-1 text-right font-mono">{progress.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
