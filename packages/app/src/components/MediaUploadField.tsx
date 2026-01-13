import { Upload, X } from 'lucide-react';
import { Field, Label } from '@headlessui/react';

interface MediaUploadFieldProps {
  media: Array<{ key: string; type: string; label: string }>;
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

export function MediaUploadField({ media, isUploading, inputRef, onUpload, onRemove }: MediaUploadFieldProps) {
  return (
    <Field>
      <Label className="block text-sm font-semibold text-white mb-1.5">Media (photos/videos)</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
      >
        <Upload className="h-5 w-5" />
        {isUploading ? 'Uploading...' : 'Add Photos/Videos'}
      </button>
      {media && media.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {media.map((item, idx) => (
            <div key={idx} className="relative bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-sm text-white truncate max-w-[150px]">{item.label}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onUpload}
        className="hidden"
      />
    </Field>
  );
}
