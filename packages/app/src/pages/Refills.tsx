import { useState, useEffect, useRef } from 'react';
import { Dialog, Menu } from '@headlessui/react';
import { Fuel, Plus, X, MoreVertical, Download, Upload } from 'lucide-react';
import { useParams } from 'react-router-dom';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';
import { useReminderStore } from '../stores/reminderStore';
import ReminderDialog from '../components/ReminderDialog';
import { RefillForm } from '../components/refills/RefillForm';
import { RefillCard } from '../components/refills/RefillCard';

import { useRefillsData } from '../hooks/useRefillsData';
import { useRefillForm } from '../hooks/useRefillForm';
import { useRefillImportExport } from '../hooks/useRefillImportExport';

interface Refill {
  refillId: string;
  vehicleId?: string;
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
  odometerImageKey?: string;
  pumpImageKey?: string;
  receiptImageKey?: string;
}

export default function Refills() {
  const { t, i18n } = useTranslation();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const activeVehicleId = vehicleId || currentVehicleId;
  const { setReminders, getOverdueReminders } = useReminderStore();
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
  const [currentOdometerForReminder, setCurrentOdometerForReminder] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

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
    refills,
    visibleGroupedRefills,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    hasMoreMonths,
    createMutation,
    updateMutation,
    deleteMutation
  } = useRefillsData(activeVehicleId);

  const getInitialFormData = () => ({
    odometer: refills[0]?.odometer?.toString() || '',
    volume: '',
    pricePerUnit: '',
    totalCost: '',
    currency: 'USD',
    fuelType: currentVehicle?.vehicle?.fuelType || 'Regular',
    station: '',
    drivingType: 'mixed',
    odometerImageKey: '',
    media: []
  });

  const {
    formData,
    setFormData,
    updateFormField,
    handleCameraClick,
    handleImageCapture,
    isProcessingOCR,
    ocrValidationWarning,
    fileInputRef: ocrFileInputRef,
    resetForm
  } = useRefillForm(getInitialFormData());

  const { fileInputRef: csvFileInputRef, handleExport, handleImport } = useRefillImportExport(
    activeVehicleId,
    currentVehicle,
    createMutation
  );

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
      ...(formData.drivingType && { drivingType: formData.drivingType }),
      ...(formData.odometerImageKey && { odometerImageKey: formData.odometerImageKey }),
      ...(formData.media && formData.media.length > 0 && { media: formData.media })
    };

    if (editingId) {
      await updateMutation.mutateAsync({ refillId: editingId, data: refillData });
      setEditingId(null);
      setShowForm(false);
      resetForm(getInitialFormData());
    } else {
      await createMutation.mutateAsync(refillData);
      setShowForm(false);
      resetForm(getInitialFormData());

      if (activeVehicleId && refillData.odometer) {
        const overdue = getOverdueReminders(activeVehicleId, refillData.odometer);
        if (overdue.length > 0) {
          setOverdueReminders(overdue);
          setCurrentOdometerForReminder(refillData.odometer);
          setShowReminderDialog(true);
        }
      }
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
      drivingType: refill.drivingType || 'mixed',
      odometerImageKey: refill.odometerImageKey || '',
      media: (refill as any).media || []
    });
    setEditingId(refill.refillId);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  const handleAddClick = () => {
    setShowForm(!showForm);
    setEditingId(null);
    resetForm(getInitialFormData());
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
            <Menu.Button className="flex items-center justify-center px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg h-[38px] sm:h-[42px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <MoreVertical className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleExport} disabled={refills.length === 0 || createMutation.isPending} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Download className="h-4 w-4" />
                    {createMutation.isPending ? 'Exporting...' : 'Export CSV'}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => csvFileInputRef.current?.click()} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button
            onClick={handleAddClick}
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
          <RefillForm
            formData={formData}
            onFieldChange={updateFormField}
            onFormDataChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingId(null); resetForm(getInitialFormData()); }}
            isSubmitting={createMutation.isPending}
            isEditing={false}
            onCameraClick={handleCameraClick}
            isProcessingOCR={isProcessingOCR}
            ocrValidationWarning={ocrValidationWarning}
          />
          <input
            ref={ocrFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageCapture(e, refills[0]?.odometer || currentVehicle?.vehicle?.odometer || 0)}
            className="hidden"
          />
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
          {visibleGroupedRefills.map(([month, monthRefills]) => (
            <div key={month} className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                {new Date(month + '-01').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }).replace(' р.', '')}
              </h2>
              <div className="grid gap-4">
                {monthRefills.map((r: Refill) => (
                  <React.Fragment key={r.refillId}>
                    <RefillCard
                      refill={r}
                      units={units}
                      preferredCurrency={preferredCurrency}
                      dateFormat={dateFormat}
                      onEdit={handleEdit}
                      onDelete={(id) => { setDeleteId(id); setShowDeleteDialog(true); }}
                    />
                    {editingId === r.refillId && (
                      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">{t('refills.edit')}</h3>
                        <RefillForm
                          formData={formData}
                          onFieldChange={updateFormField}
                          onFormDataChange={setFormData}
                          onSubmit={handleSubmit}
                          onCancel={() => { setEditingId(null); setShowForm(false); resetForm(getInitialFormData()); }}
                          isSubmitting={updateMutation.isPending}
                          isEditing={true}
                          onCameraClick={handleCameraClick}
                          isProcessingOCR={isProcessingOCR}
                          ocrValidationWarning={ocrValidationWarning}
                        />
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
