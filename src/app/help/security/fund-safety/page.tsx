'use client';

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  ServerIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SecurityLayer {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  userBenefit: string;
}

const securityLayers: SecurityLayer[] = [
  {
    title: 'API-Only Access',
    description: 'Trading Bot never holds or controls your funds',
    icon: KeyIcon,
    features: [
      'Trading permissions only - never withdrawal',
      'Your funds always stay on your exchange',
      'Cannot transfer money out of your account',
      'API keys can be revoked instantly by you',
    ],
    userBenefit: 'Complete control over your funds at all times',
  },
  {
    title: 'IP Whitelisting',
    description: "Your API keys only work from Trading Bot's servers",
    icon: GlobeAltIcon,
    features: [
      'Mandatory IP restriction: 107.189.19.87',
      'Prevents unauthorized access from other locations',
      'Exchange-level security enforcement',
      'Immediate blocking of suspicious requests',
    ],
    userBenefit: 'Protection against API key theft and misuse',
  },
  {
    title: 'Encrypted Communication',
    description: 'All data transmission is secured end-to-end',
    icon: LockClosedIcon,
    features: [
      'TLS 1.3 encryption for all API calls',
      'Secure credential storage with encryption',
      'No plain text transmission of sensitive data',
      'Regular security audits and updates',
    ],
    userBenefit: 'Your trading data and credentials stay private',
  },
  {
    title: 'Real-time Monitoring',
    description: 'Continuous oversight of all trading activities',
    icon: EyeIcon,
    features: [
      '24/7 monitoring of bot activities',
      'Automatic detection of unusual patterns',
      'Instant alerts for security events',
      'Detailed audit logs of all actions',
    ],
    userBenefit: 'Immediate detection and response to any issues',
  },
  {
    title: 'Infrastructure Security',
    description: 'Enterprise-grade security for our systems',
    icon: ServerIcon,
    features: [
      'Cloud infrastructure with bank-level security',
      'Regular penetration testing',
      'Isolated environments for each user',
      'Automated backup and disaster recovery',
    ],
    userBenefit: 'Reliable, secure platform you can trust',
  },
];

const riskMitigations = [
  {
    risk: 'Exchange Hack or Downtime',
    mitigation:
      "Your funds are on the exchange, not with Trading Bot. If an exchange has issues, your funds are subject to the exchange's security and insurance policies, not ours.",
    recommendation:
      'Choose reputable exchanges with strong security track records and insurance coverage.',
  },
  {
    risk: 'API Key Compromise',
    mitigation:
      'Even if API keys were compromised, they cannot be used to withdraw funds. IP whitelisting prevents use from unauthorized locations.',
    recommendation:
      'Store API keys securely and rotate them regularly. Monitor your exchange for unusual activity.',
  },
  {
    risk: 'Trading Losses',
    mitigation:
      'Trading Bot implements risk management features, but all trading involves risk. Start small and understand the strategies.',
    recommendation:
      'Begin with minimum investment, understand the bot strategies, and never invest more than you can afford to lose.',
  },
  {
    risk: 'Trading Bot Service Disruption',
    mitigation:
      'Your funds remain on your exchange. You can disable API keys or manually trade if needed.',
    recommendation:
      'Keep your exchange login credentials secure and understand how to manage your account manually.',
  },
];

