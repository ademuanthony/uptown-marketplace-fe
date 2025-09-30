'use client';

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SecurityTip {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium';
  dos: string[];
  donts: string[];
}

const securityTips: SecurityTip[] = [
  {
    id: 'api-key-creation',
    title: 'Creating Secure API Keys',
    description: 'Best practices when generating API keys on your exchange',
    importance: 'critical',
    dos: [
      'Use descriptive names like "Trading Bot Trading Bot"',
      'Enable only required permissions (trading, not withdrawal)',
      'Set IP restrictions to 107.189.19.87 (mandatory)',
      'Enable 2FA verification during creation',
      'Save credentials immediately in a secure location',
    ],
    donts: [
      'Never enable withdrawal or transfer permissions',
      'Don\'t use generic names like "API Key 1"',
      "Don't skip IP whitelisting (trading will fail)",
      "Don't create API keys on public WiFi",
      "Don't leave API creation page open unattended",
    ],
  },
  {
    id: 'credential-storage',
    title: 'Storing API Credentials Safely',
    description: 'How to securely store and manage your API keys',
    importance: 'critical',
    dos: [
      'Use a password manager for API key storage',
      'Store in encrypted files with strong passwords',
      'Keep backup copies in separate secure locations',
      'Use unique, strong passphrases for each exchange',
      'Regularly audit and rotate API keys',
    ],
    donts: [
      'Never store API keys in plain text files',
      "Don't save credentials in browsers or emails",
      "Don't share API keys via messaging apps",
      "Don't store on shared computers or cloud drives",
      "Don't write API keys on physical paper",
    ],
  },
  {
    id: 'access-control',
    title: 'Controlling API Access',
    description: 'Managing who and what can access your trading APIs',
    importance: 'high',
    dos: [
      'Use IP whitelisting on all exchanges that support it',
      'Regularly review API usage logs on exchanges',
      'Set up alerts for unusual API activity',
      'Use separate API keys for different applications',
      'Monitor trading activity daily',
    ],
    donts: [
      "Don't allow unrestricted IP access",
      "Don't ignore unusual trading patterns",
      "Don't share API keys between multiple services",
      "Don't forget to check exchange security notifications",
      "Don't use the same API key for testing and live trading",
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Alerting',
    description: 'Staying informed about your API security status',
    importance: 'high',
    dos: [
      'Enable email alerts for API key usage',
      'Check Trading Bot dashboard daily',
      'Review exchange account activity regularly',
      'Set up balance change notifications',
      'Monitor for failed login attempts on exchanges',
    ],
    donts: [
      "Don't ignore security alerts from exchanges",
      "Don't disable important notifications",
      "Don't assume everything is fine without checking",
      "Don't delay investigating suspicious activity",
      "Don't rely solely on automated monitoring",
    ],
  },
];

const commonThreats = [
  {
    threat: 'Phishing Attacks',
    description: 'Fake websites or emails trying to steal your API keys',
    prevention: [
      'Always type exchange URLs manually',
      'Check for HTTPS and valid certificates',
      'Never click API-related links in emails',
      'Verify sender addresses carefully',
    ],
  },
  {
    threat: 'Social Engineering',
    description: 'Attackers impersonating support staff to get your credentials',
    prevention: [
      'Never share API keys with anyone claiming to be support',
      'Verify support requests through official channels',
      'Be suspicious of urgent requests for credentials',
      'Trading Bot support will never ask for your API keys',
    ],
  },
  {
    threat: 'Unsecured Networks',
    description: 'Public WiFi and unsecured connections exposing your data',
    prevention: [
      'Use VPN when on public networks',
      'Avoid API management on public WiFi',
      'Use mobile data for sensitive operations',
      'Ensure home network is properly secured',
    ],
  },
];

export default function ApiSecurityPage() {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
                <span className="text-gray-500">API Key Security Best Practices</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Key Security Best Practices</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn how to keep your API credentials safe and secure while using Trading Bot Trading
            Bot. Your security is our top priority.
          </p>
        </div>

        {/* Critical Security Alert */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                🚨 Critical Security Reminder
              </h3>
              <div className="text-red-800 space-y-2">
                <p>
                  <strong>Trading Bot will NEVER ask for your API keys or passwords.</strong>
                </p>
                <p>
                  If anyone claiming to be from Trading Bot requests your credentials, it&apos;s a
                  scam. Report it immediately.
                </p>
                <div className="bg-red-100 rounded-lg p-3 mt-3">
                  <p className="font-mono text-sm">
                    <strong>Mandatory IP:</strong> 107.189.19.87 - Always whitelist this IP for
                    trading to work
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Fundamentals */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Fundamentals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <KeyIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">API Keys</h3>
              <p className="text-blue-700 text-sm">
                Secure credentials that allow Trading Bot to trade on your behalf without accessing
                your funds
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <LockClosedIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Permissions</h3>
              <p className="text-green-700 text-sm">
                Only trading permissions needed - never withdrawal or transfer capabilities
              </p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <GlobeAltIcon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">IP Whitelisting</h3>
              <p className="text-purple-700 text-sm">
                Restrict API access to Trading Bot&apos;s servers only (107.189.19.87)
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Security Tips */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Detailed Security Guidelines</h2>

          {securityTips.map(tip => (
            <div key={tip.id} className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">{tip.title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getImportanceColor(tip.importance)}`}
                >
                  {tip.importance.toUpperCase()}
                </span>
              </div>

              <p className="text-gray-700 mb-6">{tip.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    Do&apos;s
                  </h4>
                  <ul className="space-y-2">
                    {tip.dos.map((item, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="text-green-500 mr-2 mt-0.5 flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-900 mb-4 flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                    Don&apos;ts
                  </h4>
                  <ul className="space-y-2">
                    {tip.donts.map((item, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="text-red-500 mr-2 mt-0.5 flex-shrink-0">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Common Threats */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Security Threats</h2>
          <div className="space-y-6">
            {commonThreats.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.threat}</h3>
                    <p className="text-gray-700 mb-4">{item.description}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Prevention:</h4>
                  <ul className="space-y-1">
                    {item.prevention.map((prevention, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <span className="text-blue-500 mr-2 mt-0.5">•</span>
                        {prevention}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Checklist */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-6">Security Checklist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-900">Setup Security</h3>
              <div className="space-y-2">
                {[
                  'API keys created with trading permissions only',
                  'IP 107.189.19.87 whitelisted on all exchanges',
                  'Strong, unique passphrases for each exchange',
                  '2FA enabled on all exchange accounts',
                  'API keys stored in secure password manager',
                ].map((item, index) => (
                  <label key={index} className="flex items-center text-sm text-green-800">
                    <input type="checkbox" className="mr-2 h-4 w-4 text-green-600 rounded" />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-green-900">Ongoing Security</h3>
              <div className="space-y-2">
                {[
                  'Daily monitoring of bot performance',
                  'Weekly review of exchange activity logs',
                  'Monthly API key rotation (recommended)',
                  'Immediate response to security alerts',
                  'Regular backup of important credentials',
                ].map((item, index) => (
                  <label key={index} className="flex items-center text-sm text-green-800">
                    <input type="checkbox" className="mr-2 h-4 w-4 text-green-600 rounded" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Response */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-8">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-red-900 mb-4">
                If You Suspect a Security Breach
              </h2>
              <div className="space-y-4 text-red-800">
                <div>
                  <h3 className="font-semibold mb-2">Immediate Actions:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Stop all Trading Bot bots immediately</li>
                    <li>Disable compromised API keys on exchanges</li>
                    <li>Change exchange account passwords</li>
                    <li>Review recent trading activity</li>
                    <li>Contact Trading Bot support</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Investigation Steps:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Check exchange security logs</li>
                    <li>Review API usage patterns</li>
                    <li>Scan devices for malware</li>
                    <li>Update all security credentials</li>
                    <li>Document the incident</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Security Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/help/security/permissions"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <KeyIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  Understanding API Permissions
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Learn what permissions are needed and why
                </p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>

            <Link
              href="/help/security/fund-safety"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  How Your Funds Stay Safe
                </h3>
                <p className="text-gray-600 text-sm mt-1">Our security architecture explained</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Questions about API security?</p>
            <Link
              href="/contact"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Contact Security Team
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
