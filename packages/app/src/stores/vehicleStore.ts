import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VehicleState {
  currentVehicleId: string | null;
  setCurrentVehicle: (vehicleId: string) => void;
  clearCurrentVehicle: () => void;
}

export const useVehicleStore = create<VehicleState>()(persist(
  (set) => ({
    currentVehicleId: null,
    
    setCurrentVehicle: (vehicleId) => {
      set({ currentVehicleId: vehicleId });
      window.dispatchEvent(new Event('currentVehicleChanged'));
    },
    
    clearCurrentVehicle: () => {
      set({ currentVehicleId: null });
    }
  }),
  {
    name: 'vehicle-storage'
  }
));
