import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiConfig } from '@/config/apiConfig';
import { actionCatalog as mockActions } from '@/data/mockData';
import { actionsService } from '@/services';
import type { Action } from '@/types';

interface UseActionsDataResult {
  actions: Action[];
  isLoading: boolean;
  error: Error | null;
  getActionById: (id: string) => Action | undefined;
  getActionByActionId: (actionId: string) => Action | undefined;
  refetch: () => Promise<void>;
}

/**
 * Actions Catalog Hook
 * Uses mock data when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useActionsData(): UseActionsDataResult {
  const [actions, setActions] = useState<Action[]>(
    apiConfig.useMockData ? mockActions : []
  );
  const [isLoading, setIsLoading] = useState(!apiConfig.useMockData);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (apiConfig.useMockData) {
      setActions(mockActions);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await actionsService.listActions();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar acciones'));
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

  const getActionById = useCallback((id: string) => {
    return actions.find(action => action.id === id);
  }, [actions]);

  const getActionByActionId = useCallback((actionId: string) => {
    return actions.find(action => action.actionId === actionId);
  }, [actions]);

  return useMemo(() => ({
    actions,
    isLoading,
    error,
    getActionById,
    getActionByActionId,
    refetch,
  }), [actions, isLoading, error, getActionById, getActionByActionId, refetch]);
}
