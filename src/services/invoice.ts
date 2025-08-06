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
    unit_price: {
      amount: number;
      currency: string;
      display: string;
    };
    total_price: {
      amount: number;
      currency: string;
      display: string;
    };
    metadata: Record<string, unknown>;
  }[];
  sub_total: {
    amount: number;
    currency: string;
    display: string;
  };
  tax_amount: {
    amount: number;
    currency: string;
    display: string;
  };
  discount_amount: {
    amount: number;
    currency: string;
    display: string;
  };
  total_amount: {
    amount: number;
    currency: string;
    display: string;
  };
  currency: string;
  due_date?: string;
  paid_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
  refund_amount?: {
    amount: number;
    currency: string;
    display: string;
  };
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
    perPage: number = 20
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

      const response = await api.get<ApiResponse<GetUserInvoicesResponse>>(`/invoices?${params}`);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get user invoices');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get user invoices error:', error);
      if (isAxiosError(error)) {
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
        { reason }
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
}

// Export singleton instance
const invoiceService = new InvoiceService();
export default invoiceService;