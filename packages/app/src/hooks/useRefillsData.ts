import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useRefillsData(activeVehicleId: string | null | undefined) {
  const queryClient = useQueryClient();
  const [visibleMonths, setVisibleMonths] = useState(12);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['refills-infinite', activeVehicleId],
    enabled: Boolean(activeVehicleId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const result = await api.refills.list(activeVehicleId!, pageParam);
      return {
        refills: result?.refills ?? [],
        nextToken: result?.nextToken ?? null,
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.nextToken ?? undefined;
    },
  });

  const refills = useMemo(() => 
    data?.pages?.flatMap(page => page.refills) || [],
    [data]
  );

  const groupedRefills = useMemo(() => {
    const groups: Record<string, any[]> = {};
    refills.forEach((refill: any) => {
      const date = new Date(refill.timestamp || refill.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(refill);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [refills]);

  const visibleGroupedRefills = useMemo(() => 
    groupedRefills.slice(0, visibleMonths),
    [groupedRefills, visibleMonths]
  );

  const hasMoreMonths = visibleMonths < groupedRefills.length;

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement || !data?.pages?.length) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8) {
        if (hasMoreMonths) {
          setVisibleMonths(prev => prev + 6);
        } else if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMonths, hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages?.length]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.refills.create(activeVehicleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refills-infinite', activeVehicleId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ refillId, data }: { refillId: string; data: any }) => 
      api.refills.update(activeVehicleId!, refillId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refills-infinite', activeVehicleId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (refillId: string) => api.refills.delete(activeVehicleId!, refillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refills-infinite', activeVehicleId] });
    }
  });

  return {
    refills,
    visibleGroupedRefills,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    hasMoreMonths,
    createMutation,
    updateMutation,
    deleteMutation
  };
}
