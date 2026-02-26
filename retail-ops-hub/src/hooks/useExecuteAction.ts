import { useState, useCallback } from 'react';
import { apiConfig } from '@/config/apiConfig';
import { actionsService } from '@/services';
import { recentExecutions as mockExecutions } from '@/data/mockData';
import type { ActionExecution } from '@/types';
import type { ExecuteActionRequest, ExecuteActionResponse } from '@/types/api';

interface UseExecuteActionResult {
  execute: (request: ExecuteActionRequest) => Promise<ExecuteActionResponse>;
  isExecuting: boolean;
  error: Error | null;
  lastExecution: ExecuteActionResponse | null;
}

/**
 * Action Execution Hook
 * Uses mock logic when VITE_USE_MOCK_DATA=true, otherwise calls REST API
 */
export function useExecuteAction(): UseExecuteActionResult {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastExecution, setLastExecution] = useState<ExecuteActionResponse | null>(null);

  const execute = useCallback(async (request: ExecuteActionRequest): Promise<ExecuteActionResponse> => {
    setIsExecuting(true);
    setError(null);

    try {
      if (apiConfig.useMockData) {
        // Simulate execution in mock mode
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const response: ExecuteActionResponse = {
          executionId: `exec-${Date.now()}`,
          status: 'pending',
          message: 'Acción enviada correctamente. En espera de ejecución.',
        };

        setLastExecution(response);
        return response;
      }

      // Real API mode
      const response = await actionsService.executeAction(request);
      setLastExecution(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al ejecutar acción');
      setError(error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return {
    execute,
    isExecuting,
    error,
    lastExecution,
  };
}
