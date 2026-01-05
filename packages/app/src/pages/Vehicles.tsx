import { useState, useRef, useMemo } from 'react';
import { Dialog, Menu, Listbox, RadioGroup, Field, Label, Combobox } from '@headlessui/react';
import { Car, Plus, X, MoreVertical, ChevronDown, Check, Download, Upload, Pencil, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate } from '../lib/date';
import { useVehicleStore } from '../stores/vehicleStore';
import { exportToCSV, parseCSV } from '../lib/csv';

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  fuelType?: string;
  createdAt?: string;
}

const customSlugs: Record<string, string> = {
  'ABT': 'abt-sportsline',
  'AMC': 'american-motors',
  'Atalanta': 'atalanta-motors',
  'BAIC Motor': 'baic',
  'Chevrolet Corvette': 'corvette',
  'Citroën': 'citroen',
  'DMC': 'delorean',
  'Force Motors': 'force',
  'Hindustan Motors': 'hindustan',
  'IKCO': 'iran-khodro',
  'JMC': 'jiangling',
  'LEVC': 'london-ev-company',
  'Li Auto': 'lixiang',
  'Lynk & Co': 'lynkco',
  'SAIC Motor': 'saic',
  'Tauro': 'tauro-sport-auto',
  'Zarooq Motors': 'zarooq',
  'Zinoro': 'zhinuo',
  'Škoda': 'skoda'
};

