import { useState } from 'react';
import { Car } from 'lucide-react';
import { getVehicleLogoPath } from '../lib/vehicleLogos';

interface VehicleLogoProps {
  make: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export function VehicleLogo({ make, size = 'md', className = '' }: VehicleLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Car className={`${iconSizeClasses[size]} text-slate-400 ${className}`} />;
  }

  return (
    <img
      src={getVehicleLogoPath(make)}
      alt={make}
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
