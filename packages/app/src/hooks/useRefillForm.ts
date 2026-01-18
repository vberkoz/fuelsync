import { useState, useRef } from 'react';
import { api } from '../lib/api';

interface FormData {
  odometer: string;
  volume: string;
  pricePerUnit: string;
  totalCost: string;
  currency: string;
  fuelType: string;
  station: string;
  drivingType: string;
  odometerImageKey: string;
  media?: Array<{ key: string; type: string; label: string }>;
}

export function useRefillForm(initialData: FormData) {
  const [formData, setFormData] = useState(initialData);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrValidationWarning, setOcrValidationWarning] = useState<string | null>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

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

  const handleLibraryClick = () => {
    libraryInputRef.current?.click();
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>, lastOdometer: number) => {
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
          
          if (result.data?.odometer) {
            updateFormField('odometer', result.data.odometer.toString());
            
            if (result.imageKey) {
              setFormData(prev => ({ ...prev, odometerImageKey: result.imageKey }));
            }
            
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

  const resetForm = (data: FormData) => {
    setFormData(data);
    setOcrValidationWarning(null);
  };

  return {
    formData,
    setFormData,
    updateFormField,
    handleLibraryClick,
    handleImageCapture,
    isProcessingOCR,
    ocrValidationWarning,
    libraryInputRef,
    resetForm
  };
}
