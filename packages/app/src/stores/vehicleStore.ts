import { create } from 'zustand';

interface VehicleState {
  currentVehicleId: string | null;
  setCurrentVehicle: (vehicleId: string) => void;
  clearCurrentVehicle: () => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  currentVehicleId: localStorage.getItem('currentVehicleId'),
  
  setCurrentVehicle: (vehicleId) => {
    localStorage.setItem('currentVehicleId', vehicleId);
    set({ currentVehicleId: vehicleId });
    window.dispatchEvent(new Event('currentVehicleChanged'));
  },
  
  clearCurrentVehicle: () => {
    localStorage.removeItem('currentVehicleId');
    set({ currentVehicleId: null });
  }
}));
