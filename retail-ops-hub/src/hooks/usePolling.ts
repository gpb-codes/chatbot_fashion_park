import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollingOptions<T> {
  fetchFn: () => Promise<T> | T;
  interval?: number;
  enabled?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UsePollingResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export function usePolling<T>({
  fetchFn,
  interval = 30000,
  enabled = true,
  initialData,
  onSuccess,
  onError,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const hasInitialData = initialData !== undefined;
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    hasInitialData ? new Date() : null
  );
  const hasInitialFetched = useRef(hasInitialData);
  
  // Use ref to always have the latest fetchFn
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;

    // Only do initial fetch if we don't have initial data
    if (!hasInitialFetched.current) {
      hasInitialFetched.current = true;
      fetchData(true);
    }

    // Set up polling - always start the interval
    const intervalId = setInterval(() => {
      fetchData(false);
    }, interval);

    return () => clearInterval(intervalId);
  }, [fetchData, interval, enabled]);

  const refetch = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refetch,
  };
}
