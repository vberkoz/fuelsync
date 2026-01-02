import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from './dynamodb';

const BASE_CURRENCY = 'USD';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

interface ExchangeRates {
  [currency: string]: number;
}

interface CachedRate {
  PK: string;
  SK: string;
  rates: ExchangeRates;
  lastUpdated: number;
}

export async function getExchangeRate(currency: string, date?: string): Promise<number> {
  if (currency === BASE_CURRENCY) return 1.0;

  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `EXCHANGE_RATE#${targetDate}`;

  try {
    const cached = await getCachedRates(cacheKey);
    if (cached && cached.rates[currency]) {
      return cached.rates[currency];
    }

    // Only fetch from API for today's date
    if (!date || targetDate === new Date().toISOString().split('T')[0]) {
      const rates = await fetchRatesFromAPI();
      await cacheRates(cacheKey, rates);
      return rates[currency] || 1.0;
    }

    // For historical dates, return 1.0 if not cached
    return 1.0;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    const fallback = await getCachedRates(cacheKey);
    return fallback?.rates[currency] || 1.0;
  }
}

async function fetchRatesFromAPI(): Promise<ExchangeRates> {
  const response = await fetch(EXCHANGE_RATE_API);
  if (!response.ok) throw new Error('Failed to fetch rates');
  
  const data: any = await response.json();
  return data.rates;
}

async function getCachedRates(cacheKey: string): Promise<CachedRate | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: cacheKey, SK: 'RATES' },
    })
  );
  return result.Item as CachedRate | null;
}

async function cacheRates(cacheKey: string, rates: ExchangeRates): Promise<void> {
  const now = Date.now();

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: cacheKey,
        SK: 'RATES',
        rates,
        lastUpdated: now,
      },
    })
  );
}
