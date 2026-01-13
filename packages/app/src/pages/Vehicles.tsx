import { useState, useRef, useMemo } from 'react';
import React from 'react';
import { Menu, Listbox, RadioGroup, Field, Label, Combobox, Disclosure } from '@headlessui/react';
import { Car, Plus, X, MoreVertical, ChevronDown, Check, Download, Upload, Pencil, Trash2, Eye, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { formatDate } from '../lib/date';
import { useVehicleStore } from '../stores/vehicleStore';
import { exportToCSV, parseCSV } from '../lib/csv';
import { getVehicleLogoPath } from '../lib/vehicleLogos';
import { useVehicleMutations } from '../hooks/useVehicleMutations';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import type { Vehicle } from '../types';

export default function Vehicles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular', media: [] as Array<{ key: string; type: string; label: string }> });
  const [logoError, setLogoError] = useState<Set<string>>(new Set());
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createMutation, updateMutation, deleteMutation, handleDelete: handleDeleteVehicle } = useVehicleMutations();

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      const media = formData.media || [];
      for (const file of Array.from(files)) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
        const key = await api.uploads.uploadFile(file, mediaType);
        media.push({ key, type: file.type, label: file.name });
      }
      setFormData({ ...formData, media });
    } catch (error) {
      console.error('Media upload failed:', error);
    } finally {
      setIsUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const media = [...(formData.media || [])];
    media.splice(index, 1);
    setFormData({ ...formData, media });
  };

  const loadMediaFile = async (vehicleId: string, key: string, idx: number) => {
    const mediaKey = `${vehicleId}-media-${idx}`;
    if (mediaUrls[mediaKey] || loadingMedia[mediaKey]) return;
    
    setLoadingMedia(prev => ({ ...prev, [mediaKey]: true }));
    try {
      const result = await api.uploads.getUrl(key);
      setMediaUrls(prev => ({ ...prev, [mediaKey]: result.url }));
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoadingMedia(prev => ({ ...prev, [mediaKey]: false }));
    }
  };

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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleData: any = { ...formData, year: parseInt(formData.year) };
    if (formData.media && formData.media.length > 0) {
      vehicleData.media = formData.media;
    }
    
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: vehicleData });
      setShowForm(false);
      setEditingId(null);
      setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular', media: [] });
    } else {
      await createMutation.mutateAsync(vehicleData);
      setShowForm(false);
      setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular', media: [] });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({ 
      make: vehicle.make || '', 
      model: vehicle.model || '', 
      year: vehicle.year?.toString() || '', 
      licensePlate: vehicle.licensePlate || '',
      fuelType: vehicle.fuelType || 'Regular',
      media: vehicle.media || []
    });
    setEditingId(vehicle.vehicleId);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      handleDeleteVehicle(deleteId, vehicles);
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
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
      {error && <ErrorAlert error={error} className="mb-4" />}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-indigo-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('vehicles.title')}</h1>
        </div>
        <div className="flex gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-center px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg h-[38px] sm:h-[42px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <MoreVertical className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleExport} disabled={vehicles.length === 0} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => fileInputRef.current?.click()} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Upload className="h-4 w-4" /> Import CSV
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular', media: [] }); }} className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
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

      {isLoading && <LoadingSpinner message={t('vehicles.loading')} />}

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
                            <img src={getVehicleLogoPath(formData.make)} alt={formData.make} className="h-5 w-5 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(formData.make)); e.currentTarget.style.display = 'none'; }} />
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
            <Field>
              <Label className="block text-sm font-semibold text-white mb-1.5">Media (photos/videos)</Label>
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
              >
                <Upload className="h-5 w-5" />
                {isUploadingMedia ? 'Uploading...' : 'Add Photos/Videos'}
              </button>
              {formData.media && formData.media.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.media.map((item, idx) => (
                    <div key={idx} className="relative bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <span className="text-sm text-white truncate max-w-[150px]">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {createMutation.isPending ? t('common.saving') : t('common.add')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {!isLoading && (
        <RadioGroup value={currentVehicleId || undefined} onChange={setCurrentVehicle}>
          <div className="grid gap-4">
            {vehicles.map((v: Vehicle) => (
              <React.Fragment key={v.vehicleId}>
                <RadioGroup.Option value={v.vehicleId} className="focus:outline-none">
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
                            <img src={getVehicleLogoPath(v.make)} alt={v.make} className="h-12 w-12 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(v.make)); e.currentTarget.style.display = 'none'; }} />
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
                          <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => navigate(`/refills/${v.vehicleId}`)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                                  <Eye className="h-4 w-4" /> {t('vehicles.viewRefills')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => handleEdit(v)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                                  <Pencil className="h-4 w-4" /> {t('common.edit')}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
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
                      <div className="flex items-center justify-between mb-3">
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
                      {v.media && v.media.length > 0 && (
                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Panel className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {v.media?.map((item: any, idx: number) => {
                                  const mediaKey = `${v.vehicleId}-media-${idx}`;
                                  return (
                                    <div key={idx}>
                                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                                      {mediaUrls[mediaKey] ? (
                                        item.type.startsWith('video/') ? (
                                          <video 
                                            src={mediaUrls[mediaKey]} 
                                            controls 
                                            className="w-full max-w-xs rounded-lg border border-slate-600"
                                          />
                                        ) : (
                                          <img 
                                            src={mediaUrls[mediaKey]} 
                                            alt={item.label} 
                                            className="w-full max-w-xs rounded-lg border border-slate-600"
                                            loading="lazy"
                                          />
                                        )
                                      ) : loadingMedia[mediaKey] ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-sm text-slate-300">
                                          <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                                          Loading...
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </Disclosure.Panel>
                              <Disclosure.Button 
                                className="flex items-center justify-center gap-2 w-full text-sm text-indigo-400 hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                                onClick={() => v.media?.forEach((item: any, idx: number) => loadMediaFile(v.vehicleId, item.key, idx))}
                              >
                                <Camera className="h-4 w-4" />
                                <span>{open ? 'Hide Photos' : 'View Photos'}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                              </Disclosure.Button>
                            </>
                          )}
                        </Disclosure>
                      )}
                    </div>
                  </div>
                )}
              </RadioGroup.Option>
              {editingId === v.vehicleId && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">{t('vehicles.edit')}</h3>
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
                                    <Car className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <img src={getVehicleLogoPath(formData.make)} alt={formData.make} className="h-4 w-4 object-contain" onError={(e) => { setLogoError(prev => new Set(prev).add(formData.make)); e.currentTarget.style.display = 'none'; }} />
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
                    <Field>
                      <Label className="block text-sm font-semibold text-white mb-1.5">Media (photos/videos)</Label>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); mediaInputRef.current?.click(); }}
                        disabled={isUploadingMedia}
                        className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingMedia ? 'Uploading...' : 'Add Photos/Videos'}
                      </button>
                      {formData.media && formData.media.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.media.map((item, idx) => (
                            <div key={idx} className="relative bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <span className="text-sm text-white truncate max-w-[150px]">{item.label}</span>
                              <button
                                type="button"
                                onClick={() => removeMedia(idx)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Field>
                    <div className="flex gap-2">
                      <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {updateMutation.isPending ? t('common.saving') : t('common.save')}
                      </button>
                      <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">{t('common.cancel')}</button>
                    </div>
                  </form>
                </div>
              )}
              </React.Fragment>
            ))}
            {vehicles.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p>{t('vehicles.noVehicles')}</p>
              </div>
            )}
          </div>
        </RadioGroup>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('vehicles.delete')}
        message={t('vehicles.deleteConfirm')}
        isLoading={deleteMutation.isPending}
      />
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaUpload}
        className="hidden"
      />
    </div>
  );
}
