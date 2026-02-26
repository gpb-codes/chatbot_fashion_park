import { httpClient } from '@/lib/httpClient';
import type { Incident } from '@/types/api';

const API_PREFIX = '/api';

/**
 * Incidents Service
 * Handles incident management operations.
 */
export const incidentsService = {
  /**
   * List all incidents
   */
  async listIncidents(): Promise<Incident[]> {
    return httpClient.get<Incident[]>(`${API_PREFIX}/incidents`);
  },

  /**
   * Get incident by ID
   */
  async getIncident(id: string): Promise<Incident> {
    return httpClient.get<Incident>(`${API_PREFIX}/incidents/${id}`);
  },

  /**
   * List active incidents (open, investigating)
   */
  async listActiveIncidents(): Promise<Incident[]> {
    return httpClient.get<Incident[]>(`${API_PREFIX}/incidents?status=open,investigating`);
  },

  /**
   * Update incident status
   */
  async updateIncidentStatus(id: string, status: Incident['status']): Promise<Incident> {
    return httpClient.patch<Incident>(`${API_PREFIX}/incidents/${id}`, { status });
  },

  /**
   * Assign incident to user
   */
  async assignIncident(id: string, userId: string): Promise<Incident> {
    return httpClient.patch<Incident>(`${API_PREFIX}/incidents/${id}`, { assignedTo: userId });
  },
};
