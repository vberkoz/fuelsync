import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useVehicleStore } from '../stores/vehicleStore';
import type { Vehicle } from '../types';

export function useVehicleMutations() {
  const queryClient = useQueryClient();
  const setCurrentVehicle = useVehicleStore((state) => state.setCurrentVehicle);
  const currentVehicleId = useVehicleStore((state) => state.currentVehicleId);

  const createMutation = useMutation({
    mutationFn: api.vehicles.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.vehicles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.vehicles.delete,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.removeQueries({ queryKey: ['refills', id] });
      queryClient.removeQueries({ queryKey: ['expenses', id] });
    }
  });

  const handleDelete = (id: string, vehicles: Vehicle[]) => {
    if (id === currentVehicleId && vehicles.length > 1) {
      const nextVehicle = vehicles.find((v: Vehicle) => v.vehicleId !== id);
      if (nextVehicle) setCurrentVehicle(nextVehicle.vehicleId);
    }
    deleteMutation.mutate(id);
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    handleDelete,
  };
}
