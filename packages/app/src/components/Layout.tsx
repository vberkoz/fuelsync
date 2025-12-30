import { useState, Fragment, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { HomeIcon, TruckIcon, BeakerIcon, BanknotesIcon, ChartBarIcon, BellIcon, XMarkIcon, Bars3Icon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Menu, Transition, Listbox } from '@headlessui/react'
import ProfileMenu from './ProfileMenu'
import { useAuthStore } from '../stores/authStore'
import { useVehicleStore } from '../stores/vehicleStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const navigation = [
  { name: 'Dashboard', icon: HomeIcon, href: '/' },
  { name: 'Vehicles', icon: TruckIcon, href: '/vehicles' },
  { name: 'Refills', icon: BeakerIcon, href: '/refills' },
  { name: 'Expenses', icon: BanknotesIcon, href: '/expenses' },
  { name: 'Analytics', icon: ChartBarIcon, href: '/analytics' },
  { name: 'Reminders', icon: BellIcon, href: '/reminders' },
]

const teams = [
  { name: 'My Vehicles', initial: 'M' },
  { name: 'Family Cars', initial: 'F' },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  const location = useLocation()
  const userEmail = useAuthStore((state) => state.userEmail)
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId)
  const setCurrentVehicleId = useVehicleStore((state) => state.setCurrentVehicle)
  const idToken = useAuthStore((state) => state.idToken)

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.vehicles.list
  });

  const vehicles = vehiclesData?.vehicles || [];

  useEffect(() => {
    const vehicle = vehicles.find(v => v.vehicleId === currentVehicleId);
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
        <div className="flex h-16 items-center justify-between px-6">
          <Listbox value={currentVehicleId} onChange={setCurrentVehicleId}>
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
                {vehicles.map((v) => (
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

        <nav className="flex-1 space-y-1 px-3">
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
              {item.name}
            </Link>
          ))}

          <div className="pt-8">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Vehicle Groups
            </p>
            <div className="mt-3 space-y-1">
              {teams.map((team) => (
                <a
                  key={team.name}
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-slate-800/50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-medium text-gray-400">
                    {team.initial}
                  </span>
                  {team.name}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-700 p-4">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-slate-800/50 transition-colors">
              <UserCircleIcon className="h-10 w-10 text-slate-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{userEmail}</p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute bottom-full left-0 right-0 mb-2 origin-bottom bg-slate-800 border border-slate-700 rounded-lg shadow-lg focus:outline-none">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`${
                          active ? 'bg-slate-700' : ''
                        } group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-300`}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5" />
                        Profile
                      </Link>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`${
                          active ? 'bg-slate-700' : ''
                        } group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-300`}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>

                  <div className="my-1 h-px bg-slate-700" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          useAuthStore.getState().clearAuth();
                          window.location.href = '/login';
                        }}
                        className={`${
                          active ? 'bg-slate-700' : ''
                        } group flex w-full items-center rounded-md px-3 py-2 text-sm text-red-400`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
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
          <Listbox value={currentVehicleId} onChange={setCurrentVehicleId}>
            <div className="relative">
              <Listbox.Button className="flex items-center gap-2">
                {currentVehicle ? (
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white">{currentVehicle.year} {currentVehicle.make}</div>
                    <div className="text-xs text-slate-400">{currentVehicle.model}</div>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-white">Dashboard</span>
                )}
                <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
              </Listbox.Button>
              <Listbox.Options className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto z-50">
                {vehicles.map((v) => (
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
          <ProfileMenu />
        </div>
        {children}
      </main>
    </div>
  )
}
