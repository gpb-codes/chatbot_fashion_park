import { httpClient } from '@/lib/httpClient';
import type { 
  Action, 
  ActionExecution,
  ExecuteActionRequest,
  ExecuteActionResponse 
} from '@/types/api';

const API_PREFIX = '/api';

/**
 * Actions Service
 * Handles action catalog and execution operations.
 */
export const actionsService = {
  /**
   * List all available actions in the catalog
   */
  async listActions(): Promise<Action[]> {
    return httpClient.get<Action[]>(`${API_PREFIX}/actions`);
  },

  /**
   * Get action by ID
   */
  async getAction(id: string): Promise<Action> {
    return httpClient.get<Action>(`${API_PREFIX}/actions/${id}`);
  },

  /**
   * Execute an action on a POS
   */
  async executeAction(request: ExecuteActionRequest): Promise<ExecuteActionResponse> {
    return httpClient.post<ExecuteActionResponse>(`${API_PREFIX}/executions`, request);
  },

  /**
   * List action executions
   */
  async listExecutions(): Promise<ActionExecution[]> {
    return httpClient.get<ActionExecution[]>(`${API_PREFIX}/executions`);
  },

  /**
   * Get execution by ID
   */
  async getExecution(id: string): Promise<ActionExecution> {
    return httpClient.get<ActionExecution>(`${API_PREFIX}/executions/${id}`);
  },

  /**
   * List recent executions (last N)
   */
  async listRecentExecutions(limit = 10): Promise<ActionExecution[]> {
    return httpClient.get<ActionExecution[]>(`${API_PREFIX}/executions?limit=${limit}&sort=desc`);
  },

  /**
   * Cancel a pending execution
   */
  async cancelExecution(id: string): Promise<void> {
    return httpClient.delete<void>(`${API_PREFIX}/executions/${id}`);
  },
};
