import api from './api';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated API response wrapper
interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
  message?: string;
  timestamp: string;
}

// Transaction types matching backend
export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'transfer' 
  | 'purchase' 
  | 'refund' 
  | 'escrow_lock' 
  | 'escrow_release' 
  | 'fee' 
  | 'commission' 
  | 'crypto_deposit' 
  | 'crypto_withdraw';

export type TransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'expired';

export type PaymentProvider = 'paystack' | 'stripe' | 'crypto' | 'internal';

export type Currency = 'USDT' | 'POL' | 'USD';

// Wallet balance interface (matching backend response)
export interface WalletBalance {
  currency: string;
  balance: string;
  available: string;
  pending: string;
  frozen: string;
}

// Transaction metadata interface
export interface TransactionMetadata {
  payment_provider?: PaymentProvider;
  external_reference?: string;
  blockchain_tx_hash?: string;
  blockchain_block?: number;
  confirmations?: number;
  exchange_rate?: number;
  fee_amount?: {
    amount: number;
    currency: string;
  };
  payment_method_id?: string;
  user_agent?: string;
  ip_address?: string;
  device_fingerprint?: string;
  risk_score?: number;
  notes?: string;
}

// Transaction interface (matching backend response)
export interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string; // Backend sends as string
  currency: string;
  description: string;
  reference: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  metadata?: TransactionMetadata;
  counterparty_user_id?: string;
  counterparty_wallet?: string;
}

// Pagination interface (matching backend response)
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// Transaction list response
export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

// Wallet summary interface
export interface WalletSummary {
  wallets: WalletBalance[];
  summary: {
    total_value: string;
    total_transactions: number;
    pending_transactions: number;
  };
}

class WalletService {
  // Get wallet summary with balances and recent transactions
  async getWalletSummary(): Promise<WalletSummary> {
    try {
      const response = await api.get<ApiResponse<WalletSummary>>('/wallet/summary');
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get wallet summary');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get wallet summary error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get wallet summary');
    }
  }

  // Get specific wallet balance
  async getWalletBalance(): Promise<WalletBalance> {
    try {
      const response = await api.get<ApiResponse<WalletBalance>>('/wallet/balance');
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get wallet balance');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get wallet balance error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get wallet balance');
    }
  }

  // Get transaction history with pagination
  async getTransactions(page: number = 1, limit: number = 20, type?: TransactionType, status?: TransactionStatus): Promise<TransactionListResponse> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        per_page: limit.toString(),
      };

      if (type) params.type = type;
      if (status) params.status = status;

      const response = await api.get<PaginatedApiResponse<Transaction>>('/wallet/transactions', { params });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to get transactions');
      }
      
      return {
        transactions: response.data.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get transactions');
    }
  }

  // Get single transaction details
  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const response = await api.get<ApiResponse<Transaction>>(`/wallet/transactions/${transactionId}`);
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get transaction details');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get transaction error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get transaction details');
    }
  }

  // Get exchange rates for currency conversion
  async getExchangeRates(): Promise<{ usdt_usd: number; pol_usd: number }> {
    try {
      const response = await api.get<ApiResponse<{ usdt_usd: number; pol_usd: number }>>('/wallet/exchange-rates');
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get exchange rates');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Get exchange rates error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get exchange rates');
    }
  }

  // Create internal transfer between users
  async createTransfer(recipientUserId: string, amount: number, currency: Currency, description?: string): Promise<Transaction> {
    try {
      const response = await api.post<ApiResponse<Transaction>>('/wallet/transfer', {
        recipient_user_id: recipientUserId,
        amount,
        currency,
        description: description || `Transfer to user ${recipientUserId}`,
      });
      
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to create transfer');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Create transfer error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create transfer');
    }
  }

  // Format currency amount for display
  formatCurrency(amount: number | string, currency: string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(numAmount);
    }
    
    // Format crypto currencies with appropriate decimal places
    const decimals = currency === 'USDT' ? 6 : 18;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals > 6 ? 6 : decimals,
    }).format(numAmount) + ` ${currency}`;
  }

  // Get transaction type display name
  getTransactionTypeDisplayName(type: TransactionType): string {
    const typeNames: Record<TransactionType, string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      transfer: 'Transfer',
      purchase: 'Purchase',
      refund: 'Refund',
      escrow_lock: 'Escrow Lock',
      escrow_release: 'Escrow Release',
      fee: 'Fee',
      commission: 'Commission',
      crypto_deposit: 'Crypto Deposit',
      crypto_withdraw: 'Crypto Withdrawal',
    };
    
    return typeNames[type] || type;
  }

  // Get transaction status display name
  getTransactionStatusDisplayName(status: TransactionStatus): string {
    const statusNames: Record<TransactionStatus, string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };
    
    return statusNames[status] || status;
  }

  // Check if transaction is incoming (credit) or outgoing (debit)
  isIncomingTransaction(transaction: Transaction, userId: string): boolean {
    const incomingTypes: TransactionType[] = [
      'deposit', 
      'crypto_deposit', 
      'refund', 
      'escrow_release', 
      'commission'
    ];
    
    // For transfers, check if current user is recipient
    if (transaction.type === 'transfer') {
      return transaction.counterparty_user_id === userId;
    }
    
    return incomingTypes.includes(transaction.type as TransactionType);
  }
}

export default new WalletService();