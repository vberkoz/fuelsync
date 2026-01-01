import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, Menu, Listbox, Field, Label } from '@headlessui/react';
import { useParams } from 'react-router-dom';
import { EllipsisVerticalIcon, ChevronUpDownIcon, CheckIcon, BanknotesIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';

interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  currency: string;
  odometer?: number;
  description?: string;
  timestamp?: number;
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  'Other',
  'Accessories',
  'Parts',
  'Loan',
  'License',
  'Parking',
  'Registration',
  'Service',
  'Insurance',
  'Fines',
  'Wash',
  'Tax',
  'Maintenance',
  'Repair',
  'Tolls'
];

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const queryClient = useQueryClient();
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const activeVehicleId = vehicleId || currentVehicleId;

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
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
    queryKey: ['expenses', activeVehicleId],
    queryFn: ({ pageParam }) => api.expenses.list(activeVehicleId!, pageParam),
    enabled: !!activeVehicleId,
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: undefined as string | undefined
  });

  const expenses = useMemo(() => 
    data?.pages.flatMap(page => page.expenses) || [],
    [data]
  );

  const [visibleMonths, setVisibleMonths] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    expenses.forEach((expense: Expense) => {
      const date = new Date(expense.timestamp || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(expense);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  const visibleGroupedExpenses = useMemo(() => 
    groupedExpenses.slice(0, visibleMonths),
    [groupedExpenses, visibleMonths]
  );

  const hasMoreMonths = visibleMonths < groupedExpenses.length;

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
    category: 'Other',
    amount: '',
    currency: 'UAH',
    odometer: '',
    description: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.expenses.create(activeVehicleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
      setShowForm(false);
      setFormData({ category: 'Other', amount: '', currency: 'UAH', odometer: '', description: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: any }) => 
      api.expenses.update(activeVehicleId!, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
      setShowForm(false);
      setEditingId(null);
      setFormData({ category: 'Other', amount: '', currency: 'UAH', odometer: '', description: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => api.expenses.delete(activeVehicleId!, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
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
    const expenseData = { 
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      odometer: formData.odometer ? parseFloat(formData.odometer) : undefined,
      description: formData.description
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
      description: expense.description || ''
    });
    setEditingId(expense.expenseId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
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
          <BanknotesIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('expenses.title')}</h1>
        </div>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingId(null); 
            setFormData({ category: 'Other', amount: '', currency: 'UAH', odometer: '', description: '' }); 
          }} 
          className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          {showForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              <span>{t('common.cancel')}</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              <span>{t('expenses.add')}</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('expenses.loading')}</p>
        </div>
      )}

      {!isLoading && showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">
                {editingId ? t('expenses.edit') : t('expenses.add')}
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('expenses.category')}</Label>
                  <Listbox value={formData.category} onChange={(value) => setFormData({...formData, category: value})}>
                    <div className="relative">
                      <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <span>{formData.category}</span>
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <Listbox.Option key={cat} value={cat} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
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
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('expenses.amount')}</Label>
                  <input type="text" inputMode="decimal" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value.replace(',', '.')})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.odometer')} (km) <span className="text-xs font-normal text-slate-400">({t('vehicles.optional')})</span></Label>
                  <input type="text" inputMode="decimal" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value.replace(',', '.')})} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </Field>
                <Field>
                  <Label className="block text-sm font-semibold text-white mb-1.5">{t('expenses.description')} <span className="text-xs font-normal text-slate-400">({t('vehicles.optional')})</span></Label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </Field>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending} 
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? t('common.saving') : editingId ? t('common.save') : t('common.add')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingId(null); }} 
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    {t('common.cancel')}
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
            {visibleGroupedExpenses.map(([month, monthExpenses]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                  {new Date(month + '-01').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }).replace(' р.', '')}
                </h2>
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-slate-400 font-semibold w-32">{t('expenses.category')}</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('expenses.amount')}<br/>(UAH)</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.odometer')}<br/>(km)</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">{t('expenses.description')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-48">{t('refills.date')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthExpenses.map(e => (
                      <tr key={e.expenseId} className="border-b border-slate-800 hover:bg-slate-800">
                        <td className="p-4 text-white">{e.category}</td>
                        <td className="p-4 text-white font-mono text-right">{Number(e.amount).toFixed(2)}</td>
                        <td className="p-4 text-white font-mono text-right">{e.odometer}</td>
                        <td className="p-4 text-white">{e.description}</td>
                        <td className="p-4 text-white font-mono">{new Date(e.timestamp || e.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-white">
                          <Menu as="div" className="relative">
                            <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                              <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleEdit(e)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>{t('common.edit')}</button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => { setDeleteId(e.expenseId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>{t('common.delete')}</button>
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
                <p>{t('expenses.noExpenses')}</p>
              </div>
            )}
            {(hasMoreMonths || hasNextPage) && <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>}
            </div>}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {visibleGroupedExpenses.map(([month, monthExpenses]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                  {new Date(month + '-01').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }).replace(' р.', '')}
                </h2>
                <div className="grid gap-4">
                  {monthExpenses.map((e: Expense) => (
                    <div key={e.expenseId} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">{e.category} - <span className="font-mono">{Number(e.amount).toFixed(2)} {e.currency}</span></h3>
                        <p className="text-slate-400">
                          {e.odometer && <span className="font-mono">Odometer: {e.odometer} km</span>}
                        </p>
                        {e.description && <p className="text-slate-500 text-sm">{e.description}</p>}
                        {(e.timestamp || e.createdAt) && <p className="text-slate-500 text-sm font-mono">{new Date(e.timestamp || e.createdAt).toLocaleString()}</p>}
                      </div>
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                          <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => handleEdit(e)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}>{t('common.edit')}</button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => { setDeleteId(e.expenseId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}>{t('common.delete')}</button>
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
                <p>{t('expenses.noExpenses')}</p>
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
            <Dialog.Title className="text-xl font-bold text-white mb-4">{t('expenses.delete')}</Dialog.Title>
            <p className="text-slate-300 mb-6">{t('expenses.deleteConfirm')}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => deleteId && handleDelete(deleteId)} 
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
              </button>
              <button 
                onClick={() => setShowDeleteDialog(false)} 
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50"
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
