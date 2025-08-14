'use client';

import { useState } from 'react';
import {
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { SocialVerificationLevel } from '@/services/socialProfile';

export interface ExploreFiltersState {
  searchQuery: string;
  location: string;
  verificationLevel: SocialVerificationLevel | '';
  interestCategories: string[];
  minMatchPercentage: number;
  sortBy: 'match_score' | 'recent_activity' | 'mutual_connections';
}

interface ExploreFiltersProps {
  filters: ExploreFiltersState;
  onFiltersChange: (filters: ExploreFiltersState) => void;
  className?: string;
}

const INTEREST_CATEGORIES = [
  { id: 'lifestyle', name: 'Lifestyle', color: 'text-purple-700' },
  { id: 'sports', name: 'Sports & Fitness', color: 'text-green-700' },
  { id: 'music', name: 'Music & Arts', color: 'text-pink-700' },
  { id: 'food', name: 'Food & Dining', color: 'text-orange-700' },
  { id: 'travel', name: 'Travel', color: 'text-blue-700' },
  { id: 'technology', name: 'Technology', color: 'text-cyan-700' },
  { id: 'entertainment', name: 'Entertainment', color: 'text-yellow-700' },
  { id: 'social', name: 'Social & Community', color: 'text-red-700' },
];

const VERIFICATION_LEVELS = [
  { value: '', label: 'All Users' },
  { value: 'basic', label: 'Basic' },
  { value: 'verified', label: 'Verified' },
  { value: 'elite', label: 'Elite' },
] as const;

const SORT_OPTIONS = [
  { value: 'match_score', label: 'Best Match' },
  { value: 'recent_activity', label: 'Recent Activity' },
  { value: 'mutual_connections', label: 'Mutual Connections' },
] as const;

export function ExploreFilters({ filters, onFiltersChange, className = '' }: ExploreFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<ExploreFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleInterestCategory = (categoryId: string) => {
    const newCategories = filters.interestCategories.includes(categoryId)
      ? filters.interestCategories.filter(id => id !== categoryId)
      : [...filters.interestCategories, categoryId];

    updateFilters({ interestCategories: newCategories });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: '',
      location: '',
      verificationLevel: '',
      interestCategories: [],
      minMatchPercentage: 0,
      sortBy: 'match_score',
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.location ||
    filters.verificationLevel ||
    filters.interestCategories.length > 0 ||
    filters.minMatchPercentage > 0;

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => updateFilters({ searchQuery: e.target.value })}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search by name or bio..."
          />
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={filters.sortBy}
            onChange={e =>
              updateFilters({ sortBy: e.target.value as ExploreFiltersState['sortBy'] })
            }
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={e => updateFilters({ location: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter city or region..."
            />
          </div>

          {/* Verification Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Level
            </label>
            <select
              value={filters.verificationLevel}
              onChange={e =>
                updateFilters({ verificationLevel: e.target.value as SocialVerificationLevel | '' })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              {VERIFICATION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interest Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Interest Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INTEREST_CATEGORIES.map(category => {
                const isSelected = filters.interestCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleInterestCategory(category.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum Match Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Minimum Match Percentage: {filters.minMatchPercentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minMatchPercentage}
              onChange={e => updateFilters({ minMatchPercentage: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
