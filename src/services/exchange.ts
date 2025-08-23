import api from './api';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
      throw new Error(response.data.error || 'Failed to create exchange credentials');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
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
        throw new Error(error.response?.data?.error || error.message);
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
      throw new Error(response.data.error || 'Failed to get exchange credentials');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async deactivateExchangeCredentials(id: string): Promise<void> {
    try {
      const response = await api.put<ApiResponse<void>>(`/exchange-configs/${id}/deactivate`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to deactivate exchange credentials');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async deleteExchangeCredentials(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/exchange-configs/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete exchange credentials');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
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
      throw new Error(response.data.error || 'Failed to test exchange connection');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
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
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }
}

export const exchangeService = new ExchangeService();
