const extractPattern = (text: string, pattern: RegExp): number | string | null => {
  const match = text.match(pattern);
  if (!match) return null;
  const value = match[1];
  return isNaN(Number(value)) ? value : parseFloat(value);
};

export const parseOdometer = (text: string) => {
  const odometerRegex = /\b(\d{5,6})\b/g;
  const matches = text.match(odometerRegex);
  
  if (matches) {
    const value = parseInt(matches[0]);
    return {
      confidence: 0.9,
      values: { odometer: value }
    };
  }
  
  return { confidence: 0, values: {} };
};

export const parsePumpDisplay = (text: string) => {
  const patterns = {
    volume: /(\d+\.?\d*)\s*(gal|l|liter|галон|літр)/i,
    pricePerUnit: /(\d+\.?\d{2,3})\s*(\/gal|\/l|за літр)/i,
    totalCost: /total:?\s*\$?(\d+\.?\d{2})/i
  };
  
  return {
    confidence: 0.85,
    values: {
      volume: extractPattern(text, patterns.volume),
      pricePerUnit: extractPattern(text, patterns.pricePerUnit),
      totalCost: extractPattern(text, patterns.totalCost)
    }
  };
};

export const parseReceipt = (text: string) => {
  const patterns = {
    date: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    volume: /(\d+\.?\d*)\s*(gal|l)/i,
    total: /total:?\s*\$?(\d+\.?\d{2})/i,
    station: /^([A-Z\s&]+)$/m
  };
  
  return {
    confidence: 0.8,
    values: {
      date: extractPattern(text, patterns.date),
      volume: extractPattern(text, patterns.volume),
      totalCost: extractPattern(text, patterns.total),
      stationName: extractPattern(text, patterns.station)
    }
  };
};
