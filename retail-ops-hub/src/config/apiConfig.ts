/**
 * Centralized API Configuration
 * All HTTP configuration must be read from here.
 */
export const apiConfig = {
  /** Base URL for all API requests */
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  
  /** Request timeout in milliseconds */
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  
  /**
   * Data source mode:
   * - true  → Use mock data / localStorage, NO HTTP calls
   * - false → Use real REST API, NO mock data
   * 
   * Default: true (demo mode) when VITE_USE_MOCK_DATA is not explicitly set to 'false'
   */
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false',
} as const;
