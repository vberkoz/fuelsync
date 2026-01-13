import { useState, useRef } from 'react';
import { api } from '../lib/api';

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = async (files: FileList | null): Promise<Array<{ key: string; type: string; label: string }>> => {
    if (!files || files.length === 0) return [];

    setIsUploading(true);
    try {
      const media: Array<{ key: string; type: string; label: string }> = [];
      for (const file of Array.from(files)) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
        const key = await api.uploads.uploadFile(file, mediaType);
        media.push({ key, type: file.type, label: file.name });
      }
      return media;
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return { isUploading, inputRef, uploadMedia };
}
