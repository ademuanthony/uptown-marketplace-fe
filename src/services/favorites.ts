import api from './api';
import { Product } from './product';
import { isAxiosError } from 'axios';

// Favorites types
export interface Favorite {
  favorite_id: string;
  user_id: string;
  product_id: string;
  notes?: string;
  created_at: string;
  product?: Product; // Product details when included in response
}

export interface FavoriteStatus {
  is_favorited: boolean;
  product_id: string;
}

export interface UserFavoritesResponse {
  favorites: Favorite[];
  total: number;
  limit: number;
  offset: number;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class FavoritesService {
  // Add product to favorites
  async addToFavorites(productId: string, notes?: string): Promise<Favorite> {
    try {
      const requestData: Record<string, unknown> = {};
      if (notes) {
        requestData.notes = notes;
      }

      const response = await api.post<ApiResponse<Favorite>>(
        `/products/${productId}/favorites`,
        requestData,
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || 'Failed to add to favorites');
      }

      return response.data.data;
    } catch (error) {
      console.error('Add to favorites error:', error);
      
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to add to favorites');
    }
  }

  // Remove product from favorites
  async removeFromFavorites(productId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<{ success: boolean }>>(`/products/${productId}/favorites`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Remove from favorites error:', error);
      
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to remove from favorites');
    }
  }

  // Check if product is favorited by current user
  async isFavorited(productId: string): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<FavoriteStatus>>(
        `/products/${productId}/favorites/status`,
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || 'Failed to check favorite status');
      }

      return response.data.data.is_favorited;
    } catch (error) {
      console.error('Check favorite status error:', error);
      
      // If there's an auth error, assume not favorited
      if (isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to check favorite status');
    }
  }

  // Toggle favorite status (add if not favorited, remove if favorited)
  async toggleFavorite(productId: string, notes?: string): Promise<boolean> {
    try {
      const isCurrentlyFavorited = await this.isFavorited(productId);
      
      if (isCurrentlyFavorited) {
        await this.removeFromFavorites(productId);
        return false;
      } else {
        await this.addToFavorites(productId, notes);
        return true;
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw error;
    }
  }

  // Get user's favorite products with pagination
  async getUserFavorites(limit: number = 20, offset: number = 0): Promise<UserFavoritesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await api.get<ApiResponse<UserFavoritesResponse>>(
        `/users/favorites?${params.toString()}`,
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || 'Failed to fetch favorites');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get user favorites error:', error);
      
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch favorites');
    }
  }

  // Get all user favorite product IDs (useful for checking multiple products at once)
  async getUserFavoriteIds(): Promise<string[]> {
    try {
      // Get all favorites (we might need to paginate through all pages)
      const allFavorites: Favorite[] = [];
      let offset = 0;
      const limit = 100; // Get larger chunks
      
      while (true) {
        const response = await this.getUserFavorites(limit, offset);
        allFavorites.push(...response.favorites);
        
        // If we got fewer results than the limit, we've reached the end
        if (response.favorites.length < limit) {
          break;
        }
        
        offset += limit;
      }
      
      return allFavorites.map(favorite => favorite.product_id);
    } catch (error) {
      console.error('Get user favorite IDs error:', error);
      return []; // Return empty array on error rather than throwing
    }
  }

  // Check multiple products' favorite status at once (client-side optimization)
  async checkMultipleFavoriteStatus(productIds: string[]): Promise<Record<string, boolean>> {
    try {
      const favoriteIds = await this.getUserFavoriteIds();
      const statusMap: Record<string, boolean> = {};
      
      productIds.forEach(productId => {
        statusMap[productId] = favoriteIds.includes(productId);
      });
      
      return statusMap;
    } catch (error) {
      console.error('Check multiple favorite status error:', error);
      
      // Fallback: create a map with all false values
      const statusMap: Record<string, boolean> = {};
      productIds.forEach(productId => {
        statusMap[productId] = false;
      });
      
      return statusMap;
    }
  }
}

export const favoritesService = new FavoritesService();