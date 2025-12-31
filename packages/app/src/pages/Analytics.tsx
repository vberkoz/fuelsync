import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, CurrencyDollarIcon, FireIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';
import LineChart from '../components/LineChart';

export default function Analytics() {
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
          <p className="mt-4 text-slate-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch mb-8">
        <div className="bg-slate-800 rounded-lg p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <FireIcon className="h-8 w-8 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Fuel</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <div className="text-slate-400 text-sm mb-1">Total Cost</div>
              <div className="text-white font-mono text-3xl">{(stats?.refills.totalCost || 0).toFixed(2)} <span className="text-xl text-slate-400">UAH</span></div>
            </div>
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Refills</span>
                <span className="text-white font-mono">{stats?.refills.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Volume</span>
                <span className="text-white font-mono">{(stats?.refills.totalVolume || 0).toFixed(2)} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Avg Price/Unit</span>
                <span className="text-white font-mono">{(stats?.refills.avgPricePerUnit || 0).toFixed(2)} UAH/L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Avg Refill Cost</span>
                <span className="text-white font-mono">{(stats?.refills.avgCost || 0).toFixed(2)} UAH</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Expenses</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <div className="text-slate-400 text-sm mb-1">Total Cost</div>
              <div className="text-white font-mono text-3xl">{(stats?.expenses.totalCost || 0).toFixed(2)} <span className="text-xl text-slate-400">UAH</span></div>
            </div>
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Expenses</span>
                <span className="text-white font-mono">{stats?.expenses.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Avg Expense</span>
                <span className="text-white font-mono">{(stats?.expenses.avgCost || 0).toFixed(2)} UAH</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Total</h2>
          </div>
          <div className="flex-1">
            <div className="text-slate-400 text-sm mb-1">All Costs</div>
            <div className="text-white font-mono text-4xl">{(stats?.totals.allCosts || 0).toFixed(2)} <span className="text-2xl text-slate-400">UAH</span></div>
          </div>
        </div>
      </div>

      {chartsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <FireIcon className="h-6 w-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-white">Fuel Consumption</h2>
            </div>
            <div className="h-64">
              <LineChart
                data={{
                  labels: chartsData.fuelConsumption.labels,
                  datasets: [{
                    label: 'Volume (L)',
                    data: chartsData.fuelConsumption.data,
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)'
                  }]
                }}
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-semibold text-white">Costs</h2>
            </div>
            <div className="h-64">
              <LineChart
                data={{
                  labels: chartsData.costs.labels,
                  datasets: [
                    {
                      label: 'Fuel',
                      data: chartsData.costs.fuel,
                      borderColor: 'rgb(249, 115, 22)',
                      backgroundColor: 'rgba(249, 115, 22, 0.1)'
                    },
                    {
                      label: 'Expenses',
                      data: chartsData.costs.expenses,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    }
                  ]
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
