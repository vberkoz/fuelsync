export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatWithBaseAmount(
  amount: number,
  currency: string,
  baseAmount: number | undefined,
  preferredCurrency: string = 'USD'
): string {
  // If preferred is USD, always show USD (either original or converted)
  if (preferredCurrency === 'USD') {
    return baseAmount ? `$${baseAmount.toFixed(2)}` : formatCurrency(amount, currency);
  }
  
  // If preferred is not USD, show original with USD conversion in parentheses
  if (currency !== 'USD' && baseAmount) {
    return `${formatCurrency(amount, currency)} ($${baseAmount.toFixed(2)})`;
  }
  
  // Fallback: just show the amount
  return formatCurrency(amount, currency);
}
