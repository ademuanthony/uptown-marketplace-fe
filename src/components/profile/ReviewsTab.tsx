'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  product_name?: string;
  created_at: string;
  type: 'product' | 'seller';
}

interface ReviewsTabProps {
  userId: string;
}

export function ReviewsTab({ userId }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to get user's reviews
        // For now, we'll show a placeholder

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data - replace with actual API call
        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load reviews';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star}>
            {star <= rating ? (
              <StarIcon className={`${sizeClass} text-yellow-400`} />
            ) : (
              <StarOutlineIcon className={`${sizeClass} text-gray-300`} />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <StarOutlineIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading reviews</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <StarOutlineIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          This user hasn&apos;t received any reviews yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Reviews Summary</h3>
            <div className="mt-2 flex items-center space-x-2">
              {renderStars(Math.round(averageRating), 'md')}
              <span className="text-lg font-medium text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({totalReviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            {/* Review Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.reviewer_name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                  </div>
                </div>
              </div>

              {review.type === 'product' && review.product_name && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Product Review</p>
                  <p className="text-sm font-medium text-gray-900">{review.product_name}</p>
                </div>
              )}

              {review.type === 'seller' && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Seller Review</p>
                </div>
              )}
            </div>

            {/* Review Content */}
            {review.comment && (
              <div className="mt-4">
                <p className="text-gray-700">{review.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
