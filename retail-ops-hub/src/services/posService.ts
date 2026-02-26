import { httpClient } from '@/lib/httpClient';
import type { POS, Store, Region } from '@/types/api';

const API_PREFIX = '/api';

/**
 * POS Service
 * Handles all POS-related API operations.
 */
export const posService = {
  /**
   * List all POS terminals
   */
  async listPOS(): Promise<POS[]> {
    return httpClient.get<POS[]>(`${API_PREFIX}/pos`);
  },

  /**
   * Get POS by ID
   */
  async getPOS(id: string): Promise<POS> {
    return httpClient.get<POS>(`${API_PREFIX}/pos/${id}`);
  },

  /**
   * List POS by store ID
   */
  async listPOSByStore(storeId: string): Promise<POS[]> {
    return httpClient.get<POS[]>(`${API_PREFIX}/stores/${storeId}/pos`);
  },

  /**
   * List all stores
   */
  async listStores(): Promise<Store[]> {
    return httpClient.get<Store[]>(`${API_PREFIX}/stores`);
  },

  /**
   * Get store by ID
   */
  async getStore(id: string): Promise<Store> {
    return httpClient.get<Store>(`${API_PREFIX}/stores/${id}`);
  },

  /**
   * List all regions
   */
  async listRegions(): Promise<Region[]> {
    return httpClient.get<Region[]>(`${API_PREFIX}/regions`);
  },

  /**
   * Get region by ID
   */
  async getRegion(id: string): Promise<Region> {
    return httpClient.get<Region>(`${API_PREFIX}/regions/${id}`);
  },
};
