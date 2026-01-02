import { useState } from 'react';
import { Dialog, Menu, Listbox, RadioGroup, Field, Label } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon, ChevronUpDownIcon, CheckIcon, TruckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate } from '../lib/date';
import { useVehicleStore } from '../stores/vehicleStore';

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  fuelType?: string;
  createdAt?: string;
}

export default function Vehicles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get
  });

  const dateFormat = settingsData?.settings?.dateFormat || 'MM/DD/YYYY';

  const vehicles = data?.vehicles || [];

  const createMutation = useMutation({
    mutationFn: api.vehicles.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowForm(false);
      setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.vehicles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowForm(false);
      setEditingId(null);
      setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.vehicles.delete,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.removeQueries({ queryKey: ['refills', id] });
      queryClient.removeQueries({ queryKey: ['expenses', id] });
      setShowDeleteDialog(false);
      setDeleteId(null);
    },
    onError: () => {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleData = { ...formData, year: parseInt(formData.year) };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: vehicleData });
    } else {
      createMutation.mutate(vehicleData);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({ 
      make: vehicle.make || '', 
      model: vehicle.model || '', 
      year: vehicle.year?.toString() || '', 
      licensePlate: vehicle.licensePlate || '',
      fuelType: vehicle.fuelType || 'Regular'
    });
    setEditingId(vehicle.vehicleId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (id === currentVehicleId && vehicles.length > 1) {
      const nextVehicle = vehicles.find((v: Vehicle) => v.vehicleId !== id);
      if (nextVehicle) setCurrentVehicle(nextVehicle.vehicleId);
    }
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <TruckIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('vehicles.title')}</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' }); }} className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
          {showForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              <span>{t('common.cancel')}</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              <span>{t('vehicles.add')}</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('vehicles.loading')}</p>
        </div>
      )}

      {!isLoading && showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">{editingId ? t('vehicles.edit') : t('vehicles.add')}</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.make')}</Label>
                  <input type="text" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.model')}</Label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.year')}</Label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.licensePlate')} <span className="text-xs font-normal text-slate-400">({t('vehicles.optional')})</span></Label>
                  <input type="text" value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.fuelType')}</Label>
                  <Listbox value={formData.fuelType} onChange={(value) => setFormData({...formData, fuelType: value})}>
                    <div className="relative">
                      <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <span>{formData.fuelType}</span>
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {['Regular', 'Premium', 'Diesel'].map((fuel) => (
                          <Listbox.Option
                            key={fuel}
                            value={fuel}
                            className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                          >
                            {({ selected }) => (
                              <div className="flex justify-between items-center">
                                <span className={selected ? 'font-semibold text-white' : 'text-white'}>{fuel}</span>
                                {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </Field>
                <div className="flex gap-2">
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                    {createMutation.isPending || updateMutation.isPending ? t('common.saving') : editingId ? t('common.save') : t('common.add')}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">{t('common.cancel')}</button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      {!isLoading && (
        <RadioGroup value={currentVehicleId || undefined} onChange={setCurrentVehicle}>
          {/* Desktop Table (≥1300px) */}
          <div className="hidden xl:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-semibold"></th>
                  <th className="text-left p-4 text-slate-400 font-semibold">{t('vehicles.year')}</th>
                  <th className="text-left p-4 text-slate-400 font-semibold">{t('vehicles.make')}</th>
                  <th className="text-left p-4 text-slate-400 font-semibold">{t('vehicles.model')}</th>
                  <th className="text-left p-4 text-slate-400 font-semibold">{t('vehicles.licensePlate')}</th>
                  <th className="text-left p-4 text-slate-400 font-semibold">{t('vehicles.fuelType')}</th>
                  <th className="text-left p-4 text-slate-400 font-semibold">{t('vehicles.created')}</th>
                  <th className="text-left p-4 text-slate-400 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v: Vehicle) => (
                  <RadioGroup.Option key={v.vehicleId} value={v.vehicleId} as="tr" className="border-b border-slate-800 hover:bg-slate-800 cursor-pointer">
                    {({ checked }) => (
                      <>
                        <td className="p-4">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            checked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400'
                          }`}>
                            {checked && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                        </td>
                        <td className="p-4 text-white font-mono">{v.year}</td>
                        <td className="p-4 text-white">{v.make}</td>
                        <td className="p-4 text-white">{v.model}</td>
                        <td className="p-4 text-white font-mono uppercase">{v.licensePlate}</td>
                        <td className="p-4 text-white">{v.fuelType}</td>
                        <td className="p-4 text-white font-mono">{v.createdAt ? formatDate(v.createdAt, dateFormat) : ''}</td>
                        <td className="p-4 text-white" onClick={(e) => e.stopPropagation()}>
                          <Menu as="div" className="relative">
                            <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                              <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => navigate(`/refills/${v.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>{t('vehicles.viewRefills')}</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleEdit(v)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white`}>{t('common.edit')}</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>{t('common.delete')}</button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Menu>
                        </td>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </tbody>
            </table>
            {vehicles.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>{t('vehicles.noVehicles')}</p>
              </div>
            )}
          </div>

          {/* Mobile/Tablet Cards (<1300px) */}
          <div className="xl:hidden grid gap-4">
            {vehicles.map((v: Vehicle) => (
              <RadioGroup.Option key={v.vehicleId} value={v.vehicleId} className="focus:outline-none">
                {({ checked }) => (
                  <div className={`bg-slate-800 p-6 rounded-lg ${
                    checked ? 'ring-2 ring-indigo-500' : ''
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          checked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400'
                        }`}>
                          {checked && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white"><span className="font-mono">{v.year}</span> {v.make} {v.model}</h3>
                          <p className="text-slate-400 font-mono"><span className="uppercase">{v.licensePlate}</span> • {v.fuelType}</p>
                          {v.createdAt && <p className="text-slate-500 text-sm">{formatDate(v.createdAt, dateFormat)}</p>}
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                            <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => navigate(`/refills/${v.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>
                                  {t('vehicles.viewRefills')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => handleEdit(v)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white`}>
                                  {t('common.edit')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>
                                  {t('common.delete')}
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </div>
                    </div>
                  </div>
                )}
              </RadioGroup.Option>
            ))}
            {vehicles.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>{t('vehicles.noVehicles')}</p>
              </div>
            )}
          </div>
        </RadioGroup>
      )}

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">{t('vehicles.delete')}</Dialog.Title>
            <p className="text-slate-300 mb-6">{t('vehicles.deleteConfirm')}</p>
            <div className="flex gap-2">
              <button onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMutation.isPending} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">{deleteMutation.isPending ? t('common.deleting') : t('common.delete')}</button>
              <button onClick={() => setShowDeleteDialog(false)} disabled={deleteMutation.isPending} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50">{t('common.cancel')}</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
