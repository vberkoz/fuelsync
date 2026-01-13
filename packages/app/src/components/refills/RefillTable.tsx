import React from 'react';
import { Menu } from '@headlessui/react';
import { MoreVertical, Pencil, Trash2, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { convertDistance, convertVolume, getDistanceUnit, getVolumeUnit } from '../../lib/units';
import { formatWithBaseAmount } from '../../lib/currency';
import { formatDate } from '../../lib/date';
import { RefillForm } from './RefillForm';

interface Refill {
  refillId: string;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  exchangeRate?: number;
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
}

interface RefillTableProps {
  refills: Refill[];
  units: string;
  preferredCurrency: string;
  dateFormat: string;
  editingId: string | null;
  formData: any;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: (refill: Refill) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

export function RefillTable({ refills, units, preferredCurrency, dateFormat, editingId, formData, onFieldChange, onSubmit, onEdit, onDelete, onCancelEdit, isSubmitting }: RefillTableProps) {
  const { t } = useTranslation();

  return (
    <table className="w-full table-fixed">
      <thead>
        <tr className="border-b border-slate-700">
          <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.odometer')}<br/>({getDistanceUnit(units)})</th>
          <th className="text-right p-4 text-slate-400 font-semibold w-24">{t('refills.volume')}<br/>({getVolumeUnit(units)})</th>
          <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.pricePerUnit')}<br/>({preferredCurrency})</th>
          <th className="text-right p-4 text-slate-400 font-semibold w-32">{t('refills.total')}<br/>({preferredCurrency})</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-24">{t('vehicles.fuelType')}</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-24">{t('refills.drivingType')}</th>
          <th className="text-left p-4 text-slate-400 font-semibold">{t('refills.station')}</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-48">{t('refills.date')}</th>
          <th className="text-center p-4 text-slate-400 font-semibold w-16">📷</th>
          <th className="text-left p-4 text-slate-400 font-semibold w-16"></th>
        </tr>
      </thead>
      <tbody>
        {refills.map(r => (
          <React.Fragment key={r.refillId}>
            <tr className="border-b border-slate-800 hover:bg-slate-800">
              <td className="p-4 text-white font-mono text-right">{Math.round(convertDistance(r.odometer, units))}</td>
              <td className="p-4 text-white font-mono text-right">{convertVolume(r.volume, units).toFixed(2)}</td>
              <td className="p-4 text-white font-mono text-right">{formatWithBaseAmount(r.pricePerUnit, r.currency, r.pricePerUnit / (r.exchangeRate || 1), preferredCurrency)}</td>
              <td className="p-4 text-white font-mono text-right">{formatWithBaseAmount(r.totalCost, r.currency, r.baseAmount, preferredCurrency)}</td>
              <td className="p-4 text-white">{r.fuelType}</td>
              <td className="p-4 text-white">{r.drivingType ? t(`refills.${r.drivingType}`) : ''}</td>
              <td className="p-4 text-white">{r.station || r.comment}</td>
              <td className="p-4 text-white font-mono">{formatDate(r.timestamp || r.createdAt, dateFormat)}</td>
              <td className="p-4 text-center">
                {(r.odometerImageKey || r.pumpImageKey || r.receiptImageKey) && (
                  <Camera className="h-4 w-4 text-indigo-400 mx-auto" />
                )}
              </td>
              <td className="p-4 text-white">
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <MoreVertical className="h-5 w-5 text-slate-400" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-[100]">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => onEdit(r)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <Pencil className="h-4 w-4" />
                          {t('common.edit')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => onDelete(r.refillId)} className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </td>
            </tr>
            {editingId === r.refillId && (
              <tr>
                <td colSpan={10} className="p-0">
                  <div className="bg-slate-750 p-6 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">{t('refills.edit')}</h3>
                    <RefillForm 
                      formData={formData}
                      onFieldChange={onFieldChange}
                      onFormDataChange={() => {}}
                      onSubmit={onSubmit}
                      onCancel={onCancelEdit}
                      isSubmitting={isSubmitting}
                      isEditing={true}
                    />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
