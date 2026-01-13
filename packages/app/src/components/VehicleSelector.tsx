import { Listbox } from '@headlessui/react';
import { Car, ChevronsUpDown, Check } from 'lucide-react';

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
}

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  currentVehicleId: string | null;
  onVehicleChange: (vehicleId: string) => void;
  logoError: Set<string>;
  onLogoError: (make: string) => void;
  getVehicleLogo: (make: string) => string;
}

export default function VehicleSelector({
  vehicles,
  currentVehicleId,
  onVehicleChange,
  logoError,
  onLogoError,
  getVehicleLogo
}: VehicleSelectorProps) {
  const currentVehicle = vehicles.find(v => v.vehicleId === currentVehicleId);

  return (
    <Listbox value={currentVehicleId || undefined} onChange={onVehicleChange}>
      <div className="relative w-full">
        <Listbox.Button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {currentVehicle && (
            logoError.has(currentVehicle.make) ? (
              <Car className="h-6 w-6 text-slate-400" />
            ) : (
              <img 
                src={getVehicleLogo(currentVehicle.make)} 
                alt={currentVehicle.make} 
                className="h-6 w-6 object-contain" 
                onError={() => onLogoError(currentVehicle.make)} 
              />
            )
          )}
          {currentVehicle ? (
            <div className="text-sm text-white">
              {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
            </div>
          ) : (
            <div className="text-sm text-slate-400">Select vehicle</div>
          )}
          <ChevronsUpDown className="h-5 w-5 text-slate-400 ml-auto" />
        </Listbox.Button>
        <Listbox.Options className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {vehicles.map((v: Vehicle) => (
            <Listbox.Option
              key={v.vehicleId}
              value={v.vehicleId}
              className={({ active }) => `cursor-pointer px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${active ? 'bg-slate-700' : ''}`}
            >
              {({ selected }) => (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {logoError.has(v.make) ? (
                      <Car className="h-5 w-5 text-slate-400" />
                    ) : (
                      <img 
                        src={getVehicleLogo(v.make)} 
                        alt={v.make} 
                        className="h-5 w-5 object-contain" 
                        onError={() => onLogoError(v.make)} 
                      />
                    )}
                    <div className="text-sm">
                      <div className={selected ? 'font-semibold text-white' : 'text-white'}>
                        {v.year} {v.make}
                      </div>
                      <div className="text-xs text-slate-400">{v.model}</div>
                    </div>
                  </div>
                  {selected && <Check className="h-5 w-5 text-indigo-500" />}
                </div>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
}
