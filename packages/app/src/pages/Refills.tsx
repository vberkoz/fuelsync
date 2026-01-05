import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, Menu, Listbox, Field, Label } from '@headlessui/react';
import { Fuel, Plus, X, MoreVertical, ChevronDown, Check, Download, Upload, Pencil, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import React from 'react';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';
import { useReminderStore } from '../stores/reminderStore';
import { CURRENCIES, formatWithBaseAmount } from '../lib/currency';
import { convertDistance, convertVolume, getDistanceUnit, getVolumeUnit } from '../lib/units';
import { formatDate } from '../lib/date';
import { exportToCSV, parseCSV } from '../lib/csv';
import ReminderDialog from '../components/ReminderDialog';

interface Refill {
  refillId: string;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number;
  fuelType: string;
  station?: string;
  comment?: string;
  timestamp?: number;
  createdAt: string;
  drivingType?: 'city' | 'highway' | 'mixed';
}

export default function Refills() {
  const { t, i18n } = useTranslation();
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

  const preferredCurrency = settingsData?.settings?.preferredCurrency || 'USD';
  const units = settingsData?.settings?.units || 'metric';
  const dateFormat = settingsData?.settings?.dateFormat || 'MM/DD/YYYY';

  const { data: currentVehicle } = useQuery({
    queryKey: ['vehicle', activeVehicleId],
    queryFn: () => api.vehicles.get(activeVehicleId!),
    enabled: !!activeVehicleId
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
    queryKey: ['refills-infinite', activeVehicleId],
    enabled: Boolean(activeVehicleId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const result = await api.refills.list(activeVehicleId!, pageParam);
      return {
        refills: result?.refills ?? [],
        nextToken: result?.nextToken ?? null,
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.nextToken ?? undefined;
    },
  });

  const refills = useMemo(() => 
    data?.pages?.flatMap(page => page.refills) || [],
    [data]
  );

  const [visibleMonths, setVisibleMonths] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!mainElement || !data?.pages?.length) return;

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
  }, [hasMoreMonths, hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages?.length]);

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
    station: '',
    drivingType: 'mixed'
  });

  const updateFormField = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    
    const vol = parseFloat(newData.volume);
    const price = parseFloat(newData.pricePerUnit);
    const total = parseFloat(newData.totalCost);
    
    if (field === 'volume' && !isNaN(vol) && !isNaN(price)) {
      newData.totalCost = (vol * price).toFixed(2);
    } else if (field === 'pricePerUnit' && !isNaN(vol) && !isNaN(price)) {
      newData.totalCost = (vol * price).toFixed(2);
    } else if (field === 'volume' && !isNaN(vol) && !isNaN(total)) {
      newData.pricePerUnit = (total / vol).toFixed(2);
    } else if (field === 'totalCost' && !isNaN(vol) && !isNaN(total)) {
      newData.pricePerUnit = (total / vol).toFixed(2);
    } else if (field === 'pricePerUnit' && !isNaN(price) && !isNaN(total)) {
      newData.volume = (total / price).toFixed(2);
    } else if (field === 'totalCost' && !isNaN(price) && !isNaN(total)) {
      newData.volume = (total / price).toFixed(2);
    }
    
    setFormData(newData);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.refills.create(activeVehicleId!, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['refills-infinite', activeVehicleId] });
      setShowForm(false);
      const latestOdometer = refills[0]?.odometer?.toString() || '';
      setFormData({ odometer: latestOdometer, volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: currentVehicle?.vehicle?.fuelType || 'Regular', station: '', drivingType: '' });
      
      // Check for overdue reminders after adding refill
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

  const updateMutation = useMutation({
    mutationFn: ({ refillId, data }: { refillId: string; data: any }) => 
      api.refills.update(activeVehicleId!, refillId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refills-infinite', activeVehicleId] });
      setShowForm(false);
      setEditingId(null);
      const latestOdometer = refills[0]?.odometer?.toString() || '';
      setFormData({ odometer: latestOdometer, volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: currentVehicle?.vehicle?.fuelType || 'Regular', station: '', drivingType: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (refillId: string) => api.refills.delete(activeVehicleId!, refillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refills-infinite', activeVehicleId] });
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
    const refillData = { 
      odometer: parseFloat(formData.odometer),
      volume: parseFloat(formData.volume),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      totalCost: parseFloat(formData.totalCost),
      currency: formData.currency,
      fuelType: formData.fuelType,
      station: formData.station,
      ...(formData.drivingType && { drivingType: formData.drivingType })
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
      station: refill.station || '',
      drivingType: refill.drivingType || 'mixed'
    });
    setEditingId(refill.refillId);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExport = async () => {
    const allRefills = [];
    let nextToken: string | undefined = undefined;
    
    do {
      const result = await api.refills.list(activeVehicleId!, nextToken);
      allRefills.push(...(result?.refills || []));
      nextToken = result?.nextToken;
    } while (nextToken);
    
    const csvData = allRefills.map((r: Refill) => ({
      date: new Date(r.timestamp || r.createdAt).toISOString(),
      vehicleYear: currentVehicle?.vehicle?.year || '',
      vehicleMake: currentVehicle?.vehicle?.make || '',
      vehicleModel: currentVehicle?.vehicle?.model || '',
      odometer: r.odometer,
      volume: r.volume,
      pricePerUnit: r.pricePerUnit,
      totalCost: r.totalCost,
      currency: r.currency,
      fuelType: r.fuelType,
      station: r.station || ''
    }));
    exportToCSV(csvData, 'refills.csv');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = parseCSV(text);
    
    const allRefills = [];
    let nextToken: string | undefined = undefined;
    do {
      const result = await api.refills.list(activeVehicleId!, nextToken);
      allRefills.push(...(result?.refills || []));
      nextToken = result?.nextToken;
    } while (nextToken);
    
    const existingDates = new Set(allRefills.map((r: Refill) => 
      new Date(r.timestamp || r.createdAt).toISOString().split('T')[0]
    ));
    
    for (const row of data) {
      const importDate = new Date(row.date).toISOString().split('T')[0];
      if (existingDates.has(importDate)) continue;
      
      await createMutation.mutateAsync({
        odometer: parseFloat(row.odometer),
        volume: parseFloat(row.volume),
        pricePerUnit: parseFloat(row.pricePerUnit),
        totalCost: parseFloat(row.totalCost),
        currency: row.currency,
        fuelType: row.fuelType,
        station: row.station,
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
          <Fuel className="h-8 w-8 text-indigo-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('refills.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-center px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg h-[38px] sm:h-[42px]">
              <MoreVertical className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleExport} disabled={refills.length === 0 || createMutation.isPending} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg disabled:opacity-50 flex items-center gap-2`}>
                    <Download className="h-4 w-4" />
                    {createMutation.isPending ? 'Exporting...' : 'Export CSV'}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => fileInputRef.current?.click()} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-b-lg flex items-center gap-2`}>
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
              const latestOdometer = refills[0]?.odometer?.toString() || '';
              setFormData({ odometer: latestOdometer, volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: currentVehicle?.vehicle?.fuelType || 'Regular', station: '', drivingType: '' }); 
            }} 
            className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            {showForm ? (
              <>
                <X className="h-5 w-5" />
                <span className="hidden min-[440px]:inline">{t('common.cancel')}</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="hidden min-[440px]:inline">{t('refills.add')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('refills.loading')}</p>
        </div>
      )}

      {!isLoading && showForm && !editingId && (
        <div className="mb-6 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">{t('refills.add')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.odometer')} (km)</Label>
                <input type="number" step="0.01" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </Field>
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.volume')} (L)</Label>
                <input type="text" inputMode="decimal" value={formData.volume} onChange={(e) => updateFormField('volume', e.target.value.replace(',', '.'))} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </Field>
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.pricePerUnit')}</Label>
                <input type="text" inputMode="decimal" value={formData.pricePerUnit} onChange={(e) => updateFormField('pricePerUnit', e.target.value.replace(',', '.'))} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </Field>
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.totalCost')}</Label>
                <input type="text" inputMode="decimal" value={formData.totalCost} onChange={(e) => updateFormField('totalCost', e.target.value.replace(',', '.'))} required className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </Field>
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">Currency</Label>
                <Listbox value={formData.currency} onChange={(value) => setFormData({...formData, currency: value})}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <span>{formData.currency}</span>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {CURRENCIES.map((curr) => (
                        <Listbox.Option key={curr.code} value={curr.code} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                          {({ selected }) => (
                            <div className="flex justify-between items-center">
                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{curr.code} - {curr.name}</span>
                              {selected && <Check className="h-5 w-5 text-indigo-500" />}
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </Field>
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.fuelType')}</Label>
                <Listbox value={formData.fuelType} onChange={(value) => setFormData({...formData, fuelType: value})}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <span>{formData.fuelType}</span>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {['Regular', 'Premium', 'Diesel'].map((fuel) => (
                        <Listbox.Option key={fuel} value={fuel} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                          {({ selected }) => (
                            <div className="flex justify-between items-center">
                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{fuel}</span>
                              {selected && <Check className="h-5 w-5 text-indigo-500" />}
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.drivingType')} <span className="text-xs font-normal text-slate-400">({t('vehicles.optional')})</span></Label>
                <Listbox value={formData.drivingType} onChange={(value) => setFormData({...formData, drivingType: value})}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <span>{formData.drivingType || t('refills.mixed')}</span>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {[{value: 'city', label: t('refills.city')}, {value: 'highway', label: t('refills.highway')}, {value: 'mixed', label: t('refills.mixed')}].map((type) => (
                        <Listbox.Option key={type.value} value={type.value} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                          {({ selected }) => (
                            <div className="flex justify-between items-center">
                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{type.label}</span>
                              {selected && <Check className="h-5 w-5 text-indigo-500" />}
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </Field>
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.station')} <span className="text-xs font-normal text-slate-400">({t('vehicles.optional')})</span></Label>
                <textarea rows={2} value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </Field>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={createMutation.isPending} 
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
              >
                {createMutation.isPending ? t('common.saving') : t('common.add')}
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
        </div>
      )}

      <ReminderDialog 
        isOpen={showReminderDialog}
        onClose={() => setShowReminderDialog(false)}
        reminders={overdueReminders}
        currentOdometer={currentOdometerForReminder}
      />

      {!isLoading && (
        <>
          {/* Desktop Table (≥1400px) */}
          <div className="hidden min-[1400px]:block">
            {visibleGroupedRefills.map(([month, monthRefills]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                  {new Date(month + '-01').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }).replace(' р.', '')}
                </h2>
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.odometer')}<br/>({getDistanceUnit(units)})</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-24">{t('refills.volume')}<br/>({getVolumeUnit(units)})</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.pricePerUnit')}<br/>({preferredCurrency})</th>
                      <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.total')}<br/>({preferredCurrency})</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-24">{t('vehicles.fuelType')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-24">{t('refills.drivingType')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold">{t('refills.station')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-48">{t('refills.date')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthRefills.map(r => (
                      <React.Fragment key={r.refillId}>
                        <tr className="border-b border-slate-800 hover:bg-slate-800">
                          <td className="p-4 text-white font-mono text-right">{Math.round(convertDistance(r.odometer, units))}</td>
                          <td className="p-4 text-white font-mono text-right">{convertVolume(r.volume, units).toFixed(2)}</td>
                          <td className="p-4 text-white font-mono text-right">{formatWithBaseAmount(r.pricePerUnit, r.currency, r.pricePerUnit / (r.exchangeRate || 1), preferredCurrency)}</td>
                          <td className="p-4 text-white font-mono text-right">{formatWithBaseAmount(r.totalCost, r.currency, r.baseAmount, preferredCurrency)}</td>
                          <td className="p-4 text-white">{r.fuelType}</td>
                          <td className="p-4 text-white">{r.drivingType ? t(`refills.${r.drivingType}`) : ''}</td>
                          <td className="p-4 text-white">{r.station || r.comment}</td>
                          <td className="p-4 text-white font-mono">{formatDate(r.timestamp || r.createdAt, dateFormat)}</td>
                          <td className="p-4 text-white">
                            <Menu as="div" className="relative">
                              <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                                <MoreVertical className="h-5 w-5 text-slate-400" />
                              </Menu.Button>
                              <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button onClick={() => handleEdit(r)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2`}>
                                      <Pencil className="h-4 w-4" />
                                      {t('common.edit')}
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button onClick={() => { setDeleteId(r.refillId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2`}>
                                      <Trash2 className="h-4 w-4" />
                                      {t('common.delete')}
                                    </button>
                                  )}
                                </Menu.Item>
                              </Menu.Items>
                            </Menu>
                          </td>
                        </tr>
                        {editingId === r.refillId && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <div className="bg-slate-750 p-6 border-t border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4">{t('refills.edit')}</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.odometer')} (km)</Label>
                                      <input type="number" step="0.01" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value})} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </Field>
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.volume')} (L)</Label>
                                      <input type="text" inputMode="decimal" value={formData.volume} onChange={(e) => updateFormField('volume', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </Field>
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.pricePerUnit')}</Label>
                                      <input type="text" inputMode="decimal" value={formData.pricePerUnit} onChange={(e) => updateFormField('pricePerUnit', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </Field>
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.totalCost')}</Label>
                                      <input type="text" inputMode="decimal" value={formData.totalCost} onChange={(e) => updateFormField('totalCost', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </Field>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">Currency</Label>
                                      <Listbox value={formData.currency} onChange={(value) => setFormData({...formData, currency: value})}>
                                        <div className="relative">
                                          <Listbox.Button className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                            <span>{formData.currency}</span>
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                          </Listbox.Button>
                                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {CURRENCIES.map((curr) => (
                                              <Listbox.Option key={curr.code} value={curr.code} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                                                {({ selected }) => (
                                                  <div className="flex justify-between items-center">
                                                    <span className={selected ? 'font-semibold text-white' : 'text-white'}>{curr.code}</span>
                                                    {selected && <Check className="h-4 w-4 text-indigo-500" />}
                                                  </div>
                                                )}
                                              </Listbox.Option>
                                            ))}
                                          </Listbox.Options>
                                        </div>
                                      </Listbox>
                                    </Field>
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.fuelType')}</Label>
                                      <Listbox value={formData.fuelType} onChange={(value) => setFormData({...formData, fuelType: value})}>
                                        <div className="relative">
                                          <Listbox.Button className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                            <span>{formData.fuelType}</span>
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                          </Listbox.Button>
                                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {['Regular', 'Premium', 'Diesel'].map((fuel) => (
                                              <Listbox.Option key={fuel} value={fuel} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                                                {({ selected }) => (
                                                  <div className="flex justify-between items-center">
                                                    <span className={selected ? 'font-semibold text-white' : 'text-white'}>{fuel}</span>
                                                    {selected && <Check className="h-4 w-4 text-indigo-500" />}
                                                  </div>
                                                )}
                                              </Listbox.Option>
                                            ))}
                                          </Listbox.Options>
                                        </div>
                                      </Listbox>
                                    </Field>
                                    <Field>
                                      <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.station')}</Label>
                                      <input type="text" value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </Field>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      type="submit" 
                                      disabled={updateMutation.isPending} 
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                      {updateMutation.isPending ? t('common.saving') : t('common.save')}
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => { setEditingId(null); setShowForm(false); }} 
                                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                                    >
                                      {t('common.cancel')}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {refills.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>{t('refills.noRefills')}</p>
              </div>
            )}
            {(hasMoreMonths || hasNextPage) && <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>}
            </div>}
          </div>

          {/* Mobile/Tablet Cards (<1400px) */}
          <div className="min-[1400px]:hidden">
            {visibleGroupedRefills.map(([month, monthRefills]) => (
              <div key={month} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                  {new Date(month + '-01').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }).replace(' р.', '')}
                </h2>
                <div className="grid gap-4">
                  {monthRefills.map((r: Refill) => (
                    <React.Fragment key={r.refillId}>
                      <div className="bg-slate-800 p-6 rounded-lg flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">
                            <span className="font-mono">{convertVolume(r.volume, units).toFixed(2)}{getVolumeUnit(units)}</span> 
                            <span className="text-slate-400 mx-2">@</span> 
                            <span className="font-mono">{r.currency === 'UAH' ? '₴' : '$'}{Number(r.pricePerUnit).toFixed(2)}/L</span>
                          </h3>
                          <div className="space-y-1">
                            <p className="text-slate-300">
                              <span className="text-slate-400">Odometer:</span> 
                              <span className="font-mono ml-1">{Math.round(convertDistance(r.odometer, units))} {getDistanceUnit(units)}</span> 
                              <span className="text-slate-400 mx-2">•</span> 
                              <span className="text-slate-400">Total:</span> 
                              <span className="font-mono ml-1">{formatWithBaseAmount(r.totalCost, r.currency, r.baseAmount, preferredCurrency)}</span>
                            </p>
                            <p className="text-slate-400 text-sm">
                              {r.fuelType}
                              {r.drivingType && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                    {t(`refills.${r.drivingType}`)}
                                  </span>
                                </>
                              )}
                              {(r.station || r.comment) && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{r.station || r.comment}</span>
                                </>
                              )}
                            </p>
                            {(r.timestamp || r.createdAt) && (
                              <p className="text-slate-500 text-sm font-mono">{formatDate(r.timestamp || r.createdAt, dateFormat)}</p>
                            )}
                          </div>
                        </div>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => handleEdit(r)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2`}>
                                  <Pencil className="h-4 w-4" />
                                  {t('common.edit')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => { setDeleteId(r.refillId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2`}>
                                  <Trash2 className="h-4 w-4" />
                                  {t('common.delete')}
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </div>
                      {editingId === r.refillId && (
                        <div className="bg-slate-750 p-4 rounded-lg border border-slate-700">
                          <h3 className="text-lg font-bold text-white mb-4">{t('refills.edit')}</h3>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.odometer')} (km)</Label>
                                <input type="number" step="0.01" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value})} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.volume')} (L)</Label>
                                <input type="text" inputMode="decimal" value={formData.volume} onChange={(e) => updateFormField('volume', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.pricePerUnit')}</Label>
                                <input type="text" inputMode="decimal" value={formData.pricePerUnit} onChange={(e) => updateFormField('pricePerUnit', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.totalCost')}</Label>
                                <input type="text" inputMode="decimal" value={formData.totalCost} onChange={(e) => updateFormField('totalCost', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">Currency</Label>
                                <Listbox value={formData.currency} onChange={(value) => setFormData({...formData, currency: value})}>
                                  <div className="relative">
                                    <Listbox.Button className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                      <span>{formData.currency}</span>
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </Listbox.Button>
                                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                      {CURRENCIES.map((curr) => (
                                        <Listbox.Option key={curr.code} value={curr.code} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                                          {({ selected }) => (
                                            <div className="flex justify-between items-center">
                                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{curr.code}</span>
                                              {selected && <Check className="h-4 w-4 text-indigo-500" />}
                                            </div>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </div>
                                </Listbox>
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.fuelType')}</Label>
                                <Listbox value={formData.fuelType} onChange={(value) => setFormData({...formData, fuelType: value})}>
                                  <div className="relative">
                                    <Listbox.Button className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                      <span>{formData.fuelType}</span>
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </Listbox.Button>
                                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                      {['Regular', 'Premium', 'Diesel'].map((fuel) => (
                                        <Listbox.Option key={fuel} value={fuel} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                                          {({ selected }) => (
                                            <div className="flex justify-between items-center">
                                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{fuel}</span>
                                              {selected && <Check className="h-4 w-4 text-indigo-500" />}
                                            </div>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </div>
                                </Listbox>
                              </Field>
                            </div>
                            <Field>
                              <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.station')}</Label>
                              <input type="text" value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </Field>
                            <div className="flex gap-2">
                              <button 
                                type="submit" 
                                disabled={updateMutation.isPending} 
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                              >
                                {updateMutation.isPending ? t('common.saving') : t('common.save')}
                              </button>
                              <button 
                                type="button" 
                                onClick={() => { setEditingId(null); setShowForm(false); }} 
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            {refills.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>{t('refills.noRefills')}</p>
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
            <Dialog.Title className="text-xl font-bold text-white mb-4">{t('refills.delete')}</Dialog.Title>
            <p className="text-slate-300 mb-6">{t('refills.deleteConfirm')}</p>
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
