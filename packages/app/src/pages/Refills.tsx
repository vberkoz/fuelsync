import { useState, useEffect, useMemo } from 'react';
import { Dialog, Menu, Listbox } from '@headlessui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';

interface Refill {
  refillId: string;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  fuelType: string;
  station?: string;
  createdAt: string;
}

export default function Refills() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const activeVehicleId = vehicleId || currentVehicleId;

  useEffect(() => {
    if (vehicleId) {
      setCurrentVehicle(vehicleId);
    } else if (!currentVehicleId) {
      navigate('/vehicles');
    }
  }, [vehicleId, currentVehicleId, navigate, setCurrentVehicle]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['refills', activeVehicleId],
    queryFn: () => api.refills.list(activeVehicleId!),
    enabled: !!activeVehicleId
  });

  const refills = data?.refills || [];

  const groupedRefills = useMemo(() => {
    const groups: Record<string, Refill[]> = {};
    refills.forEach((refill: Refill) => {
      const date = new Date(refill.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(refill);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [refills]);

  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    odometer: '', 
    volume: '', 
    pricePerUnit: '', 
    totalCost: '', 
    currency: 'USD', 
    fuelType: 'Regular',
    station: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.refills.create(activeVehicleId!, data),
    onMutate: async (newRefill) => {
      await queryClient.cancelQueries({ queryKey: ['refills', activeVehicleId] });
      const previousRefills = queryClient.getQueryData(['refills', activeVehicleId]);
      queryClient.setQueryData(['refills', activeVehicleId], (old: any) => ({
        refills: [...(old?.refills || []), { ...newRefill, refillId: 'temp-' + Date.now(), createdAt: new Date().toISOString() }]
      }));
      return { previousRefills };
    },
    onError: (_err, _newRefill, context) => {
      queryClient.setQueryData(['refills', activeVehicleId], context?.previousRefills);
    },
    onSuccess: () => {
      setShowForm(false);
      setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: 'Regular', station: '' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['refills', activeVehicleId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ refillId, data }: { refillId: string; data: any }) => 
      api.refills.update(activeVehicleId!, refillId, data),
    onMutate: async ({ refillId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['refills', activeVehicleId] });
      const previousRefills = queryClient.getQueryData(['refills', activeVehicleId]);
      queryClient.setQueryData(['refills', activeVehicleId], (old: any) => ({
        refills: old?.refills.map((r: Refill) => r.refillId === refillId ? { ...r, ...data } : r) || []
      }));
      return { previousRefills };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['refills', activeVehicleId], context?.previousRefills);
    },
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: 'Regular', station: '' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['refills', activeVehicleId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (refillId: string) => api.refills.delete(activeVehicleId!, refillId),
    onMutate: async (refillId) => {
      await queryClient.cancelQueries({ queryKey: ['refills', activeVehicleId] });
      const previousRefills = queryClient.getQueryData(['refills', activeVehicleId]);
      queryClient.setQueryData(['refills', activeVehicleId], (old: any) => ({
        refills: old?.refills.filter((r: Refill) => r.refillId !== refillId) || []
      }));
      return { previousRefills };
    },
    onError: (_err, _refillId, context) => {
      queryClient.setQueryData(['refills', activeVehicleId], context?.previousRefills);
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setDeleteId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['refills', activeVehicleId] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refillData = { 
      odometer: parseFloat(formData.odometer),
      volume: parseFloat(formData.volume),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      totalCost: parseFloat(formData.totalCost),
      currency: formData.currency,
      fuelType: formData.fuelType,
      station: formData.station
    };
    
    if (editingId) {
      updateMutation.mutate({ refillId: editingId, data: refillData });
    } else {
      createMutation.mutate(refillData);
    }
  };

  const handleEdit = (refill: Refill) => {
    setFormData({ 
      odometer: refill.odometer.toString(),
      volume: refill.volume.toString(),
      pricePerUnit: refill.pricePerUnit.toString(),
      totalCost: refill.totalCost.toString(),
      currency: refill.currency,
      fuelType: refill.fuelType,
      station: refill.station || ''
    });
    setEditingId(refill.refillId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Refills</h1>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingId(null); 
            setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: 'Regular', station: '' }); 
          }} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          {showForm ? 'Cancel' : '+ Add Refill'}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading refills...</p>
        </div>
      )}

      {!isLoading && showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">
                {editingId ? 'Edit Refill' : 'Add Refill'}
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Odometer" 
                    value={formData.odometer} 
                    onChange={(e) => setFormData({...formData, odometer: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Volume (L)" 
                    value={formData.volume} 
                    onChange={(e) => setFormData({...formData, volume: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Price/Unit" 
                    value={formData.pricePerUnit} 
                    onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Total Cost" 
                    value={formData.totalCost} 
                    onChange={(e) => setFormData({...formData, totalCost: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                </div>
                <Listbox value={formData.fuelType} onChange={(value) => setFormData({...formData, fuelType: value})}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center">
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
                <input 
                  type="text" 
                  placeholder="Station (optional)" 
                  value={formData.station} 
                  onChange={(e) => setFormData({...formData, station: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                />
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Add'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingId(null); }} 
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      {!isLoading && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            {groupedRefills.map(([month, monthRefills]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-slate-400 font-semibold">Odometer (km)</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Volume (L)</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Price/Unit</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Total</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Fuel Type</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Station</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Date</th>
                      <th className="text-left p-4 text-slate-400 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthRefills.map(r => (
                      <tr key={r.refillId} className="border-b border-slate-800 hover:bg-slate-800">
                        <td className="p-4 text-white">{r.odometer}</td>
                        <td className="p-4 text-white">{r.volume}</td>
                        <td className="p-4 text-white">{r.pricePerUnit} {r.currency}</td>
                        <td className="p-4 text-white">{r.totalCost} {r.currency}</td>
                        <td className="p-4 text-white">{r.fuelType}</td>
                        <td className="p-4 text-white">{r.station}</td>
                        <td className="p-4 text-white">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-white">
                          <Menu as="div" className="relative">
                            <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                              <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleEdit(r)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>Edit</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => { setDeleteId(r.refillId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>Delete</button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Menu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {refills.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>No refills yet. Add your first refill to get started!</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {groupedRefills.map(([month, monthRefills]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h2>
                <div className="grid gap-4">
                  {monthRefills.map((r: Refill) => (
                    <div key={r.refillId} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">{r.volume}L @ {r.pricePerUnit} {r.currency}/L</h3>
                        <p className="text-slate-400">Odometer: {r.odometer} km • Total: {r.totalCost} {r.currency}</p>
                        <p className="text-slate-500 text-sm">{r.fuelType} {r.station ? `• ${r.station}` : ''}</p>
                        {r.createdAt && <p className="text-slate-500 text-sm">{new Date(r.createdAt).toLocaleString()}</p>}
                      </div>
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                          <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => handleEdit(r)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>Edit</button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => { setDeleteId(r.refillId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>Delete</button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {refills.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>No refills yet. Add your first refill to get started!</p>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Delete Refill</Dialog.Title>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this refill? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => deleteId && handleDelete(deleteId)} 
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteDialog(false)} 
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
