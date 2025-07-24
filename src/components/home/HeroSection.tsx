'use client';

import SearchBar from '../common/SearchBar';
import { TruckIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const features = [
  {
    icon: TruckIcon,
    title: 'Fast Delivery',
    description: 'Get your items delivered quickly',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure Payment',
    description: 'Your transactions are protected',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Best Prices',
    description: 'Competitive prices guaranteed',
  },
];

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-secondary-100/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Find Everything You Need
            </span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Discover amazing products from trusted sellers in your area
          </p>
          
          <SearchBar className="max-w-2xl mx-auto mb-12" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full shadow-md mb-4 group-hover:from-primary-200 group-hover:to-secondary-200 transition-all duration-300">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}