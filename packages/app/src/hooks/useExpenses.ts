import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number;
  odometer?: number;
  description?: string;
  timestamp?: number;
  createdAt: string;
  receiptImageKey?: string;
}

export function useExpenses(vehicleId: string | null) {
  const [visibleMonths, setVisibleMonths] = useState(12);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['expenses', vehicleId || 'none'],
    queryFn: async ({ pageParam }) => {
      if (!vehicleId) return { expenses: [], nextToken: undefined };
      const result = await api.expenses.list(vehicleId, pageParam);
      return result || { expenses: [], nextToken: undefined };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextToken ?? undefined
  });

  const expenses = useMemo(() => 
    data?.pages?.flatMap(page => page.expenses) || [],
    [data]
  );

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    expenses.forEach((expense: Expense) => {
      const date = new Date(expense.timestamp || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(expense);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  const visibleGroupedExpenses = useMemo(() => 
    groupedExpenses.slice(0, visibleMonths),
    [groupedExpenses, visibleMonths]
  );

  const hasMoreMonths = visibleMonths < groupedExpenses.length;

  const handleScroll = () => {
    if (hasMoreMonths) {
      setVisibleMonths(prev => prev + 6);
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    expenses,
    groupedExpenses,
    visibleGroupedExpenses,
    hasMoreMonths,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    handleScroll
  };
}