export default function FundSafetyPage() {
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
                <span className="text-gray-500">How Your Funds Stay Safe</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How Your Funds Stay Safe</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Understanding Trading Bot&apos;s security architecture and how we protect your
            investments without ever having access to your funds.
          </p>
        </div>

        {/* Core Security Promise */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white text-center mb-8">
          <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-green-200" />
          <h2 className="text-3xl font-bold mb-4">Our Core Security Promise</h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-green-100 mb-6">
              <strong>Trading Bot NEVER holds, controls, or has access to your funds.</strong>
            </p>
            <p className="text-green-100">
              Your money always stays in your exchange account. We can only trade with it, never
              withdraw or transfer it. This fundamental architecture ensures your funds remain under
              your complete control.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            How Trading Bot Accesses Your Account
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">You Create API Keys</h3>
                <p className="text-gray-700">
                  You generate API keys on your exchange with trading permissions only. These keys
                  allow Trading Bot to place buy/sell orders but cannot withdraw funds.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">IP Whitelisting Required</h3>
                <p className="text-gray-700">
                  You must whitelist Trading Bot&apos;s IP address (107.189.19.87) so your API keys
                  only work from our secure servers, preventing unauthorized access.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Trading Operations</h3>
                <p className="text-gray-700">
                  Trading Bot uses your API keys to execute trades based on your chosen strategy.
                  All operations are logged and monitored for your security.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">You Retain Full Control</h3>
                <p className="text-gray-700">
                  You can revoke API keys, pause bots, or withdraw funds directly from your exchange
                  at any time. Trading Bot cannot prevent or interfere with these actions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Layers */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Multi-Layer Security Architecture</h2>

          {securityLayers.map((layer, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-xl mr-4">
                  <layer.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{layer.title}</h3>
                  <p className="text-gray-600">{layer.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Security Features:</h4>
                  <ul className="space-y-2">
                    {layer.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Your Benefit:</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">{layer.userBenefit}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What Trading Bot Cannot Do */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-6">What Trading Bot Cannot Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-red-900 mb-3">Financial Restrictions:</h3>
              <ul className="space-y-2">
                {[
                  'Withdraw funds from your exchange',
                  'Transfer money to other accounts',
                  'Change your exchange account settings',
                  'Access your exchange login credentials',
                  'Modify your API key permissions',
                ].map((item, index) => (
                  <li key={index} className="flex items-start text-sm text-red-800">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-900 mb-3">Access Restrictions:</h3>
              <ul className="space-y-2">
                {[
                  'View your personal information',
                  'Access other exchange features',
                  'Control your exchange security settings',
                  'Prevent you from stopping the bot',
                  'Override your manual trading decisions',
                ].map((item, index) => (
                  <li key={index} className="flex items-start text-sm text-red-800">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Risk Management & Mitigation</h2>
          <div className="space-y-6">
            {riskMitigations.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start mb-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900">{item.risk}</h3>
                </div>
                <div className="ml-8 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">How we mitigate this:</h4>
                    <p className="text-gray-700 text-sm">{item.mitigation}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Our recommendation:</h4>
                    <p className="text-blue-700 text-sm">{item.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Procedures */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mb-8">
          <div className="flex items-start">
            <ClockIcon className="h-6 w-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-yellow-900 mb-4">Emergency Procedures</h2>
              <div className="space-y-4 text-yellow-800">
                <div>
                  <h3 className="font-semibold mb-2">If you need to stop trading immediately:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                    <li>Log into your Trading Bot dashboard and pause/stop all bots</li>
                    <li>Or disable API keys directly on your exchange</li>
                    <li>Your funds remain safe on the exchange</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">If you suspect security issues:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                    <li>Immediately disable API keys on your exchange</li>
                    <li>Change your exchange account password</li>
                    <li>Contact Trading Bot support for assistance</li>
                    <li>Review your exchange activity logs</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance & Auditing */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Compliance & Transparency</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
                <div>
                  <h3 className="font-semibold mb-2">Regular Audits:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Security infrastructure reviews</li>
                    <li>• Code audits by third parties</li>
                    <li>• Penetration testing</li>
                    <li>• Compliance assessments</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Transparency:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Detailed activity logs</li>
                    <li>• Real-time trading reports</li>
                    <li>• Open source components where possible</li>
                    <li>• Regular security updates</li>
                  </ul>
                </div>
              </div>
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
                <KeyIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  API Key Security Best Practices
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Learn how to keep your credentials safe
                </p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>

            <Link
              href="/help/security/permissions"
              className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                  Understanding API Permissions
                </h3>
                <p className="text-gray-600 text-sm mt-1">What permissions we need and why</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Ready to start trading securely with Trading Bot?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/help/connect-exchange"
                className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Connect Your Exchange
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Link>
              <Link
                href="/help/first-bot"
                className="inline-flex items-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Set Up Your First Bot
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
