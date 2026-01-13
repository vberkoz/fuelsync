import { useState, useRef } from 'react';
import { Field, Label, Combobox, Listbox } from '@headlessui/react';
import { ChevronDown, Check, Camera, AlertCircle, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES } from '../../lib/currency';
import { api } from '../../lib/api';

interface ExpenseFormProps {
  formData: {
    category: string;
    amount: string;
    currency: string;
    odometer: string;
    description: string;
    odometerImageKey?: string;
    media?: Array<{ key: string; type: string; label: string }>;
  };
  categories: string[];
  isSubmitting: boolean;
  isEditing: boolean;
  lastOdometer: number;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: any) => void;
  onCancel: () => void;
}

export default function ExpenseForm({
  formData,
  categories,
  isSubmitting,
  isEditing,
  lastOdometer,
  onSubmit,
  onChange,
  onCancel
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const [categoryQuery, setCategoryQuery] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrValidationWarning, setOcrValidationWarning] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = categoryQuery === '' 
    ? categories 
    : categories.filter((c: string) => c.toLowerCase().includes(categoryQuery.toLowerCase()));

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOCR(true);
    setOcrValidationWarning(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const imageData = reader.result as string;
          const result = await api.ocr.extract(imageData, 'odometer', lastOdometer);
          
          console.log('OCR result:', result);
          if (result.data?.odometer) {
            const updates: any = { ...formData, odometer: result.data.odometer.toString() };
            
            if (result.imageKey) {
              console.log('Setting odometerImageKey:', result.imageKey);
              updates.odometerImageKey = result.imageKey;
            }
            
            console.log('Form updates:', updates);
            onChange(updates);
            
            if (result.data.validationWarning) {
              setOcrValidationWarning(result.data.validationWarning);
            }
          }
        } catch (error) {
          console.error('OCR failed:', error);
          setOcrValidationWarning('Failed to recognize odometer. Please enter manually.');
        } finally {
          setIsProcessingOCR(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsProcessingOCR(false);
      setOcrValidationWarning('Failed to process image');
    }
  };

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
      onChange({ ...formData, media });
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
    onChange({ ...formData, media });
  };

  return (
    <div className="mb-6 bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">
        {isEditing ? t('expenses.edit') : t('expenses.add')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('expenses.category')}</Label>
            <Combobox 
              value={formData.category} 
              onChange={(value) => onChange({ ...formData, category: value || categoryQuery })}
            >
              <div className="relative">
                <Combobox.Input 
                  onChange={(e) => { 
                    setCategoryQuery(e.target.value); 
                    onChange({ ...formData, category: e.target.value }); 
                  }} 
                  displayValue={(category: string) => category} 
                  className="w-full px-4 py-2.5 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                  placeholder="Type or select a category"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </Combobox.Button>
                <Combobox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredCategories.length === 0 && categoryQuery !== '' ? (
                    <div className="px-4 py-2 text-slate-400 text-sm">
                      Press Enter to use "{categoryQuery}"
                    </div>
                  ) : (
                    filteredCategories.map((cat: string) => (
                      <Combobox.Option 
                        key={cat} 
                        value={cat} 
                        className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                      >
                        {({ selected }) => (
                          <div className="flex justify-between items-center">
                            <span className={selected ? 'font-semibold text-white' : 'text-white'}>{cat}</span>
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
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('expenses.amount')}</Label>
            <input 
              type="text" 
              inputMode="decimal" 
              value={formData.amount} 
              onChange={(e) => onChange({ ...formData, amount: e.target.value.replace(',', '.') })} 
              required 
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </Field>
          <Field>
            <Label className="block text-sm font-semibold text-white mb-1.5">Currency</Label>
            <Listbox value={formData.currency} onChange={(value) => onChange({ ...formData, currency: value })}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span>{formData.currency}</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {CURRENCIES.map((curr) => (
                    <Listbox.Option 
                      key={curr.code} 
                      value={curr.code} 
                      className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-600' : ''}`}
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span className={selected ? 'font-semibold text-white' : 'text-white'}>
                            {curr.code} - {curr.name}
                          </span>
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
            <Label className="block text-sm font-semibold text-white mb-1.5">{t('refills.odometer')} (km)</Label>
            <div className="flex gap-2">
              <input 
                type="text" 
                inputMode="decimal" 
                value={formData.odometer} 
                onChange={(e) => onChange({ ...formData, odometer: e.target.value.replace(',', '.') })} 
                required 
                className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <button 
                type="button" 
                onClick={handleCameraClick} 
                disabled={isProcessingOCR} 
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            {isProcessingOCR && (
              <div className="mt-2 flex items-center gap-2 text-indigo-400 text-sm">
                <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                <span>Processing image...</span>
              </div>
            )}
            {ocrValidationWarning && (
              <div className="mt-1 flex items-center gap-2 text-yellow-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{ocrValidationWarning}</span>
              </div>
            )}
          </Field>
        </div>
        <Field>
          <Label className="block text-sm font-semibold text-white mb-1.5">
            {t('expenses.description')} <span className="text-xs font-normal text-slate-400">({t('vehicles.optional')})</span>
          </Label>
          <textarea 
            rows={2} 
            value={formData.description} 
            onChange={(e) => onChange({ ...formData, description: e.target.value })} 
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" 
          />
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
        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isSubmitting ? t('common.saving') : (isEditing ? t('common.save') : t('common.add'))}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
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
