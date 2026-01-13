import { Menu, Disclosure } from '@headlessui/react';
import { MoreVertical, Pencil, Trash2, Camera, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { api } from '../../lib/api';
import { useVehicleStore } from '../../stores/vehicleStore';
import { convertDistance, convertVolume, getDistanceUnit, getVolumeUnit } from '../../lib/units';
import { formatWithBaseAmount } from '../../lib/currency';
import { formatDate } from '../../lib/date';

interface Refill {
  refillId: string;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
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
  media?: Array<{ key: string; type: string; label: string }>;
}

interface RefillCardProps {
  refill: Refill;
  units: string;
  preferredCurrency: string;
  dateFormat: string;
  onEdit: (refill: Refill) => void;
  onDelete: (id: string) => void;
}

export function RefillCard({ refill, units, preferredCurrency, dateFormat, onEdit, onDelete }: RefillCardProps) {
  const { t } = useTranslation();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const { currentVehicleId } = useVehicleStore();
  const activeVehicleId = currentVehicleId;

  const hasPhotos = refill.odometerImageKey || refill.pumpImageKey || refill.receiptImageKey || (refill.media && refill.media.length > 0);

  const loadPhoto = async (photoType: 'odometer' | 'pump' | 'receipt') => {
    console.log('Loading photo:', { photoType, refillId: refill.refillId, activeVehicleId });
    if (photoUrls[photoType] || loadingPhotos[photoType]) return;
    
    setLoadingPhotos(prev => ({ ...prev, [photoType]: true }));
    setFailedPhotos(prev => ({ ...prev, [photoType]: false }));
    try {
      console.log('Calling API with:', { activeVehicleId, refillId: refill.refillId, photoType });
      const result = await api.refills.getPhoto(activeVehicleId || '', refill.refillId, photoType);
      console.log('Photo API result:', result);
      setPhotoUrls(prev => ({ ...prev, [photoType]: result.photoUrl }));
    } catch (error) {
      console.error(`Failed to load ${photoType} photo:`, error);
      setFailedPhotos(prev => ({ ...prev, [photoType]: true }));
    } finally {
      setLoadingPhotos(prev => ({ ...prev, [photoType]: false }));
    }
  };

  // Auto-load photos when disclosure opens
  const handleDisclosureOpen = () => {
    console.log('Disclosure opened, checking photos:', { 
      odometerImageKey: refill.odometerImageKey, 
      pumpImageKey: refill.pumpImageKey, 
      receiptImageKey: refill.receiptImageKey 
    });
    if (refill.odometerImageKey && !photoUrls.odometer) loadPhoto('odometer');
    if (refill.pumpImageKey && !photoUrls.pump) loadPhoto('pump');
    if (refill.receiptImageKey && !photoUrls.receipt) loadPhoto('receipt');
    refill.media?.forEach((item, idx) => {
      if (!photoUrls[`media-${idx}`]) loadMediaFile(item.key, idx);
    });
  };

  const loadMediaFile = async (key: string, idx: number) => {
    const mediaKey = `media-${idx}`;
    if (photoUrls[mediaKey] || loadingPhotos[mediaKey]) return;
    
    setLoadingPhotos(prev => ({ ...prev, [mediaKey]: true }));
    try {
      const result = await api.uploads.getUrl(key);
      setPhotoUrls(prev => ({ ...prev, [mediaKey]: result.url }));
    } catch (error) {
      console.error('Failed to load media:', error);
      setFailedPhotos(prev => ({ ...prev, [mediaKey]: true }));
    } finally {
      setLoadingPhotos(prev => ({ ...prev, [mediaKey]: false }));
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            <span className="font-mono">{convertVolume(refill.volume, units).toFixed(2)}{getVolumeUnit(units)}</span> 
            <span className="text-slate-400 mx-2">@</span> 
            <span className="font-mono">{refill.currency === 'UAH' ? '₴' : '$'}{Number(refill.pricePerUnit).toFixed(2)}/L</span>
          </h3>
        </div>
        <div>
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <MoreVertical className="h-5 w-5 text-slate-400" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl border border-slate-600 focus:outline-none z-[100]">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => onEdit(refill)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Pencil className="h-4 w-4" />
                    {t('common.edit')}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={() => onDelete(refill.refillId)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <Trash2 className="h-4 w-4" />
                    {t('common.delete')}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      <div className="pb-4">
        <div className="flex-1">
          <div className="space-y-1">
            <p className="text-slate-300">
              <span className="text-slate-400">Odometer:</span> 
              <span className="font-mono ml-1">{Math.round(convertDistance(refill.odometer, units))} {getDistanceUnit(units)}</span> 
              <span className="text-slate-400 mx-2">•</span> 
              <span className="text-slate-400">Total:</span> 
              <span className="font-mono ml-1">{formatWithBaseAmount(refill.totalCost, refill.currency, refill.baseAmount, preferredCurrency)}</span>
            </p>
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-sm">
                {refill.fuelType}
                {refill.drivingType && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                      {t(`refills.${refill.drivingType}`)}
                    </span>
                  </>
                )}
              </p>
              {(refill.timestamp || refill.createdAt) && (
                <p className="text-slate-500 text-xs font-mono">{formatDate(refill.timestamp || refill.createdAt, dateFormat)}</p>
              )}
            </div>
            {(refill.station || refill.comment) && (
              <p className="text-slate-400 text-sm">{refill.station || refill.comment}</p>
            )}
          </div>
        </div>
      </div>
      {hasPhotos && (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Panel className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {refill.odometerImageKey && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Odometer Photo</p>
                    {photoUrls.odometer ? (
                      <img 
                        src={photoUrls.odometer} 
                        alt="Odometer" 
                        className="w-full max-w-xs rounded-lg border border-slate-600"
                        loading="lazy"
                      />
                    ) : loadingPhotos.odometer ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-sm text-slate-300">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                        Loading...
                      </div>
                    ) : failedPhotos.odometer ? (
                      <div className="px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
                        Failed to load photo
                      </div>
                    ) : null}
                  </div>
                )}
                {refill.pumpImageKey && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Pump Photo</p>
                    {photoUrls.pump ? (
                      <img 
                        src={photoUrls.pump} 
                        alt="Pump" 
                        className="w-full max-w-xs rounded-lg border border-slate-600"
                        loading="lazy"
                      />
                    ) : loadingPhotos.pump ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-sm text-slate-300">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                        Loading...
                      </div>
                    ) : null}
                  </div>
                )}
                {refill.receiptImageKey && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Receipt Photo</p>
                    {photoUrls.receipt ? (
                      <img 
                        src={photoUrls.receipt} 
                        alt="Receipt" 
                        className="w-full max-w-xs rounded-lg border border-slate-600"
                        loading="lazy"
                      />
                    ) : loadingPhotos.receipt ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-sm text-slate-300">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                        Loading...
                      </div>
                    ) : null}
                  </div>
                )}
                {refill.media?.map((item, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                    {photoUrls[`media-${idx}`] ? (
                      item.type.startsWith('video/') ? (
                        <video 
                          src={photoUrls[`media-${idx}`]} 
                          controls 
                          className="w-full max-w-xs rounded-lg border border-slate-600"
                        />
                      ) : (
                        <img 
                          src={photoUrls[`media-${idx}`]} 
                          alt={item.label} 
                          className="w-full max-w-xs rounded-lg border border-slate-600"
                          loading="lazy"
                        />
                      )
                    ) : loadingPhotos[`media-${idx}`] ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-sm text-slate-300">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full" />
                        Loading...
                      </div>
                    ) : failedPhotos[`media-${idx}`] ? (
                      <div className="px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
                        Failed to load media
                      </div>
                    ) : null}
                  </div>
                ))}
              </Disclosure.Panel>
              <Disclosure.Button 
                className="flex items-center justify-center gap-2 w-full text-sm text-indigo-400 hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                onClick={handleDisclosureOpen}
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
  );
}
