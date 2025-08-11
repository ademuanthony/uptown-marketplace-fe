import api from './api';

export interface LoyaltyPointsBalance {
  balance: number;
  currency: string; // Always 'PNT'
}

export interface LoyaltyAccount {
  user_id: string;
  total_points: number;
  available_points: number;
  pending_points: number;
  lifetime_earned: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
  currency: string; // Always 'PNT'
}

export interface LoyaltyApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class LoyaltyService {
  // Helper method to handle axios errors
  private getErrorMessage(error: unknown): string {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    return axiosError.response?.data?.message || axiosError.message || 'An error occurred';
  }

  private getErrorStatus(error: unknown): number | undefined {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    return axiosError.response?.status;
  }

  /**
   * Get user's current loyalty points balance
   */
  async getPointBalance(): Promise<LoyaltyPointsBalance> {
    try {
      const response = await api.get<LoyaltyApiResponse<LoyaltyPointsBalance>>(
        '/loyalty/balance'
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get points balance');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to get points balance:', error);
      
      const status = this.getErrorStatus(error);
      
      if (status === 401) {
        throw new Error('Please login to view your points balance');
      }
      
      if (status === 404) {
        // Loyalty account doesn't exist yet, return zero balance
        return { balance: 0, currency: 'PNT' };
      }
      
      throw new Error(this.getErrorMessage(error) || 'Failed to get points balance');
    }
  }

  /**
   * Get user's complete loyalty account details
   */
  async getLoyaltyAccount(): Promise<LoyaltyAccount> {
    try {
      const response = await api.get<LoyaltyApiResponse<LoyaltyAccount>>(
        '/loyalty/account'
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get loyalty account');
      }
      
      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to get loyalty account:', error);
      
      const status = this.getErrorStatus(error);
      
      if (status === 401) {
        throw new Error('Please login to view your loyalty account');
      }
      
      if (status === 404) {
        // Loyalty account doesn't exist yet, try to create one
        try {
          await this.createLoyaltyAccount();
          // Retry getting the account
          const retryResponse = await api.get<LoyaltyApiResponse<LoyaltyAccount>>(
            '/loyalty/account'
          );
          return retryResponse.data.data;
        } catch (createError) {
          console.error('Failed to create loyalty account:', createError);
          // Return default empty account
          return {
            user_id: '',
            total_points: 0,
            available_points: 0,
            pending_points: 0,
            lifetime_earned: 0,
            lifetime_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            currency: 'PNT',
          };
        }
      }
      
      throw new Error(this.getErrorMessage(error) || 'Failed to get loyalty account');
    }
  }

  /**
   * Create a new loyalty account for the user
   */
  async createLoyaltyAccount(): Promise<void> {
    try {
      const response = await api.post<LoyaltyApiResponse<{ user_id: string }>>(
        '/loyalty/account'
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create loyalty account');
      }
    } catch (error: unknown) {
      console.error('Failed to create loyalty account:', error);
      
      const status = this.getErrorStatus(error);
      
      if (status === 401) {
        throw new Error('Please login to create a loyalty account');
      }
      
      throw new Error(this.getErrorMessage(error) || 'Failed to create loyalty account');
    }
  }

  /**
   * Check if user has sufficient points for a transaction
   */
  async checkSufficientPoints(requiredPoints: number): Promise<boolean> {
    try {
      const response = await api.post<LoyaltyApiResponse<{ sufficient: boolean; required_points: number }>>(
        '/loyalty/check',
        { points: requiredPoints }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check points');
      }
      
      return response.data.data.sufficient;
    } catch (error: unknown) {
      console.error('Failed to check sufficient points:', error);
      
      const status = this.getErrorStatus(error);
      
      if (status === 401) {
        throw new Error('Please login to check your points');
      }
      
      throw new Error(this.getErrorMessage(error) || 'Failed to check points');
    }
  }

  /**
   * Add points to user's account (admin/system function)
   */
  async addPoints(points: number, description: string, referenceId?: string): Promise<void> {
    try {
      const response = await api.post<LoyaltyApiResponse<{ points_added: number; description: string }>>(
        '/loyalty/add',
        { 
          points, 
          description,
          reference_id: referenceId 
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add points');
      }
    } catch (error: unknown) {
      console.error('Failed to add points:', error);
      
      const status = this.getErrorStatus(error);
      
      if (status === 401) {
        throw new Error('Please login to add points');
      }
      
      if (status === 400) {
        throw new Error('Invalid points data');
      }
      
      throw new Error(this.getErrorMessage(error) || 'Failed to add points');
    }
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;