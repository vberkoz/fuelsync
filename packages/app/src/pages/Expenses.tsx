import { useState, useEffect, useMemo } from 'react';
import { Dialog, Menu, Listbox } from '@headlessui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';

interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  currency: string;
  odometer?: number;
  description?: string;
  taxDeductible: boolean;
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  'Maintenance',
  'Repair',
  'Insurance',
  'Registration',
  'Parking',
  'Tolls',
  'Wash',
  'Other'
];

export default function Expenses() {
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
    queryKey: ['expenses', activeVehicleId],
    queryFn: () => api.expenses.list(activeVehicleId!),
    enabled: !!activeVehicleId
  });

  const expenses = data?.expenses || [];

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    expenses.forEach((expense: Expense) => {
      const date = new Date(expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(expense);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    category: 'Maintenance',
    amount: '',
    currency: 'USD',
    odometer: '',
    description: '',
    taxDeductible: false
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.expenses.create(activeVehicleId!, data),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', activeVehicleId] });
      const previousExpenses = queryClient.getQueryData(['expenses', activeVehicleId]);
      queryClient.setQueryData(['expenses', activeVehicleId], (old: any) => ({
        expenses: [...(old?.expenses || []), { ...newExpense, expenseId: 'temp-' + Date.now(), createdAt: new Date().toISOString() }]
      }));
      return { previousExpenses };
    },
    onError: (_err, _newExpense, context) => {
      queryClient.setQueryData(['expenses', activeVehicleId], context?.previousExpenses);
    },
    onSuccess: () => {
      setShowForm(false);
      setFormData({ category: 'Maintenance', amount: '', currency: 'USD', odometer: '', description: '', taxDeductible: false });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: any }) => 
      api.expenses.update(activeVehicleId!, expenseId, data),
    onMutate: async ({ expenseId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', activeVehicleId] });
      const previousExpenses = queryClient.getQueryData(['expenses', activeVehicleId]);
      queryClient.setQueryData(['expenses', activeVehicleId], (old: any) => ({
        expenses: old?.expenses.map((e: Expense) => e.expenseId === expenseId ? { ...e, ...data } : e) || []
      }));
      return { previousExpenses };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['expenses', activeVehicleId], context?.previousExpenses);
    },
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ category: 'Maintenance', amount: '', currency: 'USD', odometer: '', description: '', taxDeductible: false });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => api.expenses.delete(activeVehicleId!, expenseId),
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: ['expenses', activeVehicleId] });
      const previousExpenses = queryClient.getQueryData(['expenses', activeVehicleId]);
      queryClient.setQueryData(['expenses', activeVehicleId], (old: any) => ({
        expenses: old?.expenses.filter((e: Expense) => e.expenseId !== expenseId) || []
      }));
      return { previousExpenses };
    },
    onError: (_err, _expenseId, context) => {
      queryClient.setQueryData(['expenses', activeVehicleId], context?.previousExpenses);
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setDeleteId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expenseData = { 
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      odometer: formData.odometer ? parseFloat(formData.odometer) : undefined,
      description: formData.description,
      taxDeductible: formData.taxDeductible
    };
    
    if (editingId) {
      updateMutation.mutate({ expenseId: editingId, data: expenseData });
    } else {
      createMutation.mutate(expenseData);
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({ 
      category: expense.category,
      amount: expense.amount.toString(),
      currency: expense.currency,
      odometer: expense.odometer?.toString() || '',
      description: expense.description || '',
      taxDeductible: expense.taxDeductible
    });
    setEditingId(expense.expenseId);
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
        <h1 className="text-3xl font-bold text-white">Expenses</h1>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingId(null); 
            setFormData({ category: 'Maintenance', amount: '', currency: 'USD', odometer: '', description: '', taxDeductible: false }); 
          }} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading expenses...</p>
        </div>
      )}

      {!isLoading && showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">
                {editingId ? 'Edit Expense' : 'Add Expense'}
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Listbox value={formData.category} onChange={(value) => setFormData({...formData, category: value})}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center">
                      <span>{formData.category}</span>
                      <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <Listbox.Option
                          key={cat}
                          value={cat}
                          className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                        >
                          {({ selected }) => (
                            <div className="flex justify-between items-center">
                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{cat}</span>
                              {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Amount" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Odometer (optional)" 
                    value={formData.odometer} 
                    onChange={(e) => setFormData({...formData, odometer: e.target.value})} 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Description (optional)" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                />
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.taxDeductible} 
                    onChange={(e) => setFormData({...formData, taxDeductible: e.target.checked})} 
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500" 
                  />
                  <span>Tax Deductible</span>
                </label>
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
            {groupedExpenses.map(([month, monthExpenses]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-slate-400 font-semibold">Category</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Amount</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Odometer (km)</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Description</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Tax Deductible</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">Date</th>
                      <th className="text-left p-4 text-slate-400 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthExpenses.map(e => (
                      <tr key={e.expenseId} className="border-b border-slate-800 hover:bg-slate-800">
                        <td className="p-4 text-white">{e.category}</td>
                        <td className="p-4 text-white">{e.amount} {e.currency}</td>
                        <td className="p-4 text-white">{e.odometer}</td>
                        <td className="p-4 text-white">{e.description}</td>
                        <td className="p-4 text-white">{e.taxDeductible ? '✓' : ''}</td>
                        <td className="p-4 text-white">{new Date(e.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-white">
                          <Menu as="div" className="relative">
                            <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                              <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleEdit(e)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>Edit</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => { setDeleteId(e.expenseId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>Delete</button>
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
            {expenses.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>No expenses yet. Add your first expense to get started!</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {groupedExpenses.map(([month, monthExpenses]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h2>
                <div className="grid gap-4">
                  {monthExpenses.map((e: Expense) => (
                    <div key={e.expenseId} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">{e.category} - {e.amount} {e.currency}</h3>
                        <p className="text-slate-400">
                          {e.odometer && `Odometer: ${e.odometer} km`}
                          {e.taxDeductible && <span className="ml-2 text-green-400">• Tax Deductible</span>}
                        </p>
                        {e.description && <p className="text-slate-500 text-sm">{e.description}</p>}
                        {e.createdAt && <p className="text-slate-500 text-sm">{new Date(e.createdAt).toLocaleString()}</p>}
                      </div>
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                          <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => handleEdit(e)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>Edit</button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => { setDeleteId(e.expenseId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>Delete</button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {expenses.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>No expenses yet. Add your first expense to get started!</p>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Delete Expense</Dialog.Title>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this expense? This action cannot be undone.</p>
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
