import { useState, useEffect } from 'react';
import { Dialog, Field, Label, Listbox } from '@headlessui/react';
import { BellIcon, PlusIcon, XMarkIcon, ChevronUpDownIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';

export default function Reminders() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentVehicleId = useVehicleStore(state => state.currentVehicleId);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    vehicleId: currentVehicleId || '', 
    title: '', 
    type: 'Maintenance', 
    threshold: '', 
    unit: 'km'
  });

  const { data: remindersData } = useQuery({
    queryKey: ['reminders'],
    queryFn: api.reminders.list,
    retry: false,
    throwOnError: false
  });

  const createMutation = useMutation({
    mutationFn: api.reminders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
      setFormData({ vehicleId: currentVehicleId || '', title: '', type: 'Maintenance', threshold: '', unit: 'km' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.reminders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setDeleteConfirm(null);
    }
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, vehicleId: currentVehicleId || '' }));
  }, [currentVehicleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.threshold) return;
    createMutation.mutate(formData);
  };

  const reminders = remindersData?.reminders || [];
  const vehicleReminders = reminders.filter((r: any) => r.vehicleId === currentVehicleId);

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
              <span className="max-[439px]:hidden">{t('reminders.add')}</span>
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
              <form onSubmit={handleSubmit} className="space-y-5">
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
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
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

      {vehicleReminders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BellIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No reminders yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {vehicleReminders.map((reminder: any) => (
            <div key={reminder.reminderId} className="bg-slate-800 p-6 rounded-lg border-2 border-transparent">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{reminder.title}</h3>
                  <p className="text-slate-400 text-sm">{reminder.type}</p>
                </div>
                <button 
                  onClick={() => setDeleteConfirm(reminder.reminderId)}
                  className="text-red-400 hover:text-red-300"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('reminders.threshold')}</span>
                  <span className="text-white font-mono">{reminder.threshold} {reminder.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">{t('common.confirmDelete')}</Dialog.Title>
            <p className="text-slate-300 mb-6">{t('reminders.deleteConfirm')}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} 
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                {t('common.delete')}
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                {t('common.cancel')}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
