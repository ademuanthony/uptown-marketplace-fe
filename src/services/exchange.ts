import api from './api';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  message?: string;
}

// Exchange types
export type ExchangeName = 'binance' | 'bybit' | 'hyperliquid' | 'okx' | 'bitget';

export interface ExchangeCredentials {
  id: string;
  user_id: string;
  account_name: string;
  exchange: ExchangeName;
  api_key: string;
  api_secret: string;
  passphrase?: string;
  is_testnet: boolean;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface MaskedExchangeCredentials {
  id: string;
  user_id: string;
  account_name: string;
  exchange: ExchangeName;
  masked_api_key: string;
  is_testnet: boolean;
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_connected?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateExchangeCredentialsInput {
  account_name: string;
  exchange: ExchangeName;
  api_key: string;
  api_secret: string;
  passphrase?: string;
  is_testnet: boolean;
  permissions?: string[];
}

export interface SupportedExchange {
  name: ExchangeName;
  display_name: string;
  requires_passphrase: boolean;
  supports_testnet: boolean;
  permissions: string[];
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    balance?: number;
    permissions?: string[];
  };
}

class ExchangeService {
  async createExchangeCredentials(
    input: CreateExchangeCredentialsInput,
  ): Promise<MaskedExchangeCredentials> {
    try {
      const response = await api.post<ApiResponse<MaskedExchangeCredentials>>(
        '/exchange-configs',
        input,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      const errorObj = response.data.error;
      const errorMessage = errorObj?.details || errorObj?.message || 'Failed to create exchange credentials';
      throw new Error(errorMessage);
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async getExchangeCredentials(): Promise<MaskedExchangeCredentials[]> {
    try {
      const response = await api.get<ApiResponse<MaskedExchangeCredentials[]>>('/exchange-configs');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async getExchangeCredentialsByID(id: string): Promise<MaskedExchangeCredentials> {
    try {
      const response = await api.get<ApiResponse<MaskedExchangeCredentials>>(
        `/exchange-configs/${id}`,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      const errorObj = response.data.error;
      const errorMessage = errorObj?.details || errorObj?.message || 'Failed to get exchange credentials';
      throw new Error(errorMessage);
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async deactivateExchangeCredentials(id: string): Promise<void> {
    try {
      const response = await api.put<ApiResponse<void>>(`/exchange-configs/${id}/deactivate`);
      if (!response.data.success) {
        const errorObj = response.data.error;
        const errorMessage = errorObj?.details || errorObj?.message || 'Failed to deactivate exchange credentials';
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async deleteExchangeCredentials(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/exchange-configs/${id}`);
      if (!response.data.success) {
        const errorObj = response.data.error;
        const errorMessage = errorObj?.details || errorObj?.message || 'Failed to delete exchange credentials';
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async testExchangeConnection(id: string): Promise<TestConnectionResult> {
    try {
      const response = await api.post<ApiResponse<TestConnectionResult>>(
        `/exchange-configs/${id}/test`,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      const errorObj = response.data.error;
      const errorMessage = errorObj?.details || errorObj?.message || 'Failed to test exchange connection';
      throw new Error(errorMessage);
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async getSupportedExchanges(): Promise<SupportedExchange[]> {
    try {
      const response = await api.get<ApiResponse<SupportedExchange[]>>('/exchanges/supported');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (isAxiosError(error)) {
        const errorObj = error.response?.data?.error;
        const errorMessage = errorObj?.details || errorObj?.message || error.message;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

export const exchangeService = new ExchangeService();
