import { useState, useMemo } from 'react';
import { Dialog, Menu, Listbox } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, createColumnHelper, flexRender } from '@tanstack/react-table';
import { api } from '../lib/api';
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

  const vehicles = data?.vehicles || [];

  const columnHelper = createColumnHelper<Vehicle>();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      cell: ({ row }) => {
        const checked = currentVehicleId === row.original.vehicleId;
        return (
          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
            checked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400'
          }`} onClick={() => setCurrentVehicle(row.original.vehicleId)}>
            {checked && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
        );
      }
    }),
    columnHelper.accessor('year', { header: 'Year' }),
    columnHelper.accessor('make', { header: 'Make' }),
    columnHelper.accessor('model', { header: 'Model' }),
    columnHelper.accessor('licensePlate', { header: 'License Plate' }),
    columnHelper.accessor('fuelType', { header: 'Fuel Type' }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => info.getValue() ? new Date(info.getValue()!).toLocaleString() : ''
    }),
    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => (
        <Menu as="div" className="relative">
          <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
            <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => navigate(`/refills/${row.original.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>
                  View Refills
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => handleEdit(row.original)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white`}>
                  Edit
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button onClick={() => { setDeleteId(row.original.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>
                  Delete
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      )
    })
  ], [currentVehicleId, navigate]);

  const table = useReactTable({
    data: vehicles,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const createMutation = useMutation({
    mutationFn: api.vehicles.create,
    onMutate: async (newVehicle) => {
      await queryClient.cancelQueries({ queryKey: ['vehicles'] });
      const previousVehicles = queryClient.getQueryData(['vehicles']);
      queryClient.setQueryData(['vehicles'], (old: any) => ({
        vehicles: [...(old?.vehicles || []), { ...newVehicle, vehicleId: 'temp-' + Date.now() }]
      }));
      return { previousVehicles };
    },
    onError: (_err, _newVehicle, context) => {
      queryClient.setQueryData(['vehicles'], context?.previousVehicles);
    },
    onSuccess: () => {
      setShowForm(false);
      setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.vehicles.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['vehicles'] });
      const previousVehicles = queryClient.getQueryData(['vehicles']);
      queryClient.setQueryData(['vehicles'], (old: any) => ({
        vehicles: old?.vehicles.map((v: Vehicle) => v.vehicleId === id ? { ...v, ...data } : v) || []
      }));
      return { previousVehicles };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['vehicles'], context?.previousVehicles);
    },
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.vehicles.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['vehicles'] });
      const previousVehicles = queryClient.getQueryData(['vehicles']);
      queryClient.setQueryData(['vehicles'], (old: any) => ({
        vehicles: old?.vehicles.filter((v: Vehicle) => v.vehicleId !== id) || []
      }));
      return { previousVehicles };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['vehicles'], context?.previousVehicles);
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setDeleteId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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
      make: vehicle.make, 
      model: vehicle.model, 
      year: vehicle.year.toString(), 
      licensePlate: vehicle.licensePlate || '',
      fuelType: vehicle.fuelType || 'Regular'
    });
    setEditingId(vehicle.vehicleId);
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
        <h1 className="text-3xl font-bold text-white">Vehicles</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' }); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
          {showForm ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading vehicles...</p>
        </div>
      )}

      {!isLoading && showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Make" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} required className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  <input type="text" placeholder="Model" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  <input type="number" placeholder="Year" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  <input type="text" placeholder="License Plate" value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value})} className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
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
                <div className="flex gap-2">
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Cancel</button>
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
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-slate-700">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="text-left p-4 text-slate-400 font-semibold">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 text-white">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {vehicles.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>No vehicles yet. Add your first vehicle to get started!</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-4">
            {vehicles.map((v: Vehicle) => (
              <div key={v.vehicleId} className={`bg-slate-800 p-6 rounded-lg ${
                currentVehicleId === v.vehicleId ? 'ring-2 ring-indigo-500' : ''
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                      currentVehicleId === v.vehicleId ? 'border-indigo-500 bg-indigo-500' : 'border-slate-400'
                    }`} onClick={() => setCurrentVehicle(v.vehicleId)}>
                      {currentVehicleId === v.vehicleId && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{v.year} {v.make} {v.model}</h3>
                      <p className="text-slate-400">{v.licensePlate} • {v.fuelType}</p>
                      {v.createdAt && <p className="text-slate-500 text-sm">{new Date(v.createdAt).toLocaleString()}</p>}
                    </div>
                  </div>
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                      <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={() => navigate(`/refills/${v.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>
                            View Refills
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={() => handleEdit(v)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white`}>
                            Edit
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>
                            Delete
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>No vehicles yet. Add your first vehicle to get started!</p>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Delete Vehicle</Dialog.Title>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this vehicle? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
              <button onClick={() => setShowDeleteDialog(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Cancel</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
