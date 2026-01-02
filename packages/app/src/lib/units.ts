// Conversion constants
const KM_TO_MILES = 0.621371;
const LITERS_TO_GALLONS = 0.264172;

export function convertDistance(km: number, units: string): number {
  return units === 'imperial' ? km * KM_TO_MILES : km;
}

export function convertVolume(liters: number, units: string): number {
  return units === 'imperial' ? liters * LITERS_TO_GALLONS : liters;
}

export function getDistanceUnit(units: string): string {
  return units === 'imperial' ? 'mi' : 'km';
}

export function getVolumeUnit(units: string): string {
  return units === 'imperial' ? 'gal' : 'L';
}
