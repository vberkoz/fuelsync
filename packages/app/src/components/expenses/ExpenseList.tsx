import { useRef, useEffect } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ExpenseForm from './ExpenseForm';
import { ExpenseCard } from './ExpenseItem';

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
}

interface ExpenseListProps {
  groupedExpenses: [string, Expense[]][];
  editingId: string | null;
  formData: any;
  categories: string[];
  preferredCurrency: string;
  units: string;
  dateFormat: string;
  isSubmitting: boolean;
  isFetchingNextPage: boolean;
  hasMoreMonths: boolean;
  hasNextPage: boolean;
  lastOdometer: number;
  vehicleId: string;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (data: any) => void;
  onCancelEdit: () => void;
  onScroll: () => void;
}

export default function ExpenseList({
  groupedExpenses,
  editingId,
  formData,
  categories,
  preferredCurrency,
  units,
  dateFormat,
  isSubmitting,
  isFetchingNextPage,
  hasMoreMonths,
  hasNextPage,
  lastOdometer,
  vehicleId,
  onEdit,
  onDelete,
  onSubmit,
  onFormChange,
  onCancelEdit,
  onScroll
}: ExpenseListProps) {
  const { t, i18n } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8) {
        onScroll();
      }
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  if (groupedExpenses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>{t('expenses.noExpenses')}</p>
      </div>
    );
  }

  return (
    <>
      {groupedExpenses.map(([month, monthExpenses]) => (
        <div key={month} className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 capitalize">
            {new Date(month + '-01').toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }).replace(' р.', '')}
          </h2>
          <div className="grid gap-4">
            {monthExpenses.map((e: Expense) => (
              <React.Fragment key={e.expenseId}>
                <ExpenseCard
                  expense={e}
                  preferredCurrency={preferredCurrency}
                  units={units}
                  dateFormat={dateFormat}
                  vehicleId={vehicleId}
                  onEdit={() => onEdit(e)}
                  onDelete={() => onDelete(e.expenseId)}
                />
                {editingId === e.expenseId && (
                  <ExpenseForm
                    formData={formData}
                    categories={categories}
                    isSubmitting={isSubmitting}
                    isEditing={true}
                    lastOdometer={lastOdometer}
                    onSubmit={onSubmit}
                    onChange={onFormChange}
                    onCancel={onCancelEdit}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
      {(hasMoreMonths || hasNextPage) && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>}
        </div>
      )}
    </>
  );
}
