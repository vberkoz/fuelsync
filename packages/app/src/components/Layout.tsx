import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { TruckIcon, BeakerIcon, BanknotesIcon, ChartBarIcon, BellIcon, XMarkIcon, Bars3Icon, Cog6ToothIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Listbox } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import { useVehicleStore } from '../stores/vehicleStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const navigation = [
  { name: 'navigation.refills', icon: BeakerIcon, href: '/' },
  { name: 'navigation.vehicles', icon: TruckIcon, href: '/vehicles' },
  { name: 'navigation.expenses', icon: BanknotesIcon, href: '/expenses' },
  { name: 'navigation.analytics', icon: ChartBarIcon, href: '/analytics' },
  { name: 'navigation.reminders', icon: BellIcon, href: '/reminders' },
]

interface LayoutProps {
  children: React.ReactNode
}

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  const location = useLocation()
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId)
  const setCurrentVehicleId = useVehicleStore((state) => state.setCurrentVehicle)

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const vehicles = vehiclesData?.vehicles || [];

  useEffect(() => {
    if (vehicles.length > 0) {
      const vehicleExists = vehicles.some((v: Vehicle) => v.vehicleId === currentVehicleId);
      if (!currentVehicleId || !vehicleExists) {
        setCurrentVehicleId(vehicles[0].vehicleId);
      }
    }
  }, [vehicles, currentVehicleId, setCurrentVehicleId]);

  useEffect(() => {
    const vehicle = vehicles.find((v: Vehicle) => v.vehicleId === currentVehicleId);
    setCurrentVehicle(vehicle || null);
  }, [currentVehicleId, vehicles]);

  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 transition-transform duration-300 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
          <Listbox value={currentVehicleId || undefined} onChange={setCurrentVehicleId}>
            <div className="relative flex items-center gap-3 w-full">
              <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              <Listbox.Button className="flex-1 flex items-center justify-between text-left">
                {currentVehicle ? (
                  <div className="text-xs text-slate-400">
                    <div className="font-semibold text-white">{currentVehicle.year} {currentVehicle.make}</div>
                    <div>{currentVehicle.model}</div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Select vehicle</div>
                )}
                <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
              </Listbox.Button>
              <Listbox.Options className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto z-50">
                {vehicles.map((v: Vehicle) => (
                  <Listbox.Option
                    key={v.vehicleId}
                    value={v.vehicleId}
                    className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-slate-700' : ''}`}
                  >
                    {({ selected }) => (
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <div className={selected ? 'font-semibold text-white' : 'text-white'}>{v.year} {v.make}</div>
                          <div className="text-xs text-slate-400">{v.model}</div>
                        </div>
                        {selected && <CheckIcon className="h-5 w-5 text-indigo-500" />}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800/50 ${
                location.pathname === item.href ? 'bg-slate-800/50' : ''
              }`}
            >
              <item.icon className="h-6 w-6" />
              {t(item.name)}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-700 p-3 space-y-1">
          <Link
            to="/settings"
            onClick={handleNavClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800/50 ${
              location.pathname === '/settings' ? 'bg-slate-800/50' : ''
            }`}
          >
            <Cog6ToothIcon className="h-6 w-6" />
            {t('navigation.settings')}
          </Link>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-white">FuelSync</span>
          <div className="w-6" />
        </div>
        {children}
      </main>
    </div>
  )
}
