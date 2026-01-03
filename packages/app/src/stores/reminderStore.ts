import { create } from 'zustand';

export interface Reminder {
  reminderId: string;
  vehicleId: string;
  title: string;
  type: string;
  threshold: number;
  unit: string;
  createdAt: string;
}

interface ReminderState {
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
  getOverdueReminders: (vehicleId: string, currentOdometer: number) => Reminder[];
  hasOverdueReminders: (vehicleId: string, currentOdometer: number) => boolean;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],

  setReminders: (reminders) => set({ reminders }),

  getOverdueReminders: (vehicleId, currentOdometer) => {
    return get().reminders.filter(
      r => r.vehicleId === vehicleId && 
           r.unit === 'km' && 
           currentOdometer >= r.threshold
    );
  },

  hasOverdueReminders: (vehicleId, currentOdometer) => {
    return get().getOverdueReminders(vehicleId, currentOdometer).length > 0;
  }
}));
