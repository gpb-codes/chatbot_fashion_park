import { apiConfig } from '@/config/apiConfig';

/**
 * Custom API Error with structured information
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;
  public readonly requestId?: string;
  public readonly traceId?: string;
  public readonly correlationId?: string;

  constructor(
    status: number, 
    message: string, 
    details?: unknown,
    traceability?: { requestId?: string; traceId?: string; correlationId?: string }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.requestId = traceability?.requestId;
    this.traceId = traceability?.traceId;
    this.correlationId = traceability?.correlationId;
  }
}

/**
 * Response with traceability headers
 */
export interface TracedResponse<T> {
  data: T;
  traceability: {
    requestId: string;
    traceId?: string;
    correlationId?: string;
  };
}

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Include traceability info in response */
  withTraceability?: boolean;
}

// Client version from package.json or environment
const CLIENT_VERSION = '2.0.0';

/**
 * Generate a UUID v4 for request identification
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a correlation ID for business-level tracing
 * Format: corr-{timestamp}-{short-uuid}
 */
function generateCorrelationId(): string {
  const timestamp = Date.now();
  const shortId = crypto.randomUUID().substring(0, 8);
  return `corr-${timestamp}-${shortId}`;
}

/**
 * Extract traceability headers from response
 */
function extractTraceability(response: Response): {
  requestId: string;
  traceId?: string;
  correlationId?: string;
} {
  return {
    requestId: response.headers.get('X-Request-ID') || '',
    traceId: response.headers.get('X-Trace-ID') || undefined,
    correlationId: response.headers.get('X-Correlation-ID') || undefined,
  };
}

/**
 * Build full URL from path
 */
function buildUrl(path: string): string {
  const base = apiConfig.baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Build headers with traceability
 */
function buildHeaders(
  requestId: string,
  customHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Client-Version': CLIENT_VERSION,
    ...customHeaders,
  };

  // Add Authorization header if token exists
  // This would typically come from an auth context/store
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Get auth token from storage (placeholder - would integrate with auth context)
 */
function getAuthToken(): string | null {
  // In a real implementation, this would get the token from:
  // - React context
  // - localStorage/sessionStorage
  // - Auth service
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Handle response and parse JSON
 */
async function handleResponse<T>(
  response: Response, 
  requestId: string
): Promise<T> {
  const traceability = extractTraceability(response);
  
  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      details,
      { ...traceability, requestId }
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(500, 'Invalid JSON response', text, { ...traceability, requestId });
  }
}

/**
 * Handle response with traceability info
 */
async function handleTracedResponse<T>(
  response: Response, 
  requestId: string
): Promise<TracedResponse<T>> {
  const traceability = extractTraceability(response);
  
  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      details,
      { ...traceability, requestId }
    );
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {
      data: undefined as T,
      traceability: { ...traceability, requestId },
    };
  }

  try {
    return {
      data: JSON.parse(text) as T,
      traceability: { ...traceability, requestId },
    };
  } catch {
    throw new ApiError(500, 'Invalid JSON response', text, { ...traceability, requestId });
  }
}

/**
 * Create AbortController with timeout
 */
function createTimeoutController(signal?: AbortSignal): { 
  controller: AbortController; 
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  
  // Link external signal if provided
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, apiConfig.timeoutMs);

  return { controller, timeoutId };
}

/**
 * Log request for debugging (only in development)
 */
function logRequest(method: string, path: string, requestId: string): void {
  if (import.meta.env.DEV) {
    console.debug(`[HTTP] ${method} ${path}`, { requestId });
  }
}

/**
 * Centralized HTTP Client with Traceability
 * All HTTP calls in the application MUST go through this client.
 * 
 * Features:
 * - Automatic X-Request-ID generation
 * - X-Client-Version header
 * - Authorization header injection
 * - Traceability extraction from responses
 * - Timeout handling
 * - Error standardization with trace info
 */
export const httpClient = {
  /**
   * Generate IDs for manual use (e.g., for correlation tracking)
   */
  generateRequestId,
  generateCorrelationId,

  /**
   * GET request
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('GET', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'GET',
        headers: buildHeaders(requestId, options?.headers),
        signal: controller.signal,
      });
      return handleResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * GET request with traceability info in response
   */
  async getTraced<T>(path: string, options?: RequestOptions): Promise<TracedResponse<T>> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('GET', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'GET',
        headers: buildHeaders(requestId, options?.headers),
        signal: controller.signal,
      });
      return handleTracedResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * POST request
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('POST', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'POST',
        headers: buildHeaders(requestId, options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return handleResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * POST request with traceability info in response
   */
  async postTraced<T>(path: string, body?: unknown, options?: RequestOptions): Promise<TracedResponse<T>> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('POST', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'POST',
        headers: buildHeaders(requestId, options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return handleTracedResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * PUT request
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('PUT', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'PUT',
        headers: buildHeaders(requestId, options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return handleResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * PATCH request
   */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('PATCH', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'PATCH',
        headers: buildHeaders(requestId, options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return handleResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const requestId = generateRequestId();
    const { controller, timeoutId } = createTimeoutController(options?.signal);
    
    logRequest('DELETE', path, requestId);
    
    try {
      const response = await fetch(buildUrl(path), {
        method: 'DELETE',
        headers: buildHeaders(requestId, options?.headers),
        signal: controller.signal,
      });
      return handleResponse<T>(response, requestId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout', undefined, { requestId });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
