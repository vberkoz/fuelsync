import { HomeIcon, TruckIcon, BeakerIcon, BanknotesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard.get
  });

  const vehicleCount = data?.vehicleCount || 0;
  const recentRefills = data?.recentRefills || [];
  const recentExpenses = data?.recentExpenses || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <HomeIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('dashboard.title')}</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('dashboard.loading')}</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button onClick={() => navigate('/vehicles')} className="bg-indigo-600 hover:bg-indigo-700 p-4 rounded-lg flex items-center gap-3 transition-colors">
              <PlusIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">{t('dashboard.addVehicle')}</span>
            </button>
            <button onClick={() => navigate('/refills')} className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg flex items-center gap-3 transition-colors">
              <PlusIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">{t('dashboard.addRefill')}</span>
            </button>
            <button onClick={() => navigate('/expenses')} className="bg-green-600 hover:bg-green-700 p-4 rounded-lg flex items-center gap-3 transition-colors">
              <PlusIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">{t('dashboard.addExpense')}</span>
            </button>
            <button onClick={() => navigate('/analytics')} className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg flex items-center gap-3 transition-colors">
              <span className="text-white font-semibold">{t('dashboard.viewAnalytics')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Link to="/vehicles" className="bg-slate-800 p-6 rounded-lg hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <TruckIcon className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="text-slate-400 text-sm">{t('dashboard.vehicles')}</p>
                  <p className="text-3xl font-bold text-white font-mono">{vehicleCount}</p>
                </div>
              </div>
            </Link>

            <Link to="/refills" className="bg-slate-800 p-6 rounded-lg hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <BeakerIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-slate-400 text-sm">{t('dashboard.recentRefills')}</p>
                  <p className="text-3xl font-bold text-white font-mono">{recentRefills.length}</p>
                </div>
              </div>
            </Link>

            <Link to="/expenses" className="bg-slate-800 p-6 rounded-lg hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <BanknotesIcon className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-slate-400 text-sm">{t('dashboard.recentExpenses')}</p>
                  <p className="text-3xl font-bold text-white font-mono">{recentExpenses.length}</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">{t('dashboard.recentRefills')}</h2>
              {recentRefills.length === 0 ? (
                <p className="text-slate-400 text-center py-8">{t('dashboard.noRefills')}</p>
              ) : (
                <div className="space-y-3">
                  {recentRefills.map((refill: any) => (
                    <div key={refill.refillId} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-white font-semibold">{refill.vehicleName || 'Vehicle'}</p>
                        <p className="text-slate-400 text-sm font-mono">{new Date(refill.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono">{refill.volume?.toFixed(2)} L</p>
                        <p className="text-slate-400 text-sm font-mono">{refill.totalCost?.toFixed(2)} UAH</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">{t('dashboard.recentExpenses')}</h2>
              {recentExpenses.length === 0 ? (
                <p className="text-slate-400 text-center py-8">{t('dashboard.noExpenses')}</p>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense: any) => (
                    <div key={expense.expenseId} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-white font-semibold">{expense.category}</p>
                        <p className="text-slate-400 text-sm font-mono">{new Date(expense.timestamp).toLocaleDateString()}</p>
                      </div>
                      <p className="text-white font-mono">{expense.amount?.toFixed(2)} UAH</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
