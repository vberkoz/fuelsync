import { Menu, Disclosure } from '@headlessui/react';
import { MoreVertical, Pencil, Trash2, Camera, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { api } from '../../lib/api';
import { formatWithBaseAmount } from '../../lib/currency';
import { convertDistance, getDistanceUnit } from '../../lib/units';
import { formatDate } from '../../lib/date';

interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number;
  odometer?: number;
  description?: string;
  timestamp?: number;
  createdAt: string;
  odometerImageKey?: string;
  receiptImageKey?: string;
  media?: Array<{ key: string; type: string; label: string }>;
}

interface ExpenseItemProps {
  expense: Expense;
  preferredCurrency: string;
  units: string;
  dateFormat: string;
  vehicleId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseTableRow({ expense, preferredCurrency, units, dateFormat, onEdit, onDelete }: Omit<ExpenseItemProps, 'vehicleId'>) {
  const { t } = useTranslation();

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800">
      <td className="p-4 text-white">{expense.category}</td>
      <td className="p-4 text-white font-mono text-right">
        {formatWithBaseAmount(expense.amount, expense.currency, expense.baseAmount, preferredCurrency)}
      </td>
      <td className="p-4 text-white font-mono text-right">
        {expense.odometer ? Math.round(convertDistance(expense.odometer, units)) : ''}
      </td>
      <td className="p-4 text-white">{expense.description}</td>
      <td className="p-4 text-white font-mono">
        {formatDate(expense.timestamp || expense.createdAt, dateFormat)}
      </td>
      <td className="p-4 text-white">
        <Menu as="div" className="relative">
          <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <MoreVertical className="h-5 w-5 text-slate-400" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
            <Menu.Item>
              {({ active }) => (
                <button 
                  onClick={onEdit} 
                  className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button 
                  onClick={onDelete} 
                  className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </td>
    </tr>
  );
}

export function ExpenseCard({ expense, preferredCurrency, units, dateFormat, vehicleId, onEdit, onDelete }: ExpenseItemProps) {
  const { t } = useTranslation();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});

  const hasPhotos = !!(expense.odometerImageKey || expense.receiptImageKey || (expense.media && expense.media.length > 0));

  const loadPhoto = async (photoType: 'odometer' | 'receipt') => {
    if (photoUrls[photoType] || loadingPhotos[photoType]) return;
    
    setLoadingPhotos(prev => ({ ...prev, [photoType]: true }));
    setFailedPhotos(prev => ({ ...prev, [photoType]: false }));
    try {
      const result = await api.expenses.getPhoto(vehicleId, expense.expenseId, photoType);
      setPhotoUrls(prev => ({ ...prev, [photoType]: result.photoUrl }));
    } catch (error) {
      console.error(`Failed to load ${photoType} photo:`, error);
      setFailedPhotos(prev => ({ ...prev, [photoType]: true }));
    } finally {
      setLoadingPhotos(prev => ({ ...prev, [photoType]: false }));
    }
  };

  const handleDisclosureOpen = () => {
    if (expense.odometerImageKey && !photoUrls.odometer) loadPhoto('odometer');
    if (expense.receiptImageKey && !photoUrls.receipt) loadPhoto('receipt');
    expense.media?.forEach((item, idx) => {
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
          <h3 className="text-xl font-bold text-white">
            {expense.category} - <span className="font-mono">
              {formatWithBaseAmount(expense.amount, expense.currency, expense.baseAmount, preferredCurrency)}
            </span>
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
                  <button 
                    onClick={onEdit} 
                    className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    <Pencil className="h-4 w-4" />
                    {t('common.edit')}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button 
                    onClick={onDelete} 
                    className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
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
          <div className="flex justify-between items-center">
            <p className="text-slate-400">
              {expense.odometer && (
                <span className="font-mono">
                  Odometer: {Math.round(convertDistance(expense.odometer, units))} {getDistanceUnit(units)}
                </span>
              )}
            </p>
            {(expense.timestamp || expense.createdAt) && (
              <p className="text-slate-500 text-xs font-mono">
                {formatDate(expense.timestamp || expense.createdAt, dateFormat)}
              </p>
            )}
          </div>
          {expense.description && <p className="text-slate-500 text-sm">{expense.description}</p>}
        </div>
      </div>
      {hasPhotos && (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Panel className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expense.odometerImageKey && (
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
                {expense.receiptImageKey && (
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
                    ) : failedPhotos.receipt ? (
                      <div className="px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm">
                        Failed to load photo
                      </div>
                    ) : null}
                  </div>
                )}
                {expense.media?.map((item, idx) => (
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
