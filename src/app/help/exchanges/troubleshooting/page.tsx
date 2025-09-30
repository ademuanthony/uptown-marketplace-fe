'use client';

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface TroubleshootingItem {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  solutions: string[];
  commonCauses: string[];
}

const troubleshootingItems: TroubleshootingItem[] = [
  {
    id: 'ip-whitelist-missing',
    title: 'IP Whitelist Not Configured',
    description: 'Trading operations fail even with valid API credentials',
    type: 'error',
    commonCauses: [
      'Trading Bot IP address (107.189.19.87) not added to exchange whitelist',
      'IP whitelist field left empty during API creation',
      'Wrong IP address entered in whitelist',
      'IP restrictions not saved properly on exchange',
      'Exchange requires IP whitelisting for trading operations',
    ],
    solutions: [
      'Add 107.189.19.87 to your exchange API whitelist immediately',
      'Recreate API key with proper IP whitelisting if needed',
      'Double-check the IP address: 107.189.19.87 (copy exactly)',
      'Save/confirm IP whitelist settings on your exchange',
      'Contact exchange support if IP whitelist options are not visible',
      'Verify IP whitelist is active and not in pending status',
    ],
  },
  {
    id: 'invalid-credentials',
    title: 'Invalid API Credentials Error',
    description: 'Connection fails with "Invalid API Key" or "Authentication failed" message',
    type: 'error',
    commonCauses: [
      'Incorrect API Key or Secret copied from exchange',
      'Extra spaces or characters when copying credentials',
      'API Key has been deleted or regenerated on exchange',
      'Wrong exchange selected in Trading Bot',
      'API Key not activated on exchange side',
    ],
    solutions: [
      'Double-check API Key and Secret are copied exactly (no extra spaces)',
      'Verify the exchange selection matches where you created the API',
      'Generate new API credentials on your exchange',
      'Ensure API Key is activated and not in pending status',
      'Try copying credentials again using copy button if available',
      'Check if API Key has expiration date and renew if needed',
    ],
  },
  {
    id: 'insufficient-permissions',
    title: 'Insufficient Permissions Error',
    description: 'API connection succeeds but trading operations fail',
    type: 'warning',
    commonCauses: [
      'API Key created with read-only permissions',
      'Trading permissions not enabled during API creation',
      'Spot trading disabled but futures enabled (or vice versa)',
      'IP restrictions preventing access - missing 107.189.19.87',
      'Account level restrictions (VIP level requirements)',
    ],
    solutions: [
      'FIRST: Ensure 107.189.19.87 is whitelisted (most common cause)',
      'Recreate API Key with "Spot Trading" and "Futures Trading" permissions',
      'Enable all required permissions: Read, Trade, and any bot-specific ones',
      'Verify your exchange account has sufficient verification level',
      'Contact exchange support if permissions seem correct but still failing',
      'Test with a new API Key to rule out permission caching issues',
    ],
  },
  {
    id: 'rate-limit-exceeded',
    title: 'Rate Limit Exceeded',
    description: 'Connection intermittently fails with rate limiting errors',
    type: 'warning',
    commonCauses: [
      'Too many API requests in short time period',
      'Multiple bots or applications using same API Key',
      'Exchange temporarily reducing API limits',
      'High-frequency trading triggering limits',
      'Shared IP address with other Trading Bot users',
    ],
    solutions: [
      'Wait 5-10 minutes before retrying connection',
      'Use separate API Keys for different applications',
      'Reduce trading frequency if using custom strategies',
      'Check exchange documentation for current rate limits',
      'Consider upgrading exchange account tier for higher limits',
      'Contact Trading Bot support if limits seem unusually low',
    ],
  },
  {
    id: 'network-timeout',
    title: 'Connection Timeout Issues',
    description: 'API connection times out or fails to establish',
    type: 'error',
    commonCauses: [
      'Temporary network connectivity issues',
      'Exchange API servers experiencing downtime',
      'Firewall blocking outgoing connections',
      'DNS resolution problems',
      'Exchange maintenance periods',
    ],
    solutions: [
      'Check exchange status page for known outages',
      'Try connecting again after a few minutes',
      'Test your internet connection to other services',
      'Try connecting from different network if possible',
      'Check if your firewall allows HTTPS connections',
      'Wait for exchange maintenance to complete',
    ],
  },
  {
    id: 'testnet-mainnet-mismatch',
    title: 'Testnet/Mainnet Configuration Mismatch',
    description: 'API Key works on exchange but not in Trading Bot',
    type: 'info',
    commonCauses: [
      'API Key created for testnet but mainnet selected in Trading Bot',
      'API Key created for mainnet but testnet selected in Trading Bot',
      "Exchange doesn't support testnet for API trading",
      'Different API endpoints for testnet vs mainnet',
    ],
    solutions: [
      'Verify if your API Key was created for testnet or mainnet',
      'Match the testnet/mainnet setting in Trading Bot to your API Key',
      'Create separate API Keys for testnet and mainnet if needed',
      'Check exchange documentation for testnet API support',
      'Start with mainnet if testnet is causing issues',
      'Use paper trading mode in Trading Bot for testing instead of testnet',
    ],
  },
  {
    id: 'passphrase-issues',
    title: 'Passphrase Problems (OKX)',
    description: 'OKX connection fails even with correct API Key and Secret',
    type: 'error',
    commonCauses: [
      'Passphrase not entered or incorrect',
      'Passphrase contains special characters causing issues',
      'Passphrase was changed on exchange but not updated in Trading Bot',
      'Case sensitivity issues with passphrase',
    ],
    solutions: [
      'Double-check passphrase is entered exactly as set on OKX',
      'Avoid special characters in passphrase when creating API Key',
      'Regenerate API Key with simple passphrase (letters and numbers only)',
      'Ensure passphrase field is not left empty for OKX',
      'Copy passphrase carefully to avoid case sensitivity issues',
      'Test passphrase on OKX API documentation page first',
    ],
  },
];

