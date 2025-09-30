'use client';

import {
  CheckCircleIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Permission {
  name: string;
  required: boolean;
  description: string;
  whatItAllows: string[];
  whyNeeded: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ExchangePermissions {
  exchange: string;
  logo: string;
  permissions: Permission[];
  specialNotes: string[];
}

const exchangePermissions: ExchangePermissions[] = [
  {
    exchange: 'Binance',
    logo: '🟡',
    permissions: [
      {
        name: 'Spot & Margin Trading',
        required: true,
        description: 'Allows buying and selling cryptocurrencies in spot markets',
        whatItAllows: [
          'Place buy and sell orders',
          'Cancel existing orders',
          'View order history',
          'Access trading pairs',
        ],
        whyNeeded: 'Essential for automated trading strategies',
        riskLevel: 'low',
      },
      {
        name: 'Futures Trading',
        required: true,
        description: 'Enables trading in futures and derivatives markets',
        whatItAllows: [
          'Trade perpetual futures',
          'Manage leverage positions',
          'Access advanced trading features',
          'Execute complex strategies',
        ],
        whyNeeded: 'Required for advanced bot strategies and higher returns',
        riskLevel: 'medium',
      },
      {
        name: 'Read',
        required: true,
        description: 'Access to account information and balances',
        whatItAllows: [
          'View account balances',
          'Check trading history',
          'Monitor positions',
          'Access market data',
        ],
        whyNeeded: 'Necessary for bot to understand account status',
        riskLevel: 'low',
      },
    ],
    specialNotes: [
      'Never enable withdrawal permissions',
      'IP whitelisting is mandatory for trading',
      'Futures permission is required for all Trading Bot strategies',
    ],
  },
  {
    exchange: 'Bybit',
    logo: '🟠',
    permissions: [
      {
        name: 'Contract Trading',
        required: true,
        description: 'Trading derivatives and perpetual contracts',
        whatItAllows: [
          'Execute futures trades',
          'Manage contract positions',
          'Access leverage trading',
          'Use advanced order types',
        ],
        whyNeeded: 'Core functionality for Trading Bot trading strategies',
        riskLevel: 'medium',
      },
      {
        name: 'Spot Trading',
        required: true,
        description: 'Traditional cryptocurrency spot trading',
        whatItAllows: [
          'Buy and sell cryptocurrencies',
          'Place market and limit orders',
          'Access spot trading pairs',
          'Manage spot positions',
        ],
        whyNeeded: 'Required for diversified trading approaches',
        riskLevel: 'low',
      },
      {
        name: 'Wallet',
        required: true,
        description: 'Read access to wallet balances and information',
        whatItAllows: [
          'View wallet balances',
          'Check available funds',
          'Monitor position sizes',
          'Access trading history',
        ],
        whyNeeded: 'Essential for position sizing and risk management',
        riskLevel: 'low',
      },
      {
        name: 'Futures Trading',
        required: true,
        description: 'Advanced futures and options trading capabilities',
        whatItAllows: [
          'Trade futures contracts',
          'Access options markets',
          'Use advanced strategies',
          'Manage complex positions',
        ],
        whyNeeded: "Required for Trading Bot's advanced trading algorithms",
        riskLevel: 'medium',
      },
    ],
    specialNotes: [
      'All four permissions are mandatory',
      'Wallet permission does NOT allow withdrawals',
      'Contract and Futures permissions work together',
    ],
  },
  {
    exchange: 'OKX',
    logo: '🔵',
    permissions: [
      {
        name: 'Trade',
        required: true,
        description: 'General trading permission for all markets',
        whatItAllows: [
          'Execute all types of trades',
          'Access spot and futures markets',
          'Use margin trading',
          'Place complex orders',
        ],
        whyNeeded: 'Comprehensive trading access for all Trading Bot strategies',
        riskLevel: 'medium',
      },
      {
        name: 'Read',
        required: true,
        description: 'Access to account data and market information',
        whatItAllows: [
          'View account information',
          'Check balances and positions',
          'Access trading history',
          'Monitor market data',
        ],
        whyNeeded: 'Required for account monitoring and strategy execution',
        riskLevel: 'low',
      },
      {
        name: 'Futures Trading',
        required: true,
        description: 'Specific access to futures and derivatives',
        whatItAllows: [
          'Trade perpetual swaps',
          'Access futures markets',
          'Use leverage trading',
          'Execute advanced strategies',
        ],
        whyNeeded: "Essential for Trading Bot's high-performance strategies",
        riskLevel: 'medium',
      },
    ],
    specialNotes: [
      'Requires passphrase in addition to API key and secret',
      'Trade permission is very broad on OKX',
      'Never enable withdrawal permissions',
    ],
  },
  {
    exchange: 'Bitget',
    logo: '🟢',
    permissions: [
      {
        name: 'Spot Trading',
        required: true,
        description: 'Cryptocurrency spot market trading',
        whatItAllows: [
          'Trade spot markets',
          'Place buy/sell orders',
          'Access trading pairs',
          'Manage spot positions',
        ],
        whyNeeded: 'Foundation for all trading strategies',
        riskLevel: 'low',
      },
      {
        name: 'Futures Trading',
        required: true,
        description: 'Derivatives and futures market access',
        whatItAllows: [
          'Trade futures contracts',
          'Use leverage trading',
          'Access derivatives',
          'Execute advanced strategies',
        ],
        whyNeeded: "Required for Trading Bot's advanced algorithms",
        riskLevel: 'medium',
      },
      {
        name: 'Read Only',
        required: true,
        description: 'Account information and balance access',
        whatItAllows: [
          'View account details',
          'Check balances',
          'Monitor positions',
          'Access trade history',
        ],
        whyNeeded: 'Essential for account monitoring and risk management',
        riskLevel: 'low',
      },
      {
        name: 'Wallet',
        required: true,
        description: 'Wallet information and balance access',
        whatItAllows: [
          'View wallet balances',
          'Check available funds',
          'Monitor asset allocation',
          'Access transaction history',
        ],
        whyNeeded: 'Required for proper position sizing and fund management',
        riskLevel: 'low',
      },
    ],
    specialNotes: [
      'All four permissions are required',
      'Wallet permission is read-only (no withdrawals)',
      'IP whitelisting is strongly recommended',
    ],
  },
  {
    exchange: 'Hyperliquid',
    logo: '🟣',
    permissions: [
      {
        name: 'Trading',
        required: true,
        description: 'General trading access for DEX operations',
        whatItAllows: [
          'Execute trades on DEX',
          'Access perpetual markets',
          'Place and cancel orders',
          'Use advanced order types',
        ],
        whyNeeded: 'Core functionality for decentralized trading',
        riskLevel: 'medium',
      },
      {
        name: 'Read',
        required: true,
        description: 'Access to account and market data',
        whatItAllows: [
          'View account information',
          'Check positions and balances',
          'Access trading history',
          'Monitor market conditions',
        ],
        whyNeeded: 'Essential for strategy execution and monitoring',
        riskLevel: 'low',
      },
      {
        name: 'Futures Trading',
        required: true,
        description: 'Perpetual and futures trading on DEX',
        whatItAllows: [
          'Trade perpetual contracts',
          'Access leverage trading',
          'Use advanced strategies',
          'Manage complex positions',
        ],
        whyNeeded: "Required for Trading Bot's DeFi trading strategies",
        riskLevel: 'medium',
      },
    ],
    specialNotes: [
      'Decentralized exchange with wallet-based authentication',
      'IP whitelisting may not be available',
      'Requires wallet signature for API creation',
    ],
  },
];

export default function PermissionsPage() {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/help" className="text-gray-700 hover:text-primary-600">
                Help Center
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                <span className="text-gray-500">Understanding API Permissions</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Understanding API Permissions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn exactly what permissions Trading Bot needs and why. We only request the minimum
            permissions required for trading - never withdrawal access.
          </p>
        </div>

        {/* Permission Principles */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Permission Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Minimum Required</h3>
              <p className="text-green-700 text-sm">
                We only request permissions absolutely necessary for trading
              </p>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <XCircleIcon className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-red-900 mb-2">Never Withdrawals</h3>
              <p className="text-red-700 text-sm">
                We never request withdrawal or transfer permissions
              </p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">Your Funds Stay Safe</h3>
              <p className="text-blue-700 text-sm">
                Your money always remains in your exchange account
              </p>
            </div>
          </div>
        </div>

        {/* What We NEVER Access */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-3">
                🚫 What Trading Bot NEVER Accesses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-red-800">
                  <li className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                    Withdrawal permissions
                  </li>
                  <li className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                    Transfer capabilities
                  </li>
                  <li className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                    Account settings changes
                  </li>
                </ul>
                <ul className="space-y-2 text-red-800">
                  <li className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                    API key management
                  </li>
                  <li className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                    Security settings
                  </li>
                  <li className="flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                    Personal information
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange-Specific Permissions */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Required Permissions by Exchange</h2>

          {exchangePermissions.map(exchange => (
            <div
              key={exchange.exchange}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">{exchange.logo}</span>
                <h3 className="text-2xl font-bold text-gray-900">{exchange.exchange}</h3>
              </div>

              <div className="space-y-6">
                {exchange.permissions.map((permission, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <h4 className="text-lg font-semibold text-gray-900 mr-3">
                          {permission.name}
                        </h4>
                        {permission.required && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(permission.riskLevel)}`}
                      >
                        {permission.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{permission.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">What it allows:</h5>
                        <ul className="space-y-1">
                          {permission.whatItAllows.map((item, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-700">
                              <span className="text-blue-500 mr-2 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Why we need it:</h5>
                        <p className="text-sm text-gray-700">{permission.whyNeeded}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {exchange.specialNotes.length > 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Special Notes for {exchange.exchange}:
                  </h4>
                  <ul className="space-y-1">
                    {exchange.specialNotes.map((note, index) => (
                      <li key={index} className="flex items-start text-sm text-yellow-800">
                        <span className="text-yellow-600 mr-2 mt-0.5">⚠</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Permission Security */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">How Permissions Keep You Safe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-blue-900 mb-3">Trading Permissions Only</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span className="text-sm">Can execute buy and sell orders</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span className="text-sm">Can read account balances and positions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span className="text-sm">Can access trading history for analysis</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-3">What&apos;s Protected</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span className="text-sm">Cannot withdraw or transfer funds</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span className="text-sm">Cannot change account settings</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <span className="text-sm">Cannot access personal information</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Questions */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Why does Trading Bot need Futures Trading permissions?
              </h3>
              <p className="text-gray-700">
                Our advanced trading strategies (both Alpha Compounder and XPat Trader) use futures
                markets for better liquidity, lower fees, and access to leverage. This enables more
                profitable trading opportunities while maintaining risk management.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can Trading Bot access my funds with these permissions?
              </h3>
              <p className="text-gray-700">
                No. Trading permissions only allow us to buy and sell cryptocurrencies within your
                account. We cannot withdraw, transfer, or move funds out of your exchange account.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What if I accidentally enable withdrawal permissions?
              </h3>
              <p className="text-gray-700">
                If you accidentally enable withdrawal permissions, disable them immediately on your
                exchange. Trading Bot&apos;s code is designed to never use withdrawal functions, but
                it&apos;s safer to not have them enabled at all.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I revoke permissions anytime?
              </h3>
              <p className="text-gray-700">
                Yes! You can disable or delete API keys anytime from your exchange settings. This
                will immediately stop Trading Bot from trading on your account.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learn More About Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/help/security/api-security"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  API Key Security Best Practices
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Learn how to keep your API credentials safe
                </p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>

            <Link
              href="/help/security/fund-safety"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  How Your Funds Stay Safe
                </h3>
                <p className="text-gray-600 text-sm mt-1">Our complete security architecture</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Ready to set up your API keys securely?</p>
            <Link
              href="/help/connect-exchange"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Exchange Connection Guide
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
