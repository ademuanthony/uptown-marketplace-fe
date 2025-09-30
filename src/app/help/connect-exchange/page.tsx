'use client';

import {
  ChevronRightIcon,
  CogIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface ExchangeGuide {
  id: string;
  name: string;
  logo: string;
  description: string;
  requiresPassphrase: boolean;
  steps: string[];
  permissions: string[];
  testnetSupported: boolean;
  disabled?: boolean;
}

const supportedExchanges: ExchangeGuide[] = [
  {
    id: 'binance',
    name: 'Binance',
    logo: '🟡',
    description: "World's largest cryptocurrency exchange",
    requiresPassphrase: false,
    testnetSupported: true,
    permissions: ['Spot & Margin Trading', 'Futures Trading', 'Read'],
    steps: [
      'Log into your Binance account',
      'Navigate to API Management in your account settings',
      'Click "Create API" and choose "System generated"',
      'Enter a label like "Trading Bot Trading Bot"',
      'Complete security verification (SMS/Email)',
      'Enable "Spot & Margin Trading" and "Futures Trading" permissions',
      'IMPORTANT: Add 107.189.19.87 to IP Access Restrictions (Required)',
      'Copy your API Key and Secret Key',
      "Paste them into Trading Bot's connection form",
    ],
  },
  {
    id: 'bybit',
    name: 'Bybit',
    logo: '🟠',
    description: 'Popular derivatives trading platform',
    requiresPassphrase: false,
    testnetSupported: true,
    permissions: ['Contract Trading', 'Spot Trading', 'Wallet', 'Futures Trading'],
    disabled: true,
    steps: [
      'Sign into your Bybit account',
      'Go to Account & Security → API Management',
      'Click "Create New Key"',
      'Select "API Transaction" as the key type',
      'Enter "Trading Bot Bot" as the API key name',
      'IMPORTANT: Add 107.189.19.87 to IP restrictions (Required)',
      'Enable permissions: Contract Trading, Spot Trading, Wallet, Futures Trading',
      'Complete 2FA verification',
      'Save your API Key and Secret Key securely',
      "Enter credentials in Trading Bot's setup form",
    ],
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: '🔵',
    description: 'Leading crypto exchange and Web3 ecosystem',
    requiresPassphrase: true,
    testnetSupported: true,
    permissions: ['Trade', 'Read', 'Futures Trading'],
    disabled: true,
    steps: [
      'Access your OKX account settings',
      'Navigate to Security → API Keys',
      'Click "Create API Key"',
      'Enter "Trading Bot Trading Bot" as the API name',
      'Set a passphrase (required for OKX) - save this securely!',
      'Select permissions: Trade, Read, Futures Trading',
      'IMPORTANT: Add 107.189.19.87 to IP whitelist (Required)',
      'Complete verification process',
      'Copy API Key, Secret Key, and Passphrase',
      'Enter all three credentials in Trading Bot',
    ],
  },
  {
    id: 'bitget',
    name: 'Bitget',
    logo: '🟢',
    description: 'Copy trading and derivatives platform',
    requiresPassphrase: false,
    testnetSupported: false,
    permissions: ['Spot Trading', 'Futures Trading', 'Read Only', 'Wallet'],
    disabled: true,
    steps: [
      'Login to your Bitget account',
      'Go to Security Center → API Management',
      'Click "Create API Key"',
      'Enter "Trading Bot Bot" as the remark',
      'Select trading permissions needed: Spot Trading, Futures Trading, Read Only, Wallet',
      'IMPORTANT: Add 107.189.19.87 to IP whitelist (Required)',
      'Complete Google 2FA verification',
      'Copy the generated API Key and Secret',
      'Input credentials into Trading Bot platform',
      'Test connection to verify setup',
    ],
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    logo: '🟣',
    description: 'High-performance DEX for perpetuals',
    requiresPassphrase: false,
    testnetSupported: true,
    permissions: ['Trading', 'Read', 'Futures Trading'],
    disabled: true,
    steps: [
      'Connect your wallet to Hyperliquid',
      'Navigate to Account → API Keys',
      'Click "Generate New API Key"',
      'Enter "Trading Bot Trading Bot" as description',
      'Select required permissions for trading: Trading, Read, Futures Trading',
      'IMPORTANT: Add 107.189.19.87 to IP whitelist if available (Required)',
      'Confirm with wallet signature',
      'Copy the generated API credentials',
      'Add credentials to Trading Bot setup',
      'Verify connection is successful',
    ],
  },
];

export default function ConnectExchangePage() {
  const [selectedExchange, setSelectedExchange] = useState<string | null>('binance');

  const selectedExchangeData = supportedExchanges.find(ex => ex.id === selectedExchange);

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
                <span className="text-gray-500">Connect Exchange</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-primary-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How to Connect Your Exchange</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Securely connect your cryptocurrency exchange to Trading Bot Trading Bot using API keys.
            Your funds never leave your exchange account.
          </p>
        </div>

        {/* Overview Steps */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create API Keys</h3>
              <p className="text-gray-600 text-sm">
                Generate API credentials on your chosen exchange with trading permissions
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect to Trading Bot</h3>
              <p className="text-gray-600 text-sm">
                Enter your API credentials securely in Trading Bot&apos;s connection form
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start Trading</h3>
              <p className="text-gray-600 text-sm">
                Set up your first trading bot and begin automated trading
              </p>
            </div>
          </div>
        </div>

        {/* Exchange Selection */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Exchange</h2>
          <p className="text-gray-600 mb-6">
            Select your exchange below for detailed setup instructions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {supportedExchanges.map(exchange => (
              <button
                key={exchange.id}
                onClick={() =>
                  setSelectedExchange(exchange.id === selectedExchange ? null : exchange.id)
                }
                disabled={exchange.disabled}
                className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                  selectedExchange === exchange.id
                    ? 'border-primary-500 bg-primary-50'
                    : exchange.disabled
                      ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                {exchange.disabled && (
                  <span className="absolute top-2 right-2 text-xs bg-gray-500 text-white px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{exchange.logo}</span>
                  <div>
                    <h3
                      className={`font-semibold ${exchange.disabled ? 'text-gray-500' : 'text-gray-900'}`}
                    >
                      {exchange.name}
                    </h3>
                    {exchange.requiresPassphrase && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Requires Passphrase
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-sm ${exchange.disabled ? 'text-gray-500' : 'text-gray-600'}`}>
                  {exchange.description}
                </p>
              </button>
            ))}
          </div>

          {/* Detailed Exchange Guide */}
          {selectedExchangeData && (
            <div className="border-t border-gray-200 pt-8">
              {selectedExchangeData.disabled && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-blue-800 font-medium">
                      This exchange is not yet supported. We currently only support Binance. More
                      exchanges coming soon!
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">{selectedExchangeData.logo}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedExchangeData.name} Setup Guide
                  </h3>
                  <p className="text-gray-600">{selectedExchangeData.description}</p>
                </div>
              </div>

              {/* Required Permissions */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Required Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExchangeData.permissions.map(permission => (
                    <span
                      key={permission}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
                {selectedExchangeData.requiresPassphrase && (
                  <div className="mt-3 flex items-center text-yellow-800 bg-yellow-100 px-3 py-2 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      This exchange requires a passphrase in addition to API key and secret
                    </span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Step-by-Step Instructions</h4>
                <div className="space-y-3">
                  {selectedExchangeData.steps.map((step, index) => {
                    const isIpStep = step.includes('107.189.19.87');
                    return (
                      <div
                        key={index}
                        className={`flex items-start ${isIpStep ? 'bg-red-50 border border-red-200 rounded-lg p-3 -m-1' : ''}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0 ${
                            isIpStep
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-primary-100 text-primary-600'
                          }`}
                        >
                          {isIpStep ? '⚠' : index + 1}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`${isIpStep ? 'text-red-800 font-semibold' : 'text-gray-700'}`}
                          >
                            {step}
                          </p>
                          {isIpStep && (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText('107.189.19.87');
                                  const button = document.activeElement as HTMLButtonElement;
                                  const originalText = button.innerHTML;
                                  button.innerHTML = '✅ Copied to clipboard!';
                                  setTimeout(() => {
                                    button.innerHTML = originalText;
                                  }, 2000);
                                }}
                                className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                              >
                                📋 Copy IP: 107.189.19.87
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Security Best Practices
              </h3>
              <ul className="text-yellow-800 space-y-2">
                <li>
                  • <strong>MUST whitelist IP: 107.189.19.87</strong> (Required for trading)
                </li>
                <li>
                  • <strong>Never share your API keys</strong> with anyone else
                </li>
                <li>
                  • <strong>Start with testnet</strong> if you&apos;re new to trading bots
                </li>
                <li>
                  • <strong>Only enable required permissions</strong> (trading, not withdrawal)
                </li>
                <li>
                  • <strong>Store credentials securely</strong> and never in plain text
                </li>
                <li>
                  • <strong>Monitor your API usage</strong> regularly on your exchange
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/help/first-bot"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <CogIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  Set Up Your First Bot
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Learn how to configure Alpha Compounder or XPat Trader
                </p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>

            <Link
              href="/help/security/api-security"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  API Security Guide
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Learn best practices for keeping your API keys secure
                </p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Ready to connect your exchange and start trading?</p>
            <Link
              href="/trading-bots"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <PlayCircleIcon className="h-5 w-5 mr-2" />
              Start Trading Now
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
