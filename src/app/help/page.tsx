'use client';

import {
  BookOpenIcon,
  ChevronRightIcon,
  CogIcon,
  DocumentTextIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  readTime: string;
  href: string;
  popular?: boolean;
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of Trading Bot Trading Bot',
    icon: PlayCircleIcon,
    articles: [
      {
        id: 'connect-exchange',
        title: 'How to Connect Your Exchange',
        description: 'Step-by-step guide to securely connect your exchange account',
        readTime: '5 min read',
        href: '/help/connect-exchange',
        popular: true,
      },
      {
        id: 'first-bot',
        title: 'Setting Up Your First Trading Bot',
        description: 'Get started with Alpha Compounder or XPat Trader',
        readTime: '8 min read',
        href: '/help/first-bot',
        popular: true,
      },
      {
        id: 'api-permissions',
        title: 'Exchange API Permissions Explained',
        description: 'Understanding what permissions are needed and why',
        readTime: '4 min read',
        href: '/help/api-permissions',
      },
    ],
  },
  {
    id: 'exchange-setup',
    title: 'Exchange Setup',
    description: 'Detailed guides for each supported exchange',
    icon: LinkIcon,
    articles: [
      {
        id: 'binance-setup',
        title: 'Binance API Setup Guide',
        description: 'Complete guide for connecting Binance to Trading Bot',
        readTime: '6 min read',
        href: '/help/exchanges/binance',
      },
      {
        id: 'bybit-setup',
        title: 'Bybit API Setup Guide',
        description: 'Step-by-step Bybit integration instructions',
        readTime: '6 min read',
        href: '/help/exchanges/bybit',
      },
      {
        id: 'troubleshooting',
        title: 'Connection Troubleshooting',
        description: 'Common issues and solutions',
        readTime: '3 min read',
        href: '/help/exchanges/troubleshooting',
      },
    ],
  },
  {
    id: 'trading-bots',
    title: 'Trading Bots',
    description: 'Learn about our trading strategies',
    icon: CogIcon,
    articles: [
      {
        id: 'alpha-compounder',
        title: 'Alpha Compounder Strategy',
        description: 'Understanding the conservative compounding approach',
        readTime: '10 min read',
        href: '/help/bots/alpha-compounder',
      },
      {
        id: 'xpat-trader',
        title: 'XPat Trader Strategy',
        description: 'Advanced swing trading with pattern recognition',
        readTime: '12 min read',
        href: '/help/bots/xpat-trader',
      },
      {
        id: 'risk-management',
        title: 'Risk Management & Position Sizing',
        description: 'How Trading Bot protects your capital',
        readTime: '8 min read',
        href: '/help/bots/risk-management',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Safety',
    description: 'Keeping your funds and data secure',
    icon: ShieldCheckIcon,
    articles: [
      {
        id: 'api-security',
        title: 'API Key Security Best Practices',
        description: 'How to keep your API credentials safe',
        readTime: '5 min read',
        href: '/help/security/api-security',
      },
      {
        id: 'permissions',
        title: 'Understanding API Permissions',
        description: 'Why we only need trading permissions',
        readTime: '4 min read',
        href: '/help/security/permissions',
      },
      {
        id: 'fund-safety',
        title: 'How Your Funds Stay Safe',
        description: 'Our security architecture explained',
        readTime: '6 min read',
        href: '/help/security/fund-safety',
      },
    ],
  },
];

const popularArticles = helpCategories
  .flatMap(category => category.articles)
  .filter(article => article.popular);

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = helpCategories
    .map(category => ({
      ...category,
      articles: category.articles.filter(
        article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter(category => category.articles.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trading Bot Help Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about connecting exchanges, setting up trading bots, and
            maximizing your trading success.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Start Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 mb-12 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">New to Trading Bot?</h2>
              <p className="text-primary-100 mb-4">
                Start with our most popular guide to connect your first exchange and set up a
                trading bot.
              </p>
              <Link
                href="/help/connect-exchange"
                className="inline-flex items-center bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <PlayCircleIcon className="h-5 w-5 mr-2" />
                Get Started Now
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Link>
            </div>
            <div className="hidden md:block">
              <BookOpenIcon className="h-24 w-24 text-primary-200" />
            </div>
          </div>
        </div>

        {/* Popular Articles */}
        {!searchQuery && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularArticles.map(article => (
                <Link
                  key={article.id}
                  href={article.href}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {article.title}
                    </h3>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{article.description}</p>
                  <span className="text-xs text-gray-500">{article.readTime}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Help Categories */}
        <div className="space-y-12">
          {(searchQuery ? filteredCategories : helpCategories).map(category => (
            <div key={category.id} className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 p-3 rounded-xl mr-4">
                  <category.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.articles.map(article => (
                  <Link
                    key={article.id}
                    href={article.href}
                    className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{article.description}</p>
                      <span className="text-xs text-gray-500 mt-2 inline-block">
                        {article.readTime}
                      </span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 ml-3" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-16 bg-gray-100 rounded-2xl p-8 text-center">
          <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Still need help?</h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Contact Support
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
