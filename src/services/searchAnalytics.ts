import api from '@/lib/api';

export interface SearchAnalytics {
  trackSearch(query: string): Promise<void>;
  trackSearchClick(searchId: string, productId: string, position: number): Promise<void>;
}

class SearchAnalyticsService implements SearchAnalytics {
  private searchId: string | null = null;

  async trackSearch(query: string): Promise<void> {
    try {
      const response = await api.post<{ search_id: string, query: string, timestamp: string }>('/analytics/search/track', {
        query,
        timestamp: new Date().toISOString()
      });

      if (response.data?.search_id) {
        this.searchId = response.data.search_id;
      }
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  async trackSearchClick(searchId: string, productId: string, position: number): Promise<void> {
    try {
      await api.post('/analytics/search/click', {
        search_id: searchId || this.searchId,
        product_id: productId,
        position
      });
    } catch (error) {
      console.error('Failed to track search click:', error);
    }
  }

  getLastSearchId(): string | null {
    return this.searchId;
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();