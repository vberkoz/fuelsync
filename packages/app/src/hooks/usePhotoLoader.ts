import { useState } from 'react';
import { api } from '../lib/api';

export function usePhotoLoader(vehicleId: string | null) {
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});

  const loadPhoto = async (expenseId: string) => {
    if (photoUrls[expenseId] || loadingPhotos[expenseId] || !vehicleId) return;
    
    setLoadingPhotos(prev => ({ ...prev, [expenseId]: true }));
    setFailedPhotos(prev => ({ ...prev, [expenseId]: false }));
    
    try {
      const result = await api.expenses.getPhoto(vehicleId, expenseId, 'receipt');
      setPhotoUrls(prev => ({ ...prev, [expenseId]: result.photoUrl }));
    } catch (error) {
      console.error('Failed to load receipt photo:', error);
      setFailedPhotos(prev => ({ ...prev, [expenseId]: true }));
    } finally {
      setLoadingPhotos(prev => ({ ...prev, [expenseId]: false }));
    }
  };

  return {
    photoUrls,
    loadingPhotos,
    failedPhotos,
    loadPhoto
  };
}
