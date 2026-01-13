import { useState, useEffect } from 'react';
import { Dialog, Menu } from '@headlessui/react';
import { Bell, Plus, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';

import { ReminderForm } from '../components/reminders/ReminderForm';

export default function Reminders() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentVehicleId = useVehicleStore(state => state.currentVehicleId);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const { data: refillsData } = useQuery({
    queryKey: ['refills', currentVehicleId],
    queryFn: () => currentVehicleId ? api.refills.list(currentVehicleId) : Promise.resolve({ refills: [] }),
    enabled: !!currentVehicleId
  });

  const currentVehicle = vehiclesData?.vehicles?.find((v: any) => v.vehicleId === currentVehicleId);
  const refills = refillsData?.refills || refillsData?.pages?.[0]?.refills || [];
  const latestRefill = refills[0];
  const currentOdometer = latestRefill?.odometer || currentVehicle?.odometer || 0;

  const createMutation = useMutation({
    mutationFn: api.reminders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
      setFormData({ vehicleId: currentVehicleId || '', title: '', type: 'Maintenance', threshold: currentOdometer.toString(), unit: 'km' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ reminderId, data }: { reminderId: string; data: any }) => api.reminders.update(reminderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setEditingId(null);
      setFormData({ vehicleId: currentVehicleId || '', title: '', type: 'Maintenance', threshold: currentOdometer.toString(), unit: 'km' });
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
    if (editingId) {
      updateMutation.mutate({ reminderId: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (reminder: any) => {
    setEditingId(reminder.reminderId);
    setFormData({
      vehicleId: reminder.vehicleId,
      title: reminder.title,
      type: reminder.type,
      threshold: reminder.threshold.toString(),
      unit: reminder.unit
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ vehicleId: currentVehicleId || '', title: '', type: 'Maintenance', threshold: currentOdometer.toString(), unit: 'km' });
  };

  const reminders = remindersData?.reminders || [];
  const vehicleReminders = reminders.filter((r: any) => r.vehicleId === currentVehicleId);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-indigo-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('reminders.title')}</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setFormData({ vehicleId: currentVehicleId || '', title: '', type: 'Maintenance', threshold: currentOdometer.toString(), unit: 'km' }); }} className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {showForm ? (
            <>
              <X className="h-5 w-5" />
              <span className="hidden min-[440px]:inline">{t('common.cancel')}</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span className="hidden min-[440px]:inline">{t('reminders.add')}</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{t('reminders.add')}</h2>
          <ReminderForm
            formData={formData}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {vehicleReminders.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No reminders yet. Create one to get started!</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-slate-400">
            Current odometer: <span className="font-mono text-white">{currentOdometer} km</span>
          </div>
          <div className="grid gap-4 sm:gap-6">
          {vehicleReminders.map((reminder: any) => {
            let isOverdue = false;
            
            if (reminder.unit === 'km') {
              isOverdue = currentOdometer >= reminder.threshold;
            } else if (reminder.unit === 'days') {
              const daysSinceCreated = Math.floor((Date.now() - new Date(reminder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              isOverdue = daysSinceCreated >= reminder.threshold;
            } else if (reminder.unit === 'months') {
              const createdDate = new Date(reminder.createdAt);
              const now = new Date();
              const monthsDiff = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
              isOverdue = monthsDiff >= reminder.threshold;
            }
            
            return (
            <div key={reminder.reminderId} className={`bg-slate-800 p-6 rounded-lg border-2 ${isOverdue ? 'border-red-500' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{reminder.title}</h3>
                  <p className="text-slate-400 text-sm">{reminder.type}</p>
                </div>
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <MoreVertical className="h-5 w-5 text-slate-400" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => handleEdit(reminder)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <Pencil className="h-4 w-4" /> {t('common.edit')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => setDeleteConfirm(reminder.reminderId)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <Trash2 className="h-4 w-4" /> {t('common.delete')}
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('reminders.threshold')}</span>
                  <span className="text-white font-mono">{reminder.threshold} {reminder.unit}</span>
                </div>
                {isOverdue && (
                  <div className="mt-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm font-semibold">
                    Overdue
                  </div>
                )}
              </div>
              {editingId === reminder.reminderId && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">{t('reminders.edit')}</h3>
                  <ReminderForm
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancelEdit}
                    isSubmitting={updateMutation.isPending}
                  />
                </div>
              )}
            </div>
            );
          })}
          </div>
        </>
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
