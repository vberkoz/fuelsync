import { getExchangeRate } from '../../utils/exchange-rate';

export const handler = async () => {
  try {
    // Fetch and cache today's UAH rate
    await getExchangeRate('UAH');
    console.log('Daily exchange rate updated successfully');
    return { statusCode: 200, body: 'Success' };
  } catch (error) {
    console.error('Failed to update exchange rate:', error);
    throw error;
  }
};