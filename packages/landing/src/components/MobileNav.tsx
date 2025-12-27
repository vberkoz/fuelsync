import { Dialog, DialogPanel } from '@headlessui/react';
import { useState } from 'react';
import Icon from './Icon';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden text-gray-300 hover:text-white p-2"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50 md:hidden">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-start justify-end">
          <DialogPanel className="w-full max-w-sm bg-slate-900 h-full p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="text-blue-500 text-2xl font-bold">
                <Icon name="squares" className="w-8 h-8" />
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white p-2" aria-label="Close menu">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col space-y-6 text-white text-lg">
              <a href="#" className="hover:text-blue-400">Features</a>
              <a href="#" className="hover:text-blue-400">Pricing</a>
              <a href="#" className="hover:text-blue-400">Docs</a>
              <a href="#" className="hover:text-blue-400">About</a>
              <hr className="border-slate-700" />
              <a href="#" className="hover:text-blue-400">Log in</a>
            </nav>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
