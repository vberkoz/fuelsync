import { getExchangeRate } from './exchange-rate';

export const convertToTargetCurrency = async (
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  timestamp: number
): Promise<number> => {
  if (sourceCurrency === targetCurrency) return amount;

  const date = new Date(timestamp).toISOString().split('T')[0];

  // Rates are stored as: 1 USD = X currency
  // So UAH rate of 40 means: 1 USD = 40 UAH
  
  if (sourceCurrency === 'USD') {
    // USD -> target: multiply by target rate
    const targetRate = await getExchangeRate(targetCurrency, date);
    return amount * targetRate;
  } else if (targetCurrency === 'USD') {
    // source -> USD: divide by source rate
    const sourceRate = await getExchangeRate(sourceCurrency, date);
    return amount / sourceRate;
  } else {
    // source -> USD -> target
    const sourceRate = await getExchangeRate(sourceCurrency, date);
    const targetRate = await getExchangeRate(targetCurrency, date);
    const usdAmount = amount / sourceRate;
    return usdAmount * targetRate;
  }
};

export const convertVolume = (volume: number, toGallons: boolean): number => {
  return toGallons ? volume * 0.264172 : volume;
};
