import { useState } from 'react';
import { api } from '../lib/api';

export function useMediaDisplay() {
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});

  const loadMedia = async (key: string, mediaKey: string) => {
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

  return { mediaUrls, loadingMedia, loadMedia };
}
