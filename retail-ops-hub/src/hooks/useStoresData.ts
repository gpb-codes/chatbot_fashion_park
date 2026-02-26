import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiConfig } from '@/config/apiConfig';
import { 
  regions as mockRegions,
  stores as mockStores,
  posTerminals as mockPOS 
} from '@/data/mockData';
import { posService } from '@/services';
import type { Region, Store, POS } from '@/types';

interface UseStoresDataResult {
  regions: Region[];
  stores: Store[];
  posTerminals: POS[];
  isLoading: boolean;
  error: Error | null;
  getStoresByRegion: (regionId: string) => Store[];
  getPOSByStore: (storeId: string) => POS[];
  refetch: () => Promise<void>;
}

/**
 * Stores Data Hook
 * Provides hierarchical data: Region → Store → POS
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useStoresData(): UseStoresDataResult {
  const [regions, setRegions] = useState<Region[]>(
    apiConfig.useMockData ? mockRegions : []
  );
  const [stores, setStores] = useState<Store[]>(
    apiConfig.useMockData ? mockStores : []
  );
  const [posTerminals, setPosTerminals] = useState<POS[]>(
    apiConfig.useMockData ? mockPOS : []
  );
  const [isLoading, setIsLoading] = useState(!apiConfig.useMockData);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (apiConfig.useMockData) {
      // In mock mode, just refresh from mock data
      setRegions(mockRegions);
      setStores(mockStores);
      setPosTerminals(mockPOS);
      return;
    }

    // Real API mode
    setIsLoading(true);
    setError(null);

    try {
      const [regionsData, storesData, posData] = await Promise.all([
        posService.listRegions(),
        posService.listStores(),
        posService.listPOS(),
      ]);

      setRegions(regionsData);
      setStores(storesData);
      setPosTerminals(posData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar datos'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch for API mode
  useEffect(() => {
    if (!apiConfig.useMockData) {
      refetch();
    }
  }, [refetch]);

  const getStoresByRegion = useCallback((regionId: string) => {
    return stores.filter(store => store.regionId === regionId);
  }, [stores]);

  const getPOSByStore = useCallback((storeId: string) => {
    return posTerminals.filter(pos => pos.storeId === storeId);
  }, [posTerminals]);

  return useMemo(() => ({
    regions,
    stores,
    posTerminals,
    isLoading,
    error,
    getStoresByRegion,
    getPOSByStore,
    refetch,
  }), [regions, stores, posTerminals, isLoading, error, getStoresByRegion, getPOSByStore, refetch]);
}
