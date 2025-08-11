import api from './api';
import { isAxiosError } from 'axios';
import QRCode from 'qrcode';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Deposit address interface
export interface DepositAddress {
  id: string;
  user_id: string;
  address: string;
  chain_type: NetworkOs;
  created_at: string;
  updated_at: string;
}

// Network type for deposits
export type NetworkType = 'polygon';
export type NetworkOs = 'evm';

// Currency type for deposits
export type DepositCurrency = 'USDT' | 'POL';

// Deposit address request
export interface CreateDepositAddressRequest {
  currency: DepositCurrency;
  chain_id: number;
}

// QR code data for deposits
export interface DepositQRCode {
  address: string;
  qr_code_data_url: string;
  network: string;
  currency: string;
}

class DepositService {
  // Get or create deposit address for a specific currency/network
  async getOrCreateDepositAddress(
    currency: DepositCurrency,
    chainId: number,
  ): Promise<DepositAddress> {
    try {
      console.info('Sending deposit address request:', { currency, chain_id: chainId });

      const response = await api.post<ApiResponse<DepositAddress>>('/deposit-addresses', {
        currency,
        chain_id: chainId,
      });

      console.info('Deposit address API response:', response.data);

      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get deposit address');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get deposit address error:', error);
      if (isAxiosError(error) && error.response?.data) {
        console.error('Error response data:', error.response.data);
        throw new Error(error.response.data.message || 'API request failed');
      }
      throw new Error('Failed to get deposit address');
    }
  }

  // Get user's deposit addresses
  async getUserDepositAddresses(): Promise<DepositAddress[]> {
    try {
      const response =
        await api.get<ApiResponse<{ deposit_addresses: DepositAddress[] }>>(
          '/deposit-addresses/user',
        );

      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get deposit addresses');
      }

      return response.data.data.deposit_addresses || [];
    } catch (error) {
      console.error('Get user deposit addresses error:', error);
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get deposit addresses');
    }
  }

  // Get deposit address by chain type
  async getDepositAddressByChain(chainType: NetworkType): Promise<DepositAddress | null> {
    try {
      const response = await api.get<ApiResponse<DepositAddress>>(
        `/deposit-addresses/chain/${chainType}`,
      );

      if (!response.data?.success) {
        return null;
      }

      return response.data.data || null;
    } catch (error) {
      console.error('Get deposit address by chain error:', error);
      return null;
    }
  }

  // Generate QR code for deposit address
  async generateDepositQRCode(
    address: string,
    currency: DepositCurrency,
    network: string,
    amount?: number,
  ): Promise<DepositQRCode> {
    try {
      const qrData = this.createQRData(address, currency, network, amount);
      const qrCodeDataUrl = await this.generateQRCodeDataUrl(qrData);

      return {
        address,
        qr_code_data_url: qrCodeDataUrl,
        network,
        currency,
      };
    } catch (error) {
      console.error('Generate QR code error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Create QR code data string
  private createQRData(
    address: string,
    currency: DepositCurrency,
    network: string,
    amount?: number,
  ): string {
    let qrData = '';

    switch (network.toLowerCase()) {
      case 'polygon':
        if (currency === 'POL') {
          qrData = `ethereum:${address}`;
        } else {
          // For USDT on Polygon, include contract address
          const usdtContract = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
          qrData = `ethereum:${usdtContract}/transfer?address=${address}`;
        }
        break;
      default:
        qrData = address;
    }

    if (amount && amount > 0) {
      qrData += `${qrData.includes('?') ? '&' : '?'}value=${amount}`;
    }

    return qrData;
  }

  // Generate QR code data URL
  private async generateQRCodeDataUrl(data: string): Promise<string> {
    try {
      // Generate actual QR code using qrcode library
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Get supported networks
  getSupportedNetworks(): {
    id: number;
    name: string;
    type: NetworkType;
    os: NetworkOs;
    currencies: DepositCurrency[];
  }[] {
    return [
      {
        id: 137,
        name: 'Polygon',
        type: 'polygon',
        os: 'evm',
        currencies: ['USDT', 'POL'],
      },
    ];
  }

  // Get network by chain ID
  getNetworkByChainId(
    chainId: number,
  ): { id: number; name: string; type: NetworkType; currencies: DepositCurrency[] } | null {
    return this.getSupportedNetworks().find(network => network.id === chainId) || null;
  }

  // Get currencies for a network
  getCurrenciesForNetwork(networkType: NetworkType): DepositCurrency[] {
    const network = this.getSupportedNetworks().find(n => n.type === networkType);
    return network?.currencies || [];
  }

  // Validate deposit address format
  validateDepositAddress(address: string, network: NetworkType): boolean {
    // Basic Ethereum address validation (works for Polygon too)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

    switch (network) {
      case 'polygon':
        return ethAddressRegex.test(address);
      default:
        return false;
    }
  }

  // Get network explorer URL
  getExplorerUrl(
    network: NetworkType,
    address: string,
    type: 'address' | 'tx' = 'address',
  ): string {
    const baseUrls: Record<NetworkType, string> = {
      polygon: 'https://polygonscan.com',
    };

    const baseUrl = baseUrls[network];
    if (!baseUrl) return '';

    return `${baseUrl}/${type}/${address}`;
  }

  // Get minimum deposit amounts
  getMinimumDepositAmount(currency: DepositCurrency): number {
    const minimums: Record<DepositCurrency, number> = {
      USDT: 1, // 1 USDT minimum
      POL: 0.1, // 0.1 POL minimum
    };

    return minimums[currency] || 0;
  }

  // Format deposit instructions
  getDepositInstructions(currency: DepositCurrency, network: NetworkType): string[] {
    const instructions = [
      `Send only ${currency} tokens to this address.`,
      `Sending other tokens may result in permanent loss.`,
      `Network: ${network.charAt(0).toUpperCase() + network.slice(1)}`,
      `Minimum deposit: ${this.getMinimumDepositAmount(currency)} ${currency}`,
      'Deposits are credited after network confirmations.',
      'Processing time: 5-30 minutes depending on network congestion.',
    ];

    if (currency === 'USDT' && network === 'polygon') {
      instructions.push('Make sure to use Polygon USDT contract address.');
    }

    return instructions;
  }
}

const depositService = new DepositService();
export default depositService;
