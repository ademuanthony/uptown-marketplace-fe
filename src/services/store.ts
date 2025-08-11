import api from './api';

export interface StoreConfig {
  store_name?: string;
  permalink: string;
}

export interface StoreConfigResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  permalink: string;
  store_name?: string;
  // ... other user fields
}

export interface PermalinkAvailabilityResponse {
  available: boolean;
}

export class StoreService {
  /**
   * Get current user's store configuration
   */
  static async getStoreConfig(): Promise<StoreConfigResponse> {
    const response = await api.get('/users/store-config');
    return response.data;
  }

  /**
   * Update store configuration
   */
  static async updateStoreConfig(config: StoreConfig): Promise<StoreConfigResponse> {
    const response = await api.put('/users/store-config', config);
    return response.data;
  }

  /**
   * Check if a permalink is available
   */
  static async checkPermalinkAvailability(permalink: string): Promise<boolean> {
    const response = await api.get(
      `/users/store-config/check-permalink/${encodeURIComponent(permalink)}`,
    );
    return response.data.available;
  }
}

export const storeService = StoreService;
