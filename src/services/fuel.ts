import api from './api';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Fuel balance response
export interface FuelBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

// Fuel package
export interface FuelPackage {
  id: string;
  name: string;
  fuel_amount: number;
  price: {
    amount: number;
    currency: string;
  };
  bonus_fuel: number;
  status: string;
  display_order: number;
  is_popular: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Fuel transaction
export interface FuelTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'spend' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Purchase fuel request
export interface PurchaseFuelRequest {
  package_id: string;
}

// Purchase fuel response
export interface PurchaseFuelResponse {
  invoice: {
    id: string;
    number: string;
    status: string;
    title: string;
    description: string;
    total_amount: {
      amount: number;
      currency: string;
      display: string;
    };
    payment_deadline: string;
    created_at: string;
  };
  payment_reference: string;
  message: string;
}

// Transaction summary
export interface TransactionSummary {
  total_purchases: number;
  total_spending: number;
  current_balance: number;
  transaction_count: number;
  last_transaction_date?: string;
}

class FuelService {
  // Get user's fuel balance
  async getFuelBalance(): Promise<FuelBalance> {
    try {
      const response = await api.get<ApiResponse<FuelBalance>>('/fuel/balance');

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get fuel balance');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get fuel balance error:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to get fuel balance',
        );
      }
      throw error;
    }
  }

  // Get available fuel packages
  async getFuelPackages(): Promise<FuelPackage[]> {
    try {
      const response = await api.get<ApiResponse<FuelPackage[]>>('/fuel/packages');

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get fuel packages');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get fuel packages error:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to get fuel packages',
        );
      }
      throw error;
    }
  }

  // Purchase fuel package
  async purchaseFuel(packageId: string): Promise<PurchaseFuelResponse> {
    try {
      const response = await api.post<ApiResponse<PurchaseFuelResponse>>('/fuel/purchase', {
        package_id: packageId,
      });

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to purchase fuel');
      }

      return response.data.data;
    } catch (error) {
      console.error('Purchase fuel error:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to purchase fuel',
        );
      }
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(
    page: number = 1,
    perPage: number = 20,
  ): Promise<{
    transactions: FuelTransaction[];
    pagination: {
      page: number;
      per_page: number;
      total_count: number;
      total_pages: number;
    };
  }> {
    try {
      const response = await api.get<
        ApiResponse<{
          transactions: FuelTransaction[];
          pagination: {
            page: number;
            per_page: number;
            total_count: number;
            total_pages: number;
          };
        }>
      >(`/fuel/transactions?page=${page}&per_page=${perPage}`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get transaction history');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get transaction history error:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to get transaction history',
        );
      }
      throw error;
    }
  }

  // Get transaction summary
  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      const response = await api.get<ApiResponse<TransactionSummary>>('/fuel/summary');

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get transaction summary');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get transaction summary error:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to get transaction summary',
        );
      }
      throw error;
    }
  }
}

// Export singleton instance
const fuelService = new FuelService();
export default fuelService;
