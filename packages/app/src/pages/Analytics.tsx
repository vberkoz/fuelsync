import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Fuel, Receipt, DollarSign, TrendingUp, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';
import LineChart from '../components/LineChart';
import { formatCurrency } from '../lib/currency';
import { convertVolume, getVolumeUnit } from '../lib/units';
import { AIInsights } from '../components/AIInsights';
import { AIErrorBoundary } from '../components/AIErrorBoundary';

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  useEffect(() => {
    if (!currentVehicleId && vehiclesData?.vehicles?.length > 0) {
      setCurrentVehicle(vehiclesData.vehicles[0].vehicleId);
    }
  }, [currentVehicleId, vehiclesData, setCurrentVehicle]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics', currentVehicleId],
    queryFn: () => api.statistics.get(currentVehicleId!),
    enabled: !!currentVehicleId
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    staleTime: 0
  });

  const preferredCurrency = settingsData?.settings?.preferredCurrency || 'USD';
  const units = settingsData?.settings?.units || 'imperial';
  const volumeUnit = getVolumeUnit(units);

  // Convert USD to preferred currency (assuming 1 USD = 40 UAH for now)
  const convertCurrency = (usdAmount: number) => {
    if (preferredCurrency === 'UAH') {
      return usdAmount * 40; // TODO: Use actual exchange rate
    }
    return usdAmount;
  };

  const { data: chartsData } = useQuery({
    queryKey: ['charts', currentVehicleId],
    queryFn: () => api.charts.get(currentVehicleId!),
    enabled: !!currentVehicleId
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">{t('analytics.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <BarChart3 className="h-8 w-8 text-indigo-500" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('analytics.title')}</h1>
      </div>

      {currentVehicleId && (
        <div className="mb-6 sm:mb-8">
          <AIErrorBoundary>
            <AIInsights vehicleId={currentVehicleId} />
          </AIErrorBoundary>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 flex flex-col min-h-[280px]">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Fuel className="h-8 w-8 text-orange-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">{t('analytics.fuel')}</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <div className="text-slate-400 text-sm mb-1">{t('analytics.totalCost')}</div>
              <div className="text-white font-mono text-2xl sm:text-3xl">{formatCurrency(convertCurrency(stats?.refills.totalCost || 0), preferredCurrency)}</div>
            </div>
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.totalRefills')}</span>
                <span className="text-white font-mono">{stats?.refills.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.totalVolume')}</span>
                <span className="text-white font-mono">{convertVolume(stats?.refills.totalVolume || 0, units).toFixed(2)} {volumeUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.avgPricePerUnit')}</span>
                <span className="text-white font-mono">{formatCurrency(convertCurrency(stats?.refills.avgPricePerUnit || 0), preferredCurrency)}/{volumeUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.avgRefillCost')}</span>
                <span className="text-white font-mono">{formatCurrency(convertCurrency(stats?.refills.avgCost || 0), preferredCurrency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 flex flex-col min-h-[280px]">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Receipt className="h-8 w-8 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">{t('analytics.expenses')}</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <div className="text-slate-400 text-sm mb-1">{t('analytics.totalCost')}</div>
              <div className="text-white font-mono text-2xl sm:text-3xl">{formatCurrency(convertCurrency(stats?.expenses.totalCost || 0), preferredCurrency)}</div>
            </div>
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.totalExpenses')}</span>
                <span className="text-white font-mono">{stats?.expenses.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.avgExpense')}</span>
                <span className="text-white font-mono">{formatCurrency(convertCurrency(stats?.expenses.avgCost || 0), preferredCurrency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 flex flex-col min-h-[280px]">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Gauge className="h-8 w-8 text-purple-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">{t('analytics.efficiency')}</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <div className="text-slate-400 text-sm mb-1">{t('analytics.currentEfficiency')}</div>
              <div className="text-white font-mono text-2xl sm:text-3xl">
                {stats?.efficiency?.current ? 
                  units === 'metric' ? 
                    `${(100 / stats.efficiency.current).toFixed(1)} L/100km` : 
                    `${(stats.efficiency.current * 2.352).toFixed(1)} mpg` : 
                  'N/A'
                }
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.averageEfficiency')}</span>
                <span className="text-white font-mono">
                  {stats?.efficiency?.average ? 
                    units === 'metric' ? 
                      `${(100 / stats.efficiency.average).toFixed(1)} L/100km` : 
                      `${(stats.efficiency.average * 2.352).toFixed(1)} mpg` : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">{t('analytics.fullTankEfficiency')}</span>
                <span className="text-white font-mono">
                  {stats?.efficiency?.fullTankOnly ? 
                    units === 'metric' ? 
                      `${(100 / stats.efficiency.fullTankOnly).toFixed(1)} L/100km` : 
                      `${(stats.efficiency.fullTankOnly * 2.352).toFixed(1)} mpg` : 
                    'N/A'
                  }
                </span>
              </div>
              {(stats?.efficiency?.city || stats?.efficiency?.highway) && (
                <>
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="text-slate-400 text-xs mb-2">{t('analytics.byDrivingType')}</div>
                  </div>
                  {stats?.efficiency?.city && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">{t('refills.city')}</span>
                      <span className="text-white font-mono">
                        {units === 'metric' ? 
                          `${(100 / stats.efficiency.city).toFixed(1)} L/100km` : 
                          `${(stats.efficiency.city * 2.352).toFixed(1)} mpg`
                        }
                      </span>
                    </div>
                  )}
                  {stats?.efficiency?.highway && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">{t('refills.highway')}</span>
                      <span className="text-white font-mono">
                        {units === 'metric' ? 
                          `${(100 / stats.efficiency.highway).toFixed(1)} L/100km` : 
                          `${(stats.efficiency.highway * 2.352).toFixed(1)} mpg`
                        }
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 flex flex-col min-h-[280px]">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">{t('analytics.total')}</h2>
          </div>
          <div className="flex-1">
            <div className="text-slate-400 text-sm mb-1">{t('analytics.allCosts')}</div>
            <div className="text-white font-mono text-3xl sm:text-4xl">{formatCurrency(convertCurrency(stats?.totals.allCosts || 0), preferredCurrency)}</div>
          </div>
        </div>
      </div>

      {chartsData && (
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <Fuel className="h-6 w-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-white">{t('analytics.fuelConsumption')}</h2>
            </div>
            <div className="h-64 lg:h-80">
              <LineChart
                data={{
                  labels: chartsData.fuelConsumption.labels.map((label: string) => {
                    const date = new Date(label);
                    return date.toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', { month: 'short', year: 'numeric' });
                  }),
                  datasets: [{
                    label: `Volume (${volumeUnit})`,
                    data: chartsData.fuelConsumption.data.map((v: number) => convertVolume(v, units)),
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)'
                  }]
                }}
                yAxisLabel={volumeUnit}
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-semibold text-white">{t('analytics.costs')}</h2>
            </div>
            <div className="h-64 lg:h-80">
              <LineChart
                data={{
                  labels: chartsData.costs.labels.map((label: string) => {
                    const date = new Date(label);
                    return date.toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', { month: 'short', year: 'numeric' });
                  }),
                  datasets: [
                    {
                      label: t('analytics.fuel'),
                      data: chartsData.costs.fuel.map((v: number) => convertCurrency(v)),
                      borderColor: 'rgb(249, 115, 22)',
                      backgroundColor: 'rgba(249, 115, 22, 0.1)'
                    },
                    {
                      label: t('analytics.expenses'),
                      data: chartsData.costs.expenses.map((v: number) => convertCurrency(v)),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    }
                  ]
                }}
                yAxisLabel={formatCurrency(0, preferredCurrency).replace('0.00', '').trim()}
                yAxisLabelPosition="before"
              />
            </div>
          </div>

          {chartsData.efficiency && chartsData.efficiency.data.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <Gauge className="h-6 w-6 text-purple-500" />
                <h2 className="text-lg font-semibold text-white">{t('analytics.efficiencyTrend')}</h2>
              </div>
              <div className="h-64 lg:h-80">
                <LineChart
                  data={{
                    labels: chartsData.efficiency.labels,
                    datasets: [{
                      label: t('analytics.overall'),
                      data: chartsData.efficiency.data.map((v: number) => units === 'metric' ? 100 / v : v * 2.352),
                      borderColor: 'rgb(147, 51, 234)',
                      backgroundColor: 'rgba(147, 51, 234, 0.1)'
                    }]
                  }}
                  yAxisLabel={units === 'metric' ? 'L/100km' : 'mpg'}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