const preventionTips = [
  {
    title: 'Use Strong, Unique Passphrases',
    description:
      'Create unique passphrases for each exchange API, avoiding common words or patterns.',
  },
  {
    title: 'Enable IP Whitelisting',
    description: 'Restrict API access to specific IP addresses when supported by your exchange.',
  },
  {
    title: 'Monitor API Usage',
    description: "Regularly check your exchange's API usage logs for unusual activity.",
  },
  {
    title: 'Keep Credentials Secure',
    description: 'Store API keys securely and never share them with unauthorized parties.',
  },
  {
    title: 'Regular Security Audits',
    description:
      'Periodically review and rotate your API keys, especially after any security concerns.',
  },
  {
    title: 'Start with Testnet',
    description: 'Test your setup with testnet or paper trading before using real funds.',
  },
];

export default function TroubleshootingPage() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
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
                <Link
                  href="/help/connect-exchange"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Connect Exchange
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                <span className="text-gray-500">Troubleshooting</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <WrenchScrewdriverIcon className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Exchange Connection Troubleshooting
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Common issues and solutions when connecting your exchange to Trading Bot Trading Bot.
          </p>
        </div>

        {/* IP Address Copy Section */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-4">
              🚨 Trading Bot IP Address for Whitelisting
            </h2>
            <p className="text-red-800 mb-6">
              Most connection issues are caused by missing IP whitelisting. Copy this IP address and
              add it to your exchange API settings:
            </p>
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
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xl font-mono font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              📋 107.189.19.87
            </button>
            <p className="text-red-700 text-sm mt-3">
              👆 Click to copy • Required for ALL exchanges
            </p>
          </div>
        </div>

        {/* Quick Diagnostic */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Diagnostic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Before You Start</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-gray-700">
                    <strong>IP 107.189.19.87 is whitelisted</strong> (REQUIRED)
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">Exchange account is fully verified</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">
                    API Key was created with trading permissions
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">Credentials were copied correctly</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">Exchange is not under maintenance</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Test Your Connection</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Try these quick tests to isolate the issue:
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Test API on exchange&apos;s official API documentation</li>
                  <li>Try connecting with testnet credentials if available</li>
                  <li>Create a new API Key with minimal permissions</li>
                  <li>Check exchange status page for known issues</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Common Issues & Solutions</h2>

          {troubleshootingItems.map(item => (
            <div key={item.id} className={`rounded-2xl p-8 border ${getBgColor(item.type)}`}>
              <div className="flex items-start mb-6">
                {getIcon(item.type)}
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Common Causes</h4>
                  <ul className="space-y-2">
                    {item.commonCauses.map((cause, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2 mt-1">•</span>
                        <span className="text-gray-700 text-sm">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Solutions</h4>
                  <ul className="space-y-2">
                    {item.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prevention Tips */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <div className="flex items-center mb-6">
            <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Prevention Tips</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preventionTips.map((tip, index) => (
              <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">{tip.title}</h3>
                <p className="text-green-800 text-sm">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <ClockIcon className="h-12 w-12 mx-auto mb-4 text-primary-200" />
          <h2 className="text-2xl font-bold mb-2">Still Having Issues?</h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            If you&apos;ve tried the solutions above and are still experiencing connection problems,
            our support team is here to help you get connected.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Contact Support
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>

            <Link
              href="/help/connect-exchange"
              className="inline-flex items-center bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-400 transition-colors border border-primary-400"
            >
              Back to Setup Guide
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-primary-400">
            <p className="text-primary-100 text-sm">
              <strong>Pro Tip:</strong> Include your exchange name, error message, and steps
              you&apos;ve already tried when contacting support for faster resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
