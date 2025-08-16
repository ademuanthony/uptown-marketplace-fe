'use client';

import Link from 'next/link';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  HomeIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TruckIcon,
  BookOpenIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

const categories = [
  {
    slug: 'electronics',
    name: 'Electronics',
    icon: DevicePhoneMobileIcon,
    color: 'bg-secondary-100 text-secondary-600',
  },
  {
    slug: 'computers',
    name: 'Computers',
    icon: ComputerDesktopIcon,
    color: 'bg-accent-100 text-accent-600',
  },
  {
    slug: 'home-garden',
    name: 'Home & Garden',
    icon: HomeIcon,
    color: 'bg-primary-100 text-primary-600',
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    icon: ShoppingBagIcon,
    color: 'bg-primary-100 text-primary-600',
  },
  {
    slug: 'health-beauty',
    name: 'Health & Beauty',
    icon: SparklesIcon,
    color: 'bg-secondary-100 text-secondary-600',
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    icon: TruckIcon,
    color: 'bg-accent-100 text-accent-600',
  },
  { slug: 'books', name: 'Books', icon: BookOpenIcon, color: 'bg-primary-100 text-primary-600' },
  {
    slug: 'photography',
    name: 'Photography',
    icon: CameraIcon,
    color: 'bg-secondary-100 text-secondary-600',
  },
];

export default function CategoryGrid() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="flex flex-col items-center p-4 rounded-lg hover:shadow-md transition-shadow group"
            >
              <div
                className={`p-3 rounded-full ${category.color} mb-3 group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
