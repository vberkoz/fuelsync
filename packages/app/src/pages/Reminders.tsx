import { BellIcon } from '@heroicons/react/24/outline';

export default function Reminders() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <BellIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Reminders</h1>
      </div>
    </div>
  )
}
