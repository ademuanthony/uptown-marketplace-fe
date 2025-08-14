'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GlobeAltIcon, SparklesIcon, UsersIcon, HeartIcon } from '@heroicons/react/24/outline';
import { socialProfileService, SocialProfile } from '@/services/socialProfile';
import { interestMatchingService } from '@/services/interestMatching';
import { useAuth } from '@/hooks/useAuth';
import { UserCard } from '@/components/explore/UserCard';
import { ExploreFilters, ExploreFiltersState } from '@/components/explore/ExploreFilters';
import toast from 'react-hot-toast';

interface ExploreStats {
  totalUsers: number;
  usersWithSharedInterests: number;
  averageMatchPercentage: number;
  topMatchPercentage: number;
}

export default function ExplorePage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<SocialProfile | null>(null);
  // Removed unused matchScores state as we calculate it with useMemo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const [filters, setFilters] = useState<ExploreFiltersState>({
    searchQuery: '',
    location: '',
    verificationLevel: '',
    interestCategories: [],
    minMatchPercentage: 0,
    sortBy: 'match_score',
  });

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     window.location.href = '/auth/login';
  //     return;
  //   }
  // }, [isAuthenticated]);

  // Fetch current user's profile
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!currentUser) return;

      try {
        const profile = await socialProfileService.getMySocialProfile();
        setCurrentUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch current user profile:', error);
        // If no social profile exists, user can still browse but won't see matches
        setCurrentUserProfile(null);
      }
    };

    fetchCurrentUserProfile();
  }, [currentUser]);

  // Fetch profiles for exploration
  useEffect(() => {
    const fetchProfiles = async (page: number = 0) => {
      if (!currentUser) return;

      try {
        if (page === 0) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const limit = 20;
        const offset = page * limit;

        // Build search parameters
        const searchParams: Parameters<typeof socialProfileService.searchSocialProfiles>[0] = {
          limit,
          offset,
        };

        // Apply filters
        if (filters.searchQuery) {
          searchParams.query = filters.searchQuery;
        }
        if (filters.location) {
          searchParams.location = filters.location;
        }
        if (filters.verificationLevel) {
          searchParams.verification = filters.verificationLevel;
        }

        const result = await socialProfileService.searchSocialProfiles(searchParams);

        // Filter out current user and blocked users
        const filteredProfiles = result.profiles.filter(
          profile =>
            profile.user_id !== currentUser.id &&
            profile.visibility !== 'private' &&
            profile.settings?.show_in_discovery !== false,
        );

        if (page === 0) {
          setProfiles(filteredProfiles);
        } else {
          setProfiles(prev => [...prev, ...filteredProfiles]);
        }

        // Check if there are more results
        setHasMore(result.profiles.length === limit);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profiles';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    // Debounce search queries
    const timeoutId = setTimeout(
      () => {
        fetchProfiles(0);
        setCurrentPage(0);
      },
      filters.searchQuery ? 300 : 0,
    );

    return () => clearTimeout(timeoutId);
  }, [currentUser, filters.searchQuery, filters.location, filters.verificationLevel]);

  // Calculate match scores when profiles or current user profile changes
  const filteredAndSortedMatches = useMemo(() => {
    if (!currentUserProfile || !profiles.length || !currentUserProfile.interests?.length) {
      return [];
    }

    // Calculate match scores
    const scores = interestMatchingService.calculateMatchScores(
      currentUserProfile.interests,
      profiles,
      {
        minMatchPercentage: filters.minMatchPercentage,
        includeVerificationBonus: true,
        includeCategoryDistributionBonus: true,
        maxResults: 100,
      },
    );

    // Apply category filters
    let filteredScores = scores;
    if (filters.interestCategories.length > 0) {
      filteredScores = scores.filter(score => {
        // Check if user has interests in the selected categories
        const userCategories = Object.keys(score.categoryDistribution);
        return filters.interestCategories.some(category => userCategories.includes(category));
      });
    }

    // Apply additional text search on user info
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredScores = filteredScores.filter(score => {
        const profile = score.profile;
        return (
          profile.display_name?.toLowerCase().includes(query) ||
          profile.bio?.toLowerCase().includes(query) ||
          profile.location?.toLowerCase().includes(query) ||
          score.sharedInterests.some(interest => interest.toLowerCase().includes(query))
        );
      });
    }

    // Sort based on selected sort option
    switch (filters.sortBy) {
      case 'recent_activity':
        // Sort by updated_at (most recent first)
        return filteredScores.sort(
          (a, b) =>
            new Date(b.profile.updated_at).getTime() - new Date(a.profile.updated_at).getTime(),
        );
      case 'mutual_connections':
        // Sort by influence score as proxy for mutual connections
        return filteredScores.sort(
          (a, b) =>
            (b.profile.stats?.influence_score || 0) - (a.profile.stats?.influence_score || 0),
        );
      case 'match_score':
      default:
        // Already sorted by match score in calculateMatchScores
        return filteredScores;
    }
  }, [currentUserProfile, profiles, filters]);

  // Calculate explore stats
  const exploreStats: ExploreStats = useMemo(() => {
    const totalUsers = profiles.length;
    const usersWithSharedInterests = filteredAndSortedMatches.length;
    const averageMatchPercentage =
      usersWithSharedInterests > 0
        ? Math.round(
            filteredAndSortedMatches.reduce((sum, match) => sum + match.matchPercentage, 0) /
              usersWithSharedInterests,
          )
        : 0;
    const topMatchPercentage =
      filteredAndSortedMatches.length > 0 ? filteredAndSortedMatches[0]?.matchPercentage || 0 : 0;

    return {
      totalUsers,
      usersWithSharedInterests,
      averageMatchPercentage,
      topMatchPercentage,
    };
  }, [profiles, filteredAndSortedMatches]);

  // Load more profiles
  const loadMoreProfiles = async () => {
    if (!hasMore || loadingMore) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    // This will trigger the useEffect to fetch more profiles
  };

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Please log in to explore</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to discover new connections
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showNoInterestsMessage =
    currentUserProfile &&
    (!currentUserProfile.interests || currentUserProfile.interests.length === 0);
  const showNoMatchesMessage =
    currentUserProfile &&
    currentUserProfile.interests?.length > 0 &&
    filteredAndSortedMatches.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GlobeAltIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Discover People Like You</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with users who share your interests and discover new friendships
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{exploreStats.totalUsers}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <HeartIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {exploreStats.usersWithSharedInterests}
            </div>
            <div className="text-sm text-gray-600">With Shared Interests</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <SparklesIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {exploreStats.averageMatchPercentage}%
            </div>
            <div className="text-sm text-gray-600">Average Match</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <GlobeAltIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {exploreStats.topMatchPercentage}%
            </div>
            <div className="text-sm text-gray-600">Best Match</div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ExploreFilters
              filters={filters}
              onFiltersChange={setFilters}
              className="sticky top-8"
            />
          </div>

          {/* Main Content */}
          <div className="mt-8 lg:mt-0 lg:col-span-3">
            {/* No Interests Message */}
            {showNoInterestsMessage && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-8">
                <SparklesIcon className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Add Your Interests</h3>
                <p className="text-yellow-700 mb-4">
                  To discover people with similar interests, you need to add some interests to your
                  profile first.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Complete Your Profile
                </Link>
              </div>
            )}

            {/* No Matches Message */}
            {showNoMatchesMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mb-8">
                <GlobeAltIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-blue-800 mb-2">No Matches Found</h3>
                <p className="text-blue-700 mb-4">
                  Try adjusting your filters or adding more interests to find people with shared
                  passions.
                </p>
                <button
                  onClick={() =>
                    setFilters(prev => ({ ...prev, minMatchPercentage: 0, interestCategories: [] }))
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-800 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* User Cards Grid */}
            {filteredAndSortedMatches.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {filteredAndSortedMatches.map(matchScore => (
                    <UserCard key={matchScore.userId} matchScore={matchScore} className="h-full" />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center">
                    <button
                      onClick={loadMoreProfiles}
                      disabled={loadingMore}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading More...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
