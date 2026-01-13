import { useRef } from 'react';
import { api } from '../lib/api';
import { exportToCSV, parseCSV } from '../lib/csv';

export function useRefillImportExport(
  activeVehicleId: string | null | undefined,
  currentVehicle: any,
  createMutation: any
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const allRefills = [];
    let nextToken: string | undefined = undefined;
    
    do {
      const result = await api.refills.list(activeVehicleId!, nextToken);
      allRefills.push(...(result?.refills || []));
      nextToken = result?.nextToken;
    } while (nextToken);
    
    const csvData = allRefills.map((r: any) => ({
      date: new Date(r.timestamp || r.createdAt).toISOString(),
      vehicleYear: currentVehicle?.vehicle?.year || '',
      vehicleMake: currentVehicle?.vehicle?.make || '',
      vehicleModel: currentVehicle?.vehicle?.model || '',
      odometer: r.odometer,
      volume: r.volume,
      pricePerUnit: r.pricePerUnit,
      totalCost: r.totalCost,
      currency: r.currency,
      fuelType: r.fuelType,
      station: r.station || ''
    }));
    exportToCSV(csvData, 'refills.csv');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = parseCSV(text);
    
    const allRefills = [];
    let nextToken: string | undefined = undefined;
    do {
      const result = await api.refills.list(activeVehicleId!, nextToken);
      allRefills.push(...(result?.refills || []));
      nextToken = result?.nextToken;
    } while (nextToken);
    
    const existingDates = new Set(allRefills.map((r: any) => 
      new Date(r.timestamp || r.createdAt).toISOString().split('T')[0]
    ));
    
    for (const row of data) {
      const importDate = new Date(row.date).toISOString().split('T')[0];
      if (existingDates.has(importDate)) continue;
      
      await createMutation.mutateAsync({
        odometer: parseFloat(row.odometer),
        volume: parseFloat(row.volume),
        pricePerUnit: parseFloat(row.pricePerUnit),
        totalCost: parseFloat(row.totalCost),
        currency: row.currency,
        fuelType: row.fuelType,
        station: row.station,
        timestamp: new Date(row.date).getTime()
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return {
    fileInputRef,
    handleExport,
    handleImport
  };
}
