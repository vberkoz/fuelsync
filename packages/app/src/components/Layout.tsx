import { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Car, Fuel, Receipt, BarChart3, Bell, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useVehicleStore } from '../stores/vehicleStore'
import { useReminderStore } from '../stores/reminderStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import ReminderDialog from './ReminderDialog'
import VehicleSelector from './VehicleSelector'

const navigation = [
  { name: 'navigation.refills', icon: Fuel, href: '/' },
  { name: 'navigation.vehicles', icon: Car, href: '/vehicles' },
  { name: 'navigation.expenses', icon: Receipt, href: '/expenses' },
  { name: 'navigation.analytics', icon: BarChart3, href: '/analytics' },
  { name: 'navigation.reminders', icon: Bell, href: '/reminders' },
]

interface LayoutProps {
  children: React.ReactNode
}

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  odometer?: number;
}

const customSlugs: Record<string, string> = {
  'ABT': 'abt-sportsline',
  'AMC': 'american-motors',
  'Atalanta': 'atalanta-motors',
  'BAIC Motor': 'baic',
  'Chevrolet Corvette': 'corvette',
  'Citroën': 'citroen',
  'DMC': 'delorean',
  'Force Motors': 'force',
  'Hindustan Motors': 'hindustan',
  'IKCO': 'iran-khodro',
  'JMC': 'jiangling',
  'LEVC': 'london-ev-company',
  'Li Auto': 'lixiang',
  'Lynk & Co': 'lynkco',
  'SAIC Motor': 'saic',
  'Tauro': 'tauro-sport-auto',
  'Zarooq Motors': 'zarooq',
  'Zinoro': 'zhinuo',
  'Škoda': 'skoda'
};

function getVehicleLogo(make: string) {
  const slug = customSlugs[make] || make.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `/logos/${slug}.png`;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [logoError, setLogoError] = useState<Set<string>>(new Set())
  const location = useLocation()
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId)
  const setCurrentVehicleId = useVehicleStore((state) => state.setCurrentVehicle)
  const { setReminders, getOverdueReminders, hasOverdueReminders } = useReminderStore()

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const { data: remindersData } = useQuery({
    queryKey: ['reminders'],
    queryFn: api.reminders.list,
    retry: false,
    throwOnError: false
  });

  const { data: refillsData } = useQuery({
    queryKey: ['refills', currentVehicleId],
    queryFn: () => currentVehicleId ? api.refills.list(currentVehicleId) : Promise.resolve({ refills: [] }),
    enabled: !!currentVehicleId
  });

  const vehicles = vehiclesData?.vehicles || [];

  useEffect(() => {
    if (remindersData?.reminders) {
      setReminders(remindersData.reminders);
    }
  }, [remindersData, setReminders]);

  useEffect(() => {
    if (currentVehicle && currentVehicle.odometer) {
      const overdueReminders = getOverdueReminders(currentVehicle.vehicleId, currentVehicle.odometer);
      if (overdueReminders.length > 0) {
        setShowReminderDialog(true);
      }
    }
  }, [currentVehicle, getOverdueReminders]);

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
    // Handle both regular and infinite query formats
    const refills = refillsData?.refills || refillsData?.pages?.[0]?.refills || [];
    const latestRefill = refills[0];
    const vehicleWithOdometer = vehicle ? {
      ...vehicle,
      odometer: latestRefill?.odometer
    } : null;
    setCurrentVehicle(vehicleWithOdometer);
  }, [currentVehicleId, vehicles, refillsData]);

  const handleLogoError = useCallback((make: string) => {
    setLogoError(prev => new Set(prev).add(make));
  }, []);

  const handleNavClick = () => {
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 flex-col bg-slate-900/95 backdrop-blur-sm border-r border-slate-700">
        <div className="flex h-16 items-center px-3 border-b border-slate-700">
          <VehicleSelector
            vehicles={vehicles}
            currentVehicleId={currentVehicleId}
            onVehicleChange={setCurrentVehicleId}
            logoError={logoError}
            onLogoError={handleLogoError}
            getVehicleLogo={getVehicleLogo}
          />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isReminders = item.href === '/reminders';
            const hasOverdue = isReminders && currentVehicle?.odometer && hasOverdueReminders(currentVehicle.vehicleId, currentVehicle.odometer);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  location.pathname === item.href ? 'bg-slate-800/50' : ''
                }`}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" />
                  {hasOverdue && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                  )}
                </div>
                {t(item.name)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-3">
          <Link
            to="/settings"
            onClick={handleNavClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              location.pathname === '/settings' ? 'bg-slate-800/50' : ''
            }`}
          >
            <Settings className="h-6 w-6" />
            {t('navigation.settings')}
          </Link>
        </div>
      </div>

      <main className="flex-1 overflow-auto pb-28 lg:pb-0 overflow-x-visible">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm px-4 lg:hidden">
          <div className="flex-1">
            <VehicleSelector
              vehicles={vehicles}
              currentVehicleId={currentVehicleId}
              onVehicleChange={setCurrentVehicleId}
              logoError={logoError}
              onLogoError={handleLogoError}
              getVehicleLogo={getVehicleLogo}
            />
          </div>
          <Link to="/settings" className="p-2 rounded-lg hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Settings className={`h-6 w-6 ${location.pathname === '/settings' ? 'text-indigo-400' : 'text-slate-400'}`} />
          </Link>
        </div>
        {children}
      </main>

      {/* Bottom Navigation for Mobile/Tablet */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center h-20 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 pb-safe lg:hidden" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const isReminders = item.href === '/reminders';
          const hasOverdue = isReminders && currentVehicle?.odometer && hasOverdueReminders(currentVehicle.vehicleId, currentVehicle.odometer);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`flex flex-col items-center justify-center flex-1 h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {hasOverdue && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </div>
              <span className="text-xs mt-1">{t(item.name).split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

      {currentVehicle?.odometer && (
        <ReminderDialog
          isOpen={showReminderDialog}
          onClose={() => setShowReminderDialog(false)}
          reminders={getOverdueReminders(currentVehicle.vehicleId, currentVehicle.odometer)}
          currentOdometer={currentVehicle.odometer}
        />
      )}
    </div>
  )
}
