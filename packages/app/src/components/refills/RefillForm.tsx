import { Listbox, Field, Label } from '@headlessui/react';
import { ChevronDown, Check, Camera, AlertCircle, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES } from '../../lib/currency';
import { useRef, useState } from 'react';
import { api } from '../../lib/api';

interface RefillFormProps {
  formData: {
    odometer: string;
    volume: string;
    pricePerUnit: string;
    totalCost: string;
    currency: string;
    fuelType: string;
    station: string;
    drivingType: string;
    media?: Array<{ key: string; type: string; label: string }>;
  };
  onFieldChange: (field: string, value: string) => void;
  onFormDataChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  onCameraClick?: () => void;
  isProcessingOCR?: boolean;
  ocrValidationWarning?: string | null;
}

export function RefillForm({ formData, onFieldChange, onFormDataChange, onSubmit, onCancel, isSubmitting, isEditing, onCameraClick, isProcessingOCR, ocrValidationWarning }: RefillFormProps) {
  const { t } = useTranslation();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

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
      onFormDataChange({ ...formData, media });
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
    onFormDataChange({ ...formData, media });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.odometer')} (km)</Label>
          <div className="flex gap-2">
            <input type="number" step="0.01" value={formData.odometer} onChange={(e) => onFieldChange('odometer', e.target.value)} required className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {onCameraClick && (
              <button type="button" onClick={onCameraClick} disabled={isProcessingOCR} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <Camera className="h-5 w-5" />
              </button>
            )}
          </div>
          {isProcessingOCR && (
            <div className="mt-1.5 flex items-center gap-2 text-indigo-400 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
              <span>Processing image...</span>
            </div>
          )}
          {ocrValidationWarning && (
            <div className="mt-1.5 flex items-center gap-2 text-yellow-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{ocrValidationWarning}</span>
            </div>
          )}
        </Field>
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.volume')} (L)</Label>
          <input type="text" inputMode="decimal" value={formData.volume} onChange={(e) => onFieldChange('volume', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </Field>
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.pricePerUnit')}</Label>
          <input type="text" inputMode="decimal" value={formData.pricePerUnit} onChange={(e) => onFieldChange('pricePerUnit', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </Field>
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.totalCost')}</Label>
          <input type="text" inputMode="decimal" value={formData.totalCost} onChange={(e) => onFieldChange('totalCost', e.target.value.replace(',', '.'))} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">Currency</Label>
          <Listbox value={formData.currency} onChange={(value) => onFieldChange('currency', value)}>
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
          <Listbox value={formData.fuelType} onChange={(value) => onFieldChange('fuelType', value)}>
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
          <input type="text" value={formData.station} onChange={(e) => onFieldChange('station', e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </Field>
      </div>
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
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {isSubmitting ? t('common.saving') : (isEditing ? t('common.save') : t('common.add'))}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {t('common.cancel')}
        </button>
      </div>
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaUpload}
        className="hidden"
      />
    </form>
  );
}
