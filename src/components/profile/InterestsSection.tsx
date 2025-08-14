'use client';

import { TagIcon, PencilIcon } from '@heroicons/react/24/outline';

interface InterestsSectionProps {
  interests: string[];
  className?: string;
  isOwner?: boolean;
  onEditInterests?: () => void;
}

// Interest categories with their associated colors and keywords
const INTEREST_CATEGORIES = {
  lifestyle: {
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    keywords: [
      'yoga',
      'meditation',
      'wellness',
      'mindfulness',
      'spirituality',
      'self-care',
      'health',
      'fitness',
    ],
  },
  sports: {
    color: 'bg-green-100 text-green-700 border-green-200',
    keywords: [
      'gym',
      'running',
      'hiking',
      'cycling',
      'swimming',
      'football',
      'basketball',
      'tennis',
      'soccer',
      'workout',
      'crossfit',
      'marathon',
      'climbing',
      'surfing',
      'skiing',
    ],
  },
  music: {
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    keywords: [
      'music',
      'concerts',
      'art',
      'painting',
      'dancing',
      'singing',
      'guitar',
      'piano',
      'jazz',
      'rock',
      'classical',
      'hip-hop',
      'electronic',
      'festivals',
    ],
  },
  food: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    keywords: [
      'cooking',
      'restaurants',
      'wine',
      'coffee',
      'baking',
      'foodie',
      'cuisine',
      'dining',
      'craft beer',
      'cocktails',
      'barbecue',
      'vegan',
      'vegetarian',
    ],
  },
  travel: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    keywords: [
      'travel',
      'adventure',
      'backpacking',
      'exploration',
      'wanderlust',
      'culture',
      'photography',
      'nature',
      'camping',
      'road trips',
      'beaches',
      'mountains',
    ],
  },
  technology: {
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    keywords: [
      'technology',
      'startups',
      'ai',
      'gaming',
      'coding',
      'programming',
      'blockchain',
      'cryptocurrency',
      'innovation',
      'gadgets',
      'software',
      'apps',
      'tech',
    ],
  },
  entertainment: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    keywords: [
      'movies',
      'books',
      'shows',
      'netflix',
      'reading',
      'cinema',
      'tv series',
      'podcasts',
      'anime',
      'comedy',
      'theater',
      'streaming',
    ],
  },
  social: {
    color: 'bg-red-100 text-red-700 border-red-200',
    keywords: [
      'volunteering',
      'networking',
      'community',
      'charity',
      'social impact',
      'activism',
      'mentoring',
      'leadership',
      'teamwork',
      'public speaking',
    ],
  },
};

// Default color for interests that don't match any category
const DEFAULT_INTEREST_COLOR = 'bg-gray-100 text-gray-700 border-gray-200';

/**
 * Categorizes an interest based on keywords
 */
function categorizeInterest(interest: string): string {
  const lowerInterest = interest.toLowerCase();

  for (const [_category, config] of Object.entries(INTEREST_CATEGORIES)) {
    if (config.keywords.some(keyword => lowerInterest.includes(keyword))) {
      return config.color;
    }
  }

  return DEFAULT_INTEREST_COLOR;
}

/**
 * Formats interest text for display (capitalizes first letter of each word)
 */
function formatInterest(interest: string): string {
  return interest
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function InterestsSection({
  interests,
  className = '',
  isOwner = false,
  onEditInterests,
}: InterestsSectionProps) {
  if (!interests || interests.length === 0) {
    if (isOwner) {
      // Show simplified add interests button for owner when no interests
      return (
        <div className={`${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Interests</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">None added</span>
            </div>
            <button
              onClick={onEditInterests}
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <TagIcon className="h-4 w-4 mr-1.5" />
              Add Interests
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TagIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Interests</span>
        </div>
        {isOwner && onEditInterests && (
          <button
            onClick={onEditInterests}
            className="inline-flex items-center px-2.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 text-xs font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hover:bg-gray-50"
          >
            <PencilIcon className="h-3 w-3 mr-1" />
            Edit
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {interests.map((interest, index) => {
          const colorClass = categorizeInterest(interest);
          const formattedInterest = formatInterest(interest);

          return (
            <span
              key={`${interest}-${index}`}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass} transition-colors duration-200 hover:shadow-sm`}
              title={`Interest: ${formattedInterest}`}
            >
              {formattedInterest}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default InterestsSection;
