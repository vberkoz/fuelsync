import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProfileMenu() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="text-gray-400 hover:text-white">
        <UserCircleIcon className="h-6 w-6" />
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
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-slate-800 border border-slate-700 rounded-lg shadow-lg focus:outline-none">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate('/profile')}
                  className={`${
                    active ? 'bg-slate-700' : ''
                  } group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-300`}
                >
                  <UserCircleIcon className="mr-3 h-5 w-5" />
                  Profile
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate('/settings')}
                  className={`${
                    active ? 'bg-slate-700' : ''
                  } group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-300`}
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5" />
                  Settings
                </button>
              )}
            </Menu.Item>

            <div className="my-1 h-px bg-slate-700" />

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
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
  );
}
