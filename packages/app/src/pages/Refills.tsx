import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, Menu, Listbox, Field, Label } from '@headlessui/react';
import { useParams } from 'react-router-dom';
import { EllipsisVerticalIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
  comment?: string;
  timestamp?: number;
  createdAt: string;
}

export default function Refills() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const queryClient = useQueryClient();
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const activeVehicleId = vehicleId || currentVehicleId;

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const { data: currentVehicle } = useQuery({
    queryKey: ['vehicle', activeVehicleId],
    queryFn: () => api.vehicles.get(activeVehicleId!),
    enabled: !!activeVehicleId
  });

  useEffect(() => {
    if (vehicleId) {
      setCurrentVehicle(vehicleId);
    } else if (!currentVehicleId && vehiclesData?.vehicles?.length > 0) {
      setCurrentVehicle(vehiclesData.vehicles[0].vehicleId);
    }
  }, [vehicleId, currentVehicleId, vehiclesData, setCurrentVehicle]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['refills', activeVehicleId],
    queryFn: ({ pageParam }) => api.refills.list(activeVehicleId!, pageParam),
    enabled: !!activeVehicleId,
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: undefined as string | undefined
  });

  const refills = useMemo(() => 
    data?.pages.flatMap(page => page.refills) || [],
    [data]
  );

  const [visibleMonths, setVisibleMonths] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);

  const groupedRefills = useMemo(() => {
    const groups: Record<string, Refill[]> = {};
    refills.forEach((refill: Refill) => {
      const date = new Date(refill.timestamp || refill.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(refill);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [refills]);

  const visibleGroupedRefills = useMemo(() => 
    groupedRefills.slice(0, visibleMonths),
    [groupedRefills, visibleMonths]
  );

  const hasMoreMonths = visibleMonths < groupedRefills.length;

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8) {
        if (hasMoreMonths) {
          setVisibleMonths(prev => prev + 6);
        } else if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMonths, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    odometer: '', 
    volume: '', 
    pricePerUnit: '', 
    totalCost: '', 
    currency: 'UAH', 
    fuelType: 'Regular',
    station: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.refills.create(activeVehicleId!, data),
    onMutate: async (newRefill) => {
      await queryClient.cancelQueries({ queryKey: ['refills', activeVehicleId] });
      const previousRefills = queryClient.getQueryData(['refills', activeVehicleId]);
      queryClient.setQueryData(['refills', activeVehicleId], (old: any) => {
        const firstPage = old?.pages?.[0] || { refills: [], nextToken: undefined };
        return {
          pages: [{ refills: [...firstPage.refills, { ...newRefill, refillId: 'temp-' + Date.now(), createdAt: new Date().toISOString() }], nextToken: firstPage.nextToken }, ...(old?.pages?.slice(1) || [])],
          pageParams: old?.pageParams || [undefined]
        };
      });
      return { previousRefills };
    },
    onError: (_err, _newRefill, context) => {
      queryClient.setQueryData(['refills', activeVehicleId], context?.previousRefills);
    },
    onSuccess: () => {
      setShowForm(false);
      setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'UAH', fuelType: currentVehicle?.vehicle?.fuelType || 'Regular', station: '' });
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
        pages: old?.pages?.map((page: any) => ({
          ...page,
          refills: page.refills.map((r: Refill) => r.refillId === refillId ? { ...r, ...data } : r)
        })) || [],
        pageParams: old?.pageParams || []
      }));
      return { previousRefills };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['refills', activeVehicleId], context?.previousRefills);
    },
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'UAH', fuelType: currentVehicle?.vehicle?.fuelType || 'Regular', station: '' });
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
        pages: old?.pages?.map((page: any) => ({
          ...page,
          refills: page.refills.filter((r: Refill) => r.refillId !== refillId)
        })) || [],
        pageParams: old?.pageParams || []
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
            setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'UAH', fuelType: currentVehicle?.vehicle?.fuelType || 'Regular', station: '' }); 
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label className="block text-sm font-semibold text-white mb-1.5">Odometer (km)</Label>
                    <input type="number" step="0.01" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                  <Field>
                    <Label className="block text-sm font-semibold text-white mb-1.5">Volume (L)</Label>
                    <input type="text" inputMode="decimal" value={formData.volume} onChange={(e) => setFormData({...formData, volume: e.target.value.replace(',', '.')})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                  <Field>
                    <Label className="block text-sm font-semibold text-white mb-1.5">Price/Unit</Label>
                    <input type="text" inputMode="decimal" value={formData.pricePerUnit} onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value.replace(',', '.')})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                  <Field>
                    <Label className="block text-sm font-semibold text-white mb-1.5">Total Cost</Label>
                    <input type="text" inputMode="decimal" value={formData.totalCost} onChange={(e) => setFormData({...formData, totalCost: e.target.value.replace(',', '.')})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </Field>
                </div>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">Fuel Type</Label>
                  <Listbox value={formData.fuelType} onChange={(value) => setFormData({...formData, fuelType: value})}>
                    <div className="relative">
                      <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <span>{formData.fuelType}</span>
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {['Regular', 'Premium', 'Diesel'].map((fuel) => (
                          <Listbox.Option key={fuel} value={fuel} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
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
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">Station <span className="text-xs font-normal text-slate-400">(Optional)</span></Label>
                  <textarea rows={3} value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </Field>
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
            {visibleGroupedRefills.map(([month, monthRefills]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h2>
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">Odometer<br/>(km)</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-24">Volume<br/>(L)</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">Price/Unit<br/>(UAH)</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">Total<br/>(UAH)</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-24">Fuel Type</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Station</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-48">Date</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthRefills.map(r => (
                      <tr key={r.refillId} className="border-b border-slate-800 hover:bg-slate-800">
                        <td className="p-4 text-white font-mono text-right">{r.odometer}</td>
                        <td className="p-4 text-white font-mono text-right">{Number(r.volume).toFixed(2)}</td>
                        <td className="p-4 text-white font-mono text-right">{Number(r.pricePerUnit).toFixed(2)}</td>
                        <td className="p-4 text-white font-mono text-right">{Number(r.totalCost).toFixed(2)}</td>
                        <td className="p-4 text-white">{r.fuelType}</td>
                        <td className="p-4 text-white">{r.station || r.comment}</td>
                        <td className="p-4 text-white font-mono">{new Date(r.timestamp || r.createdAt).toLocaleString()}</td>
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
            {(hasMoreMonths || hasNextPage) && <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>}
            </div>}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {visibleGroupedRefills.map(([month, monthRefills]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h2>
                <div className="grid gap-4">
                  {monthRefills.map((r: Refill) => (
                    <div key={r.refillId} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white"><span className="font-mono">{Number(r.volume).toFixed(2)}L</span> @ <span className="font-mono">{Number(r.pricePerUnit).toFixed(2)} {r.currency}/L</span></h3>
                        <p className="text-slate-400">Odometer: <span className="font-mono">{r.odometer} km</span> • Total: <span className="font-mono">{Number(r.totalCost).toFixed(2)} {r.currency}</span></p>
                        <p className="text-slate-500 text-sm">{r.fuelType} {(r.station || r.comment) ? `• ${r.station || r.comment}` : ''}</p>
                        {(r.timestamp || r.createdAt) && <p className="text-slate-500 text-sm font-mono">{new Date(r.timestamp || r.createdAt).toLocaleString()}</p>}
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
            {(hasMoreMonths || hasNextPage) && <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>}
            </div>}
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