function getVehicleLogo(make: string): { type: 'image' | 'icon'; value: string } {
  const slug = customSlugs[make] || make.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return { type: 'image', value: `/logos/${slug}.png` };
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
  const [logoError, setLogoError] = useState<Set<string>>(new Set());
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: api.brands.list
  });

  const [makeQuery, setMakeQuery] = useState('');

  const dateFormat = settingsData?.settings?.dateFormat || 'MM/DD/YYYY';
  const vehicles = data?.vehicles || [];
  const brands = brandsData?.brands || [];
  const filteredBrands = useMemo(() => {
    if (makeQuery === '') return brands.slice(0, 50);
    return brands.filter((b: any) => b.name.toLowerCase().includes(makeQuery.toLowerCase())).slice(0, 50);
  }, [brands, makeQuery]);

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
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (id === currentVehicleId && vehicles.length > 1) {
      const nextVehicle = vehicles.find((v: Vehicle) => v.vehicleId !== id);
      if (nextVehicle) setCurrentVehicle(nextVehicle.vehicleId);
    }
    deleteMutation.mutate(id);
  };

  const handleExport = () => {
    const csvData = vehicles.map((v: Vehicle) => ({
      make: v.make,
      model: v.model,
      year: v.year,
      licensePlate: v.licensePlate || '',
      fuelType: v.fuelType || ''
    }));
    exportToCSV(csvData, 'vehicles.csv');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = parseCSV(text);
    for (const row of data) {
      await createMutation.mutateAsync({
        make: row.make,
        model: row.model,
        year: parseInt(row.year),
        licensePlate: row.licensePlate,
        fuelType: row.fuelType
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
          <Car className="h-8 w-8 text-indigo-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('vehicles.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-center px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg h-[38px] sm:h-[42px]">
              <MoreVertical className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleExport} disabled={vehicles.length === 0} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg disabled:opacity-50 flex items-center gap-2`}>
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => fileInputRef.current?.click()} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-b-lg flex items-center gap-2`}>
                    <Upload className="h-4 w-4" /> Import CSV
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' }); }} className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            {showForm ? (
              <>
                <X className="h-5 w-5" />
                <span className="hidden min-[440px]:inline">{t('common.cancel')}</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="hidden min-[440px]:inline">{t('vehicles.add')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('vehicles.loading')}</p>
        </div>
      )}

      {!isLoading && showForm && !editingId && (
        <div className="mb-6 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">{t('vehicles.add')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.make')}</Label>
                <Combobox value={formData.make} onChange={(value) => setFormData({...formData, make: value || makeQuery})}>
                  <div className="relative">
                    <div className="relative">
                      {formData.make && (
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          {logoError.has(formData.make) ? (
                            <Car className="h-5 w-5 text-slate-400" />
                          ) : (
                            <img src={getVehicleLogo(formData.make).value} alt={formData.make} className="h-5 w-5 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(formData.make)); e.currentTarget.style.display = 'none'; }} />
                          )}
                        </div>
                      )}
                      <Combobox.Input onChange={(e) => { setMakeQuery(e.target.value); setFormData({...formData, make: e.target.value}); }} displayValue={(make: string) => make} className={`w-full py-2.5 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formData.make ? 'pl-10' : 'pl-4'}`} required placeholder="Type or select a brand" />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredBrands.length === 0 && makeQuery !== '' ? (
                        <div className="px-4 py-2 text-slate-400 text-sm">
                          Press Enter to use "{makeQuery}"
                        </div>
                      ) : (
                        filteredBrands.map((brand: any) => (
                          <Combobox.Option key={brand.name} value={brand.name} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                            {({ selected }) => (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {brand.logo && <img src={brand.logo} alt={brand.name} className="h-5 w-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                                  <span className={selected ? 'font-semibold text-white' : 'text-white'}>{brand.name}</span>
                                </div>
                                {selected && <Check className="h-5 w-5 text-indigo-500" />}
                              </div>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
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
            </div>
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
                      <Listbox.Option
                        key={fuel}
                        value={fuel}
                        className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                      >
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
            <div className="flex gap-2">
              <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                {createMutation.isPending ? t('common.saving') : t('common.add')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {!isLoading && (
        <RadioGroup value={currentVehicleId || undefined} onChange={setCurrentVehicle}>
          {/* Desktop Table (≥1300px) */}
          <div className="hidden xl:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-semibold"></th>
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
                        <td className="p-4">
                          {logoError.has(v.make) ? (
                            <Car className="h-8 w-8 text-slate-400" />
                          ) : (
                            <img src={getVehicleLogo(v.make).value} alt={v.make} className="h-8 w-8 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(v.make)); e.currentTarget.style.display = 'none'; }} />
                          )}
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
                              <MoreVertical className="h-5 w-5 text-slate-400" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => navigate(`/refills/${v.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2`}>
                                    <Eye className="h-4 w-4" /> {t('vehicles.viewRefills')}
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleEdit(v)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white flex items-center gap-2`}>
                                    <Pencil className="h-4 w-4" /> {t('common.edit')}
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2`}>
                                    <Trash2 className="h-4 w-4" /> {t('common.delete')}
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Menu>
                        </td>
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
                {vehicles.map((v: Vehicle) => (
                  editingId === v.vehicleId && (
                    <tr key={`edit-${v.vehicleId}`}>
                      <td colSpan={9} className="p-0">
                        <div className="bg-slate-750 p-6 border-t border-slate-700">
                          <h3 className="text-lg font-bold text-white mb-4">{t('vehicles.edit')}</h3>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.make')}</Label>
                                <Combobox value={formData.make} onChange={(value) => setFormData({...formData, make: value || makeQuery})}>
                                  <div className="relative">
                                    <div className="relative">
                                      {formData.make && (
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                          {logoError.has(formData.make) ? (
                                            <Car className="h-4 w-4 text-slate-400" />
                                          ) : (
                                            <img src={getVehicleLogo(formData.make).value} alt={formData.make} className="h-4 w-4 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(formData.make)); e.currentTarget.style.display = 'none'; }} />
                                          )}
                                        </div>
                                      )}
                                      <Combobox.Input onChange={(e) => { setMakeQuery(e.target.value); setFormData({...formData, make: e.target.value}); }} displayValue={(make: string) => make} className={`w-full py-2 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formData.make ? 'pl-8' : 'pl-3'}`} required />
                                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                      </Combobox.Button>
                                    </div>
                                    <Combobox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                      {filteredBrands.map((brand: any) => (
                                        <Combobox.Option key={brand.name} value={brand.name} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                                          {({ selected }) => (
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                {brand.logo && <img src={brand.logo} alt={brand.name} className="h-4 w-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                                                <span className={selected ? 'font-semibold text-white' : 'text-white'}>{brand.name}</span>
                                              </div>
                                              {selected && <Check className="h-4 w-4 text-indigo-500" />}
                                            </div>
                                          )}
                                        </Combobox.Option>
                                      ))}
                                    </Combobox.Options>
                                  </div>
                                </Combobox>
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.model')}</Label>
                                <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.year')}</Label>
                                <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                              </Field>
                              <Field>
                                <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.licensePlate')}</Label>
                                <input type="text" value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                            <div className="flex gap-2">
                              <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                                {updateMutation.isPending ? t('common.saving') : t('common.save')}
                              </button>
                              <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">{t('common.cancel')}</button>
                            </div>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
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
                  <div className={`relative bg-slate-800 hover:bg-slate-750 transition-all duration-200 rounded-xl border overflow-visible ${
                    checked ? 'ring-2 ring-indigo-500 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-slate-700 hover:border-slate-600'
                  }`}>
                    {/* Header with logo, selection, and menu */}
                    <div className="flex items-center justify-between p-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {logoError.has(v.make) ? (
                            <div className="h-12 w-12 flex items-center justify-center bg-slate-700 rounded-lg">
                              <Car className="h-7 w-7 text-slate-400" />
                            </div>
                          ) : (
                            <img src={getVehicleLogo(v.make).value} alt={v.make} className="h-12 w-12 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(v.make)); e.currentTarget.style.display = 'none'; }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white leading-tight">
                            <span className="font-mono text-indigo-400">{v.year}</span> {v.make}
                          </h3>
                          <p className="text-slate-300 font-medium">{v.model}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => navigate(`/refills/${v.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2`}>
                                  <Eye className="h-4 w-4" /> {t('vehicles.viewRefills')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => handleEdit(v)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white flex items-center gap-2`}>
                                  <Pencil className="h-4 w-4" /> {t('common.edit')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2`}>
                                  <Trash2 className="h-4 w-4" /> {t('common.delete')}
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </div>
                    </div>
                    
                    {/* Vehicle details */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {v.licensePlate && (
                            <div className="bg-slate-700 px-3 py-1.5 rounded-md">
                              <span className="text-white font-mono text-sm font-bold uppercase tracking-wider">{v.licensePlate}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-slate-400 text-sm">{v.fuelType}</span>
                          </div>
                        </div>
                        {v.createdAt && (
                          <span className="text-slate-500 text-xs font-mono">{formatDate(v.createdAt, dateFormat)}</span>
                        )}
                      </div>
                    </div>
                    {editingId === v.vehicleId && (
                      <div className="mx-4 mb-4 bg-slate-750 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">{t('vehicles.edit')}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field>
                              <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.make')}</Label>
                              <Combobox value={formData.make} onChange={(value) => setFormData({...formData, make: value || makeQuery})}>
                                <div className="relative">
                                  <div className="relative">
                                    {formData.make && (
                                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        {logoError.has(formData.make) ? (
                                          <Car className="h-4 w-4 text-slate-400" />
                                        ) : (
                                          <img src={getVehicleLogo(formData.make).value} alt={formData.make} className="h-4 w-4 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(formData.make)); e.currentTarget.style.display = 'none'; }} />
                                        )}
                                      </div>
                                    )}
                                    <Combobox.Input onChange={(e) => { setMakeQuery(e.target.value); setFormData({...formData, make: e.target.value}); }} displayValue={(make: string) => make} className={`w-full py-2 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formData.make ? 'pl-8' : 'pl-3'}`} required />
                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </Combobox.Button>
                                  </div>
                                  <Combobox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {filteredBrands.map((brand: any) => (
                                      <Combobox.Option key={brand.name} value={brand.name} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}>
                                        {({ selected }) => (
                                          <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                              {brand.logo && <img src={brand.logo} alt={brand.name} className="h-4 w-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                                              <span className={selected ? 'font-semibold text-white' : 'text-white'}>{brand.name}</span>
                                            </div>
                                            {selected && <Check className="h-4 w-4 text-indigo-500" />}
                                          </div>
                                        )}
                                      </Combobox.Option>
                                    ))}
                                  </Combobox.Options>
                                </div>
                              </Combobox>
                            </Field>
                            <Field>
                              <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.model')}</Label>
                              <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </Field>
                            <Field>
                              <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.year')}</Label>
                              <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </Field>
                            <Field>
                              <Label className="block text-sm font-semibold text-white mb-1.5">{t('vehicles.licensePlate')}</Label>
                              <input type="text" value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                          <div className="flex gap-2">
                            <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                              {updateMutation.isPending ? t('common.saving') : t('common.save')}
                            </button>
                            <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">{t('common.cancel')}</button>
                          </div>
                        </form>
                      </div>
                    )}
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
