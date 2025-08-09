import api from './api';
import { isAxiosError } from 'axios';
import { Currency, NetworkType } from './deposits';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Withdrawal request interface
export interface WithdrawalRequest {
  currency: Currency;
  amount: number;
  recipient_address: string;
  network: NetworkType;
  description?: string;
  two_factor_code?: string;
}

// Withdrawal response interface
export interface WithdrawalResponse {
  id: string;
  user_id: string;
  currency: Currency;
  amount: number;
  recipient_address: string;
  network: NetworkType;
  fee_amount: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_hash?: string;
  description: string;
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
}

// Network fee information
export interface NetworkFee {
  currency: Currency;
  network: NetworkType;
  fee_amount: number;
  fee_currency: Currency;
  estimated_time: string; // e.g., "5-10 minutes"
  current_gas_price?: number;
}

// Withdrawal limits
export interface WithdrawalLimits {
  currency: Currency;
  daily_limit: number;
  remaining_today: number;
  minimum_amount: number;
  maximum_amount: number;
  requires_kyc_above: number;
}

// Address book entry
export interface AddressBookEntry {
  id: string;
  user_id: string;
  name: string;
  address: string;
  network: NetworkType;
  currency: Currency;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

class WithdrawalService {
  // Initiate a withdrawal
  async createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const response = await api.post<ApiResponse<WithdrawalResponse>>('/wallet/withdraw', request);
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to create withdrawal');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Create withdrawal error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create withdrawal');
    }
  }

  // Get withdrawal by ID
  async getWithdrawal(withdrawalId: string): Promise<WithdrawalResponse> {
    try {
      const response = await api.get<ApiResponse<WithdrawalResponse>>(`/wallet/withdrawals/${withdrawalId}`);
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get withdrawal details');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get withdrawal error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get withdrawal details');
    }
  }

  // Get user's withdrawal history
  async getWithdrawalHistory(page: number = 1, limit: number = 20): Promise<{
    withdrawals: WithdrawalResponse[];
    pagination: {
      page: number;
      per_page: number;
      total_count: number;
      total_pages: number;
    };
  }> {
    try {
      const response = await api.get<ApiResponse<{
        withdrawals: WithdrawalResponse[];
        pagination: {
          page: number;
          per_page: number;
          total_count: number;
          total_pages: number;
        };
      }>>('/wallet/withdrawals', {
        params: { page, limit }
      });
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get withdrawal history');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get withdrawal history error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get withdrawal history');
    }
  }

  // Get network fees for withdrawal
  async getNetworkFee(currency: Currency, network: NetworkType, amount?: number): Promise<NetworkFee> {
    try {
      const params: Record<string, string> = {
        currency,
        network,
      };
      
      if (amount) {
        params.amount = amount.toString();
      }

      const response = await api.get<ApiResponse<NetworkFee>>('/wallet/network-fees', { params });
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get network fees');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get network fee error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Return default fee if API fails
      return this.getDefaultNetworkFee(currency, network);
    }
  }

  // Get withdrawal limits for user
  async getWithdrawalLimits(currency: Currency): Promise<WithdrawalLimits> {
    try {
      const response = await api.get<ApiResponse<WithdrawalLimits>>(`/wallet/withdrawal-limits/${currency}`);
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get withdrawal limits');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get withdrawal limits error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get withdrawal limits');
    }
  }

  // Validate withdrawal address
  async validateWithdrawalAddress(address: string, currency: Currency, network: NetworkType): Promise<{
    is_valid: boolean;
    is_contract?: boolean;
    risk_level?: 'low' | 'medium' | 'high';
    warnings?: string[];
  }> {
    try {
      const response = await api.post<ApiResponse<{
        is_valid: boolean;
        is_contract?: boolean;
        risk_level?: 'low' | 'medium' | 'high';
        warnings?: string[];
      }>>('/wallet/validate-address', {
        address,
        currency,
        network,
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to validate address');
      }
      
      return response.data.data || { is_valid: false };
    } catch (error) {
      console.error('Validate address error:', error);
      // Return basic validation if API fails
      return {
        is_valid: this.basicAddressValidation(address, network),
        warnings: ['Address validation service unavailable'],
      };
    }
  }

  // Cancel withdrawal (if still pending)
  async cancelWithdrawal(withdrawalId: string, reason?: string): Promise<WithdrawalResponse> {
    try {
      const response = await api.post<ApiResponse<WithdrawalResponse>>(`/wallet/withdrawals/${withdrawalId}/cancel`, {
        reason: reason || 'User requested cancellation',
      });
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to cancel withdrawal');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Cancel withdrawal error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to cancel withdrawal');
    }
  }

  // Get address book entries
  async getAddressBook(): Promise<AddressBookEntry[]> {
    try {
      const response = await api.get<ApiResponse<{ addresses: AddressBookEntry[] }>>('/wallet/address-book');
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get address book');
      }
      
      return response.data.data.addresses || [];
    } catch (error) {
      console.error('Get address book error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get address book');
    }
  }

  // Add address to address book
  async addToAddressBook(name: string, address: string, currency: Currency, network: NetworkType): Promise<AddressBookEntry> {
    try {
      const response = await api.post<ApiResponse<AddressBookEntry>>('/wallet/address-book', {
        name,
        address,
        currency,
        network,
      });
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to add address to book');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Add to address book error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to add address to book');
    }
  }

  // Remove address from address book
  async removeFromAddressBook(addressId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/wallet/address-book/${addressId}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to remove address');
      }
    } catch (error) {
      console.error('Remove from address book error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to remove address');
    }
  }

  // Basic client-side address validation
  private basicAddressValidation(address: string, network: NetworkType): boolean {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    
    switch (network) {
      case 'ethereum':
      case 'polygon':
        return ethAddressRegex.test(address);
      default:
        return false;
    }
  }

  // Get default network fees when API is unavailable
  private getDefaultNetworkFee(currency: Currency, network: NetworkType): NetworkFee {
    const defaultFees: Record<string, NetworkFee> = {
      'USDT-polygon': {
        currency: 'USDT',
        network: 'polygon',
        fee_amount: 1,
        fee_currency: 'POL',
        estimated_time: '2-5 minutes',
      },
      'POL-polygon': {
        currency: 'POL',
        network: 'polygon',
        fee_amount: 0.01,
        fee_currency: 'POL',
        estimated_time: '2-5 minutes',
      },
      'USDT-ethereum': {
        currency: 'USDT',
        network: 'ethereum',
        fee_amount: 15,
        fee_currency: 'ETH',
        estimated_time: '5-15 minutes',
      },
      'ETH-ethereum': {
        currency: 'ETH',
        network: 'ethereum',
        fee_amount: 0.003,
        fee_currency: 'ETH',
        estimated_time: '5-15 minutes',
      },
    };
    
    const key = `${currency}-${network}`;
    return defaultFees[key] || {
      currency,
      network,
      fee_amount: 0,
      fee_currency: currency,
      estimated_time: '5-30 minutes',
    };
  }

  // Get supported withdrawal methods
  getSupportedWithdrawalMethods(): Array<{
    currency: Currency;
    networks: Array<{
      network: NetworkType;
      name: string;
      min_amount: number;
      fee_estimate: string;
    }>;
  }> {
    return [
      {
        currency: 'USDT',
        networks: [
          {
            network: 'polygon',
            name: 'Polygon',
            min_amount: 1,
            fee_estimate: '~$0.01',
          },
          {
            network: 'ethereum',
            name: 'Ethereum',
            min_amount: 10,
            fee_estimate: '~$15-50',
          },
        ],
      },
      {
        currency: 'POL',
        networks: [
          {
            network: 'polygon',
            name: 'Polygon',
            min_amount: 0.1,
            fee_estimate: '~$0.01',
          },
        ],
      },
    ];
  }

  // Format withdrawal status for display
  getStatusDisplayInfo(status: WithdrawalResponse['status']): {
    label: string;
    color: string;
    description: string;
  } {
    const statusInfo = {
      pending: {
        label: 'Pending',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        description: 'Withdrawal request submitted, awaiting processing',
      },
      processing: {
        label: 'Processing',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: 'Withdrawal is being processed on the blockchain',
      },
      completed: {
        label: 'Completed',
        color: 'text-green-600 bg-green-50 border-green-200',
        description: 'Withdrawal has been completed successfully',
      },
      failed: {
        label: 'Failed',
        color: 'text-red-600 bg-red-50 border-red-200',
        description: 'Withdrawal failed, funds have been returned',
      },
      cancelled: {
        label: 'Cancelled',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        description: 'Withdrawal was cancelled, funds have been returned',
      },
    };
    
    return statusInfo[status] || statusInfo.pending;
  }
}

export default new WithdrawalService();