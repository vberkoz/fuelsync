interface MediaGridProps {
  media: Array<{ key: string; type: string; label: string }>;
  mediaUrls: Record<string, string>;
  loadingMedia: Record<string, boolean>;
  keyPrefix: string;
}

export function MediaGrid({ media, mediaUrls, loadingMedia, keyPrefix }: MediaGridProps) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {media.map((item, idx) => {
        const mediaKey = `${keyPrefix}-${idx}`;
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
    </div>
  );
}
