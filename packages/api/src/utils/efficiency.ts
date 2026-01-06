interface Refill {
  odometer: number;
  volume: number;
  isFull: boolean;
  timestamp: number;
  drivingType?: 'city' | 'highway' | 'mixed';
}

export interface EfficiencyMetrics {
  current: number | null;
  average: number | null;
  fullTankOnly: number | null;
  city: number | null;
  highway: number | null;
  trend: number[];
  cityTrend: number[];
  highwayTrend: number[];
  mixedTrend: number[];
}

export function calculateEfficiency(refills: Refill[]): EfficiencyMetrics {
  if (refills.length < 2) {
    return { current: null, average: null, fullTankOnly: null, city: null, highway: null, trend: [], cityTrend: [], highwayTrend: [], mixedTrend: [] };
  }

  const sorted = refills.sort((a, b) => a.timestamp - b.timestamp);
  
  // Running average (last 10 refills)
  const recent = sorted.slice(-10);
  const totalDistance = recent[recent.length - 1].odometer - recent[0].odometer;
  const totalFuel = recent.slice(1).reduce((sum, r) => sum + r.volume, 0); // Exclude first refill
  const average = totalDistance > 0 && totalFuel > 0 ? totalDistance / totalFuel : null;

  // Current efficiency (last 2 refills)
  const lastTwo = sorted.slice(-2);
  const currentDistance = lastTwo[1].odometer - lastTwo[0].odometer;
  const currentFuel = lastTwo[1].volume;
  const current = currentDistance > 0 && currentFuel > 0 ? currentDistance / currentFuel : null;

  // Full tank only efficiency
  const fullTanks = sorted.filter(r => r.isFull);
  let fullTankOnly = null;
  if (fullTanks.length >= 2) {
    const fullDistance = fullTanks[fullTanks.length - 1].odometer - fullTanks[0].odometer;
    const fullFuel = fullTanks.slice(1).reduce((sum, r) => sum + r.volume, 0);
    fullTankOnly = fullDistance > 0 && fullFuel > 0 ? fullDistance / fullFuel : null;
  }

  // Trend (efficiency over time)
  const trend: number[] = [];
  for (let i = 5; i < sorted.length; i++) {
    const segment = sorted.slice(i - 4, i + 1);
    const segmentDistance = segment[segment.length - 1].odometer - segment[0].odometer;
    const segmentFuel = segment.slice(1).reduce((sum, r) => sum + r.volume, 0);
    if (segmentDistance > 0 && segmentFuel > 0) {
      trend.push(segmentDistance / segmentFuel);
    }
  }

  // City/Highway efficiency
  const cityRefills = sorted.filter(r => r.drivingType === 'city');
  const highwayRefills = sorted.filter(r => r.drivingType === 'highway');
  
  let city = null;
  let highway = null;
  
  if (cityRefills.length >= 2) {
    const cityDistance = cityRefills[cityRefills.length - 1].odometer - cityRefills[0].odometer;
    const cityFuel = cityRefills.slice(1).reduce((sum, r) => sum + r.volume, 0); // Correctly excludes first refill
    city = cityDistance > 0 && cityFuel > 0 ? cityDistance / cityFuel : null;
  }
  
  if (highwayRefills.length >= 2) {
    const highwayDistance = highwayRefills[highwayRefills.length - 1].odometer - highwayRefills[0].odometer;
    const highwayFuel = highwayRefills.slice(1).reduce((sum, r) => sum + r.volume, 0); // Correctly excludes first refill
    highway = highwayDistance > 0 && highwayFuel > 0 ? highwayDistance / highwayFuel : null;
  }

  // Trend by driving type
  const cityTrend: number[] = [];
  const highwayTrend: number[] = [];
  const mixedTrend: number[] = [];
  
  for (let i = 5; i < sorted.length; i++) {
    const segment = sorted.slice(i - 4, i + 1);
    const segmentDistance = segment[segment.length - 1].odometer - segment[0].odometer;
    const segmentFuel = segment.slice(1).reduce((sum, r) => sum + r.volume, 0);
    
    if (segmentDistance > 0 && segmentFuel > 0) {
      const segmentEfficiency = segmentDistance / segmentFuel;
      const drivingType = segment[segment.length - 1].drivingType;
      
      if (drivingType === 'city') {
        cityTrend.push(segmentEfficiency);
      } else if (drivingType === 'highway') {
        highwayTrend.push(segmentEfficiency);
      } else if (drivingType === 'mixed') {
        mixedTrend.push(segmentEfficiency);
      }
    }
  }

  return { current, average, fullTankOnly, city, highway, trend, cityTrend, highwayTrend, mixedTrend };
}