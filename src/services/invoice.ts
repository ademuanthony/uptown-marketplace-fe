import { Money } from '@/types/api';
import api from './api';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Invoice entity
export interface Invoice {
  id: string;
  number: string;
  type: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded';
  user_id: string;
  buyer_email: string;
  buyer_name: string;
  title: string;
  description: string;
  line_items: {
    id: string;
    description: string;
    quantity: number;
    unit_price: Money;
    total_price: Money;
    metadata: Record<string, unknown>;
  }[];
  sub_total: Money;
  tax_amount: Money;
  discount_amount: Money;
  total_amount: Money;
  currency: string;
  due_date?: string;
  paid_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
  refund_amount?: Money;
  payment_deadline: string;
  can_be_paid: boolean;
  is_expired: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Get invoice response
export interface GetInvoiceResponse {
  invoice: Invoice;
}

// Get user invoices response
export interface GetUserInvoicesResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

// Cancel invoice request
export interface CancelInvoiceRequest {
  reason: string;
}

// Cancel invoice response
export interface CancelInvoiceResponse {
  invoice: Invoice;
}

// Available balance for wallet payments
export interface AvailableBalance {
  currency: string;
  balance: string;
  usd_value: number;
}

// Get available balances response
export interface GetAvailableBalancesResponse {
  balances: AvailableBalance[];
}

// Wallet payment response
export interface WalletPaymentResponse {
  invoice: Invoice;
  transaction: {
    id: string;
    type: string;
    status: string;
    amount: string;
    currency: string;
    description: string;
    reference: string;
    created_at: string;
  };
  success: boolean;
}

class InvoiceService {
  // Get specific invoice by ID
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const response = await api.get<ApiResponse<GetInvoiceResponse>>(`/invoices/${invoiceId}`);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get invoice');
      }

      return response.data.data.invoice;
    } catch (error) {
      console.error('Get invoice error:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to get invoice');
      }
      throw error;
    }
  }

  // Get user's invoices
  async getUserInvoices(
    status?: string,
    page: number = 1, 
    perPage: number = 20,
  ): Promise<{
    invoices: Invoice[];
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await api.get(`/invoices?${params}`);
      
      // Handle paginated response structure
      if (response.data && response.data.success) {
        // The backend returns data as an array directly in the data field for paginated responses
        const invoices = Array.isArray(response.data.data) ? response.data.data : [];
        const pagination = response.data.pagination || {
          page,
          page_size: perPage,
          total_count: 0,
          total_pages: 0,
        };
        
        return {
          invoices,
          pagination,
        };
      }
      
      // Return empty if no success or data
      return {
        invoices: [],
        pagination: {
          page,
          page_size: perPage,
          total_count: 0,
          total_pages: 0,
        },
      };
    } catch (error) {
      console.error('Get user invoices error:', error);
      if (isAxiosError(error)) {
        // Handle 401 unauthorized - user might not be logged in
        if (error.response?.status === 401) {
          return {
            invoices: [],
            pagination: {
              page,
              page_size: perPage,
              total_count: 0,
              total_pages: 0,
            },
          };
        }
        throw new Error(error.response?.data?.message || error.message || 'Failed to get user invoices');
      }
      throw error;
    }
  }

  // Cancel invoice
  async cancelInvoice(invoiceId: string, reason: string): Promise<Invoice> {
    try {
      const response = await api.post<ApiResponse<CancelInvoiceResponse>>(
        `/invoices/${invoiceId}/cancel`,
        { reason },
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to cancel invoice');
      }

      return response.data.data.invoice;
    } catch (error) {
      console.error('Cancel invoice error:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to cancel invoice');
      }
      throw error;
    }
  }

  // Helper method to format currency display
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Assuming amount is in cents
  }

  // Helper method to check if invoice can be paid
  canPayInvoice(invoice: Invoice): boolean {
    return invoice.can_be_paid && 
           invoice.status === 'pending' && 
           !invoice.is_expired;
  }

  // Helper method to get invoice status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      case 'refunded':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  // Initiate payment with multiple methods
  async initiatePayment(
    invoiceId: string,
    method: 'crypto' | 'bank_transfer' | 'card',
    email: string,
    options: {
      network?: string;
      returnUrl?: string;
    } = {},
  ): Promise<unknown> {
    try {
      const requestBody: {
        method: 'crypto' | 'bank_transfer' | 'card';
        email: string;
        network?: string;
        return_url?: string;
      } = {
        method,
        email,
      };

      // Add method-specific options
      if (method === 'crypto' && options.network) {
        requestBody.network = options.network;
      }
      if ((method === 'bank_transfer' || method === 'card') && options.returnUrl) {
        requestBody.return_url = options.returnUrl;
      }

      const response = await api.post<ApiResponse<unknown>>(
        `/invoices/${invoiceId}/payment`,
        requestBody,
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to initiate payment');
      }

      return response.data.data;
    } catch (error) {
      console.error('Initiate payment error:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to initiate payment');
      }
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(
    invoiceId: string,
    reference: string,
    provider?: 'crypto' | 'paystack' | 'stripe',
  ): Promise<unknown> {
    try {
      const params = new URLSearchParams({
        reference,
      });

      if (provider) {
        params.append('provider', provider);
      }

      const response = await api.get<ApiResponse<unknown>>(
        `/invoices/${invoiceId}/payment/status?${params}`,
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to check payment status');
      }

      return response.data.data;
    } catch (error) {
      console.error('Check payment status error:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to check payment status');
      }
      throw error;
    }
  }

  // Get available wallet balances for invoice payment using wallet service
  async getAvailableBalances(): Promise<AvailableBalance[]> {
    try {
      // Import wallet service dynamically to avoid circular dependency
      const { default: walletService } = await import('./wallet');
      const summary = await walletService.getWalletSummary();
      
      // Convert WalletBalance[] to AvailableBalance[]
      return summary.wallets.map(wallet => ({
        currency: wallet.currency,
        balance: wallet.available.display.toString(), // Convert Money to string
        usd_value: wallet.usd_value.display, // Get the numeric value
      }));
    } catch (error) {
      console.error('Get available balances error:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to get available balances');
      }
      throw error;
    }
  }

  // Pay invoice with wallet balance
  async payWithWallet(
    invoiceId: string,
    currency: string,
  ): Promise<WalletPaymentResponse> {
    try {
      const response = await api.post<ApiResponse<WalletPaymentResponse>>(
        `/invoices/${invoiceId}/pay-with-wallet`,
        { currency },
      );
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to pay invoice with wallet');
      }

      return response.data.data;
    } catch (error) {
      console.error('Pay with wallet error:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to pay invoice with wallet');
      }
      throw error;
    }
  }
}

// Export singleton instance
const invoiceService = new InvoiceService();
export default invoiceService;