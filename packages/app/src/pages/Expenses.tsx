import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, Menu } from '@headlessui/react';
import { Receipt, Plus, X, MoreVertical, Download, Upload } from 'lucide-react';
import { useParams } from 'react-router-dom';
import React from 'react';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';
import { useReminderStore } from '../stores/reminderStore';

import { exportToCSV, parseCSV } from '../lib/csv';
import ReminderDialog from '../components/ReminderDialog';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';

interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number;
  odometer?: number;
  description?: string;
  timestamp?: number;
  createdAt: string;
  odometerImageKey?: string;
  receiptImageKey?: string;
  media?: Array<{ key: string; type: string; label: string }>;
}

export default function Expenses() {
  const { t } = useTranslation();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const queryClient = useQueryClient();
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const activeVehicleId = vehicleId || currentVehicleId;
  const { setReminders, getOverdueReminders } = useReminderStore();
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
  const [currentOdometerForReminder, setCurrentOdometerForReminder] = useState(0);

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list
  });

  useQuery({
    queryKey: ['reminders'],
    queryFn: api.reminders.list
  });

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await api.reminders.list();
        if (data?.reminders) {
          setReminders(data.reminders);
        }
      } catch (error) {
        // Handle error silently
      }
    };
    loadReminders();
  }, [setReminders]);

  const preferredCurrency = settingsData?.settings?.preferredCurrency || 'USD';
  const units = settingsData?.settings?.units || 'metric';
  const dateFormat = settingsData?.settings?.dateFormat || 'MM/DD/YYYY';
  const categories = categoriesData?.categories || [];

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
    queryKey: ['expenses', activeVehicleId || 'none'],
    queryFn: async ({ pageParam }) => {
      if (!activeVehicleId) return { expenses: [], nextToken: undefined };
      const result = await api.expenses.list(activeVehicleId, pageParam);
      return result || { expenses: [], nextToken: undefined };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextToken ?? undefined
  });

  const expenses = useMemo(() => 
    data?.pages?.flatMap(page => page.expenses) || [],
    [data]
  );

  const [visibleMonths, setVisibleMonths] = useState(12);

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

  const handleScroll = () => {
    if (hasMoreMonths) {
      setVisibleMonths(prev => prev + 6);
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ 
    category: 'Other',
    amount: '',
    currency: 'USD',
    odometer: '',
    description: '',
    odometerImageKey: undefined as string | undefined,
    media: [] as Array<{ key: string; type: string; label: string }>
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.expenses.create(activeVehicleId!, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
      setShowForm(false);
      const latestOdometer = expenses[0]?.odometer?.toString() || '';
      setFormData({ category: 'Other', amount: '', currency: 'USD', odometer: latestOdometer, description: '', odometerImageKey: undefined, media: [] });
      
      // Check for overdue reminders after adding expense
      if (activeVehicleId && variables.odometer) {
        const overdue = getOverdueReminders(activeVehicleId, variables.odometer);
        if (overdue.length > 0) {
          setOverdueReminders(overdue);
          setCurrentOdometerForReminder(variables.odometer);
          setShowReminderDialog(true);
        }
      }
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: api.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: any }) => 
      api.expenses.update(activeVehicleId!, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeVehicleId] });
      setShowForm(false);
      setEditingId(null);
      const latestOdometer = expenses[0]?.odometer?.toString() || '';
      setFormData({ category: 'Other', amount: '', currency: 'USD', odometer: latestOdometer, description: '', odometerImageKey: undefined, media: [] });
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
    
    console.log('SUBMIT - editingId:', editingId);
    console.log('SUBMIT - formData:', formData);
    
    if (!categories.includes(formData.category)) {
      await createCategoryMutation.mutateAsync(formData.category);
    }
    
    const expenseData: any = { 
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      odometer: parseFloat(formData.odometer),
      description: formData.description
    };
    
    if (formData.odometerImageKey) {
      expenseData.odometerImageKey = formData.odometerImageKey;
    }
    
    if (formData.media && formData.media.length > 0) {
      expenseData.media = formData.media;
    }
    
    console.log('Submitting expense:', expenseData);
    
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
      odometerImageKey: undefined,
      media: expense.media || []
    });
    setEditingId(expense.expenseId);
    setShowForm(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExport = async () => {
    const allExpenses = [];
    let nextToken: string | undefined = undefined;
    
    do {
      const result = await api.expenses.list(activeVehicleId!, nextToken);
      allExpenses.push(...(result?.expenses || []));
      nextToken = result?.nextToken;
    } while (nextToken);
    
    const csvData = allExpenses.map((e: Expense) => ({
      date: new Date(e.timestamp || e.createdAt).toISOString(),
      vehicleYear: currentVehicle?.vehicle?.year || '',
      vehicleMake: currentVehicle?.vehicle?.make || '',
      vehicleModel: currentVehicle?.vehicle?.model || '',
      category: e.category,
      amount: e.amount,
      currency: e.currency,
      odometer: e.odometer || '',
      description: e.description || ''
    }));
    exportToCSV(csvData, 'expenses.csv');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = parseCSV(text);
    
    const allExpenses = [];
    let nextToken: string | undefined = undefined;
    do {
      const result = await api.expenses.list(activeVehicleId!, nextToken);
      allExpenses.push(...(result?.expenses || []));
      nextToken = result?.nextToken;
    } while (nextToken);
    
    const existingDates = new Set(allExpenses.map((e: Expense) => 
      new Date(e.timestamp || e.createdAt).toISOString().split('T')[0]
    ));
    
    for (const row of data) {
      const importDate = new Date(row.date).toISOString().split('T')[0];
      if (existingDates.has(importDate)) continue;
      
      await createMutation.mutateAsync({
        category: row.category,
        amount: parseFloat(row.amount),
        currency: row.currency,
        odometer: row.odometer ? parseFloat(row.odometer) : undefined,
        description: row.description,
        timestamp: new Date(row.date).getTime()
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <Receipt className="h-8 w-8 text-indigo-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('expenses.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-center px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg h-[38px] sm:h-[42px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <MoreVertical className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleExport} disabled={expenses.length === 0 || createMutation.isPending} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Download className="h-4 w-4" />
                    {createMutation.isPending ? 'Exporting...' : 'Export CSV'}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => fileInputRef.current?.click()} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button 
            onClick={() => { 
              setShowForm(!showForm); 
              setEditingId(null);
              const latestOdometer = expenses[0]?.odometer?.toString() || '';
              setFormData({ category: 'Other', amount: '', currency: 'USD', odometer: latestOdometer, description: '', odometerImageKey: undefined, media: [] }); 
            }} 
            className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {showForm ? (
              <>
                <X className="h-5 w-5" />
                <span className="hidden min-[440px]:inline">{t('common.cancel')}</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="hidden min-[440px]:inline">{t('expenses.add')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('expenses.loading')}</p>
        </div>
      )}

      {!isLoading && showForm && !editingId && (
        <ExpenseForm
          formData={formData}
          categories={categories}
          isSubmitting={createMutation.isPending}
          isEditing={false}
          lastOdometer={expenses[0]?.odometer || currentVehicle?.vehicle?.odometer || 0}
          onSubmit={handleSubmit}
          onChange={setFormData}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      <ReminderDialog 
        isOpen={showReminderDialog}
        onClose={() => setShowReminderDialog(false)}
        reminders={overdueReminders}
        currentOdometer={currentOdometerForReminder}
      />

      {!isLoading && expenses.length > 0 && (
        <ExpenseList
          groupedExpenses={visibleGroupedExpenses}
          editingId={editingId}
          formData={formData}
          categories={categories}
          preferredCurrency={preferredCurrency}
          units={units}
          dateFormat={dateFormat}
          isSubmitting={updateMutation.isPending}
          isFetchingNextPage={isFetchingNextPage}
          hasMoreMonths={hasMoreMonths}
          hasNextPage={!!hasNextPage}
          lastOdometer={expenses[0]?.odometer || currentVehicle?.vehicle?.odometer || 0}
          vehicleId={activeVehicleId || ''}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onSubmit={handleSubmit}
          onFormChange={setFormData}
          onCancelEdit={() => { setEditingId(null); setShowForm(false); }}
          onScroll={handleScroll}
        />
      )}

      {!isLoading && expenses.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-400">
          <p>{t('expenses.noExpenses')}</p>
        </div>
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
