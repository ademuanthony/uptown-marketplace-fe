import { SocialProfile } from './socialProfile';

// Interest matching interfaces
export interface MatchScore {
  userId: string;
  profile: SocialProfile;
  sharedInterests: string[];
  matchPercentage: number;
  totalSharedCount: number;
  categoryDistribution: Record<string, number>;
}

export interface InterestMatchingOptions {
  minMatchPercentage?: number;
  includeVerificationBonus?: boolean;
  includeCategoryDistributionBonus?: boolean;
  maxResults?: number;
}

// Interest categories mapping (consistent with InterestsSection)
const INTEREST_CATEGORIES = {
  lifestyle: [
    'yoga',
    'meditation',
    'wellness',
    'mindfulness',
    'spirituality',
    'self-care',
    'health',
    'fitness',
  ],
  sports: [
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
  music: [
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
  food: [
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
  travel: [
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
  technology: [
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
  entertainment: [
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
  social: [
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
};

class InterestMatchingService {
  /**
   * Get the category of an interest
   */
  private categorizeInterest(interest: string): string | null {
    const lowerInterest = interest.toLowerCase();

    for (const [category, keywords] of Object.entries(INTEREST_CATEGORIES)) {
      if (keywords.some(keyword => lowerInterest.includes(keyword))) {
        return category;
      }
    }

    return null;
  }

  /**
   * Calculate shared interests between two users
   */
  getSharedInterests(userInterests: string[], otherUserInterests: string[]): string[] {
    const otherLowercase = otherUserInterests.map(interest => interest.toLowerCase());

    return userInterests.filter(interest => otherLowercase.includes(interest.toLowerCase()));
  }

  /**
   * Calculate category distribution for interests
   */
  private getCategoryDistribution(interests: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    interests.forEach(interest => {
      const category = this.categorizeInterest(interest);
      if (category) {
        distribution[category] = (distribution[category] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * Calculate match score between current user and another profile
   */
  calculateMatchScore(
    currentUserInterests: string[],
    otherProfile: SocialProfile,
    options: InterestMatchingOptions = {},
  ): MatchScore {
    const { includeVerificationBonus = true, includeCategoryDistributionBonus = true } = options;

    const otherUserInterests = otherProfile.interests || [];
    const sharedInterests = this.getSharedInterests(currentUserInterests, otherUserInterests);
    const totalSharedCount = sharedInterests.length;

    // Base match percentage calculation
    let matchPercentage = 0;
    if (currentUserInterests.length > 0 && otherUserInterests.length > 0) {
      // Use average of both perspectives for fairness
      const userPerspective = (totalSharedCount / currentUserInterests.length) * 100;
      const otherPerspective = (totalSharedCount / otherUserInterests.length) * 100;
      matchPercentage = (userPerspective + otherPerspective) / 2;
    }

    // Category distribution analysis
    const sharedCategoryDistribution = this.getCategoryDistribution(sharedInterests);
    const uniqueSharedCategories = Object.keys(sharedCategoryDistribution).length;

    // Apply bonuses
    if (includeCategoryDistributionBonus && uniqueSharedCategories > 1) {
      // Bonus for having interests across multiple categories (max 10% bonus)
      const categoryBonus = Math.min(uniqueSharedCategories * 2, 10);
      matchPercentage += categoryBonus;
    }

    if (includeVerificationBonus) {
      // Small bonus for verified users (2-5% based on level)
      switch (otherProfile.verification) {
        case 'basic':
          matchPercentage += 1;
          break;
        case 'verified':
          matchPercentage += 3;
          break;
        case 'elite':
          matchPercentage += 5;
          break;
      }
    }

    // Cap at 100%
    matchPercentage = Math.min(matchPercentage, 100);

    return {
      userId: otherProfile.user_id,
      profile: otherProfile,
      sharedInterests,
      matchPercentage: Math.round(matchPercentage),
      totalSharedCount,
      categoryDistribution: sharedCategoryDistribution,
    };
  }

  /**
   * Calculate match scores for multiple profiles and sort by best matches
   */
  calculateMatchScores(
    currentUserInterests: string[],
    profiles: SocialProfile[],
    options: InterestMatchingOptions = {},
  ): MatchScore[] {
    const { minMatchPercentage = 0, maxResults = 50 } = options;

    const matchScores = profiles
      .map(profile => this.calculateMatchScore(currentUserInterests, profile, options))
      .filter(match => {
        // Filter out low matches and users without interests
        return match.matchPercentage >= minMatchPercentage && match.totalSharedCount > 0;
      })
      .sort((a, b) => {
        // Primary sort: match percentage (descending)
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }

        // Secondary sort: total shared count (descending)
        if (b.totalSharedCount !== a.totalSharedCount) {
          return b.totalSharedCount - a.totalSharedCount;
        }

        // Tertiary sort: category diversity (descending)
        const aCategoryCount = Object.keys(a.categoryDistribution).length;
        const bCategoryCount = Object.keys(b.categoryDistribution).length;
        return bCategoryCount - aCategoryCount;
      });

    return matchScores.slice(0, maxResults);
  }

  /**
   * Format match percentage for display
   */
  formatMatchPercentage(percentage: number): string {
    if (percentage >= 90) return `${percentage}% Perfect Match!`;
    if (percentage >= 80) return `${percentage}% Excellent Match`;
    if (percentage >= 70) return `${percentage}% Great Match`;
    if (percentage >= 60) return `${percentage}% Good Match`;
    if (percentage >= 50) return `${percentage}% Decent Match`;
    return `${percentage}% Match`;
  }

  /**
   * Get match quality indicator
   */
  getMatchQuality(percentage: number): 'excellent' | 'great' | 'good' | 'fair' | 'poor' {
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'great';
    if (percentage >= 55) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Get color class for match percentage
   */
  getMatchColorClass(percentage: number): string {
    if (percentage >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 55) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export const interestMatchingService = new InterestMatchingService();
