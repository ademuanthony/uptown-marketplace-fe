'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import { favoritesService } from '@/services/favorites';
import { categoryService } from '@/services/category';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  rating?: number;
  reviewCount?: number;
  sellerName?: string;
  location?: string;
  isFavorited?: boolean;
  permalink?: string; // SEO-friendly URL slug
  categorySlug?: string; // Category slug for URL structure
  categoryId?: string; // Category ID for fetching slug if not provided
  onFavoriteChange?: (productId: string, isFavorited: boolean) => void; // Callback for parent components
}

export default function ProductCard({
  id,
  title,
  price,
  currency,
  image,
  rating = 0,
  reviewCount = 0,
  sellerName,
  location,
  isFavorited = false,
  permalink,
  categorySlug,
  categoryId,
  onFavoriteChange,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavorited);
  const [isToggling, setIsToggling] = useState(false);
  const { user } = useAuth();

  // Generate a simple permalink from title if none provided
  const generateSimplePermalink = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Use provided data or generate fallbacks
  const finalPermalink = permalink || generateSimplePermalink(title);

  // For category slug, we need to handle async fetching for search results
  const [resolvedCategorySlug, setResolvedCategorySlug] = useState(categorySlug);

  // Fetch category slug if we have categoryId but no categorySlug (e.g., from search results)
  useEffect(() => {
    if (categoryId && !categorySlug && !resolvedCategorySlug) {
      categoryService
        .getCategory(categoryId)
        .then(category => {
          // Since category doesn't have slug, use name as fallback
          if (category.name) {
            setResolvedCategorySlug(category.name.toLowerCase().replace(/\s+/g, '-'));
          }
        })
        .catch(() => {
          // Ignore errors, use fallback URL
        });
    }
  }, [categoryId, categorySlug, resolvedCategorySlug]);

  const finalCategorySlug = resolvedCategorySlug;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    if (isToggling) {
      return; // Prevent multiple API calls
    }

    setIsToggling(true);

    try {
      const newFavoriteStatus = await favoritesService.toggleFavorite(id);
      setIsFavorite(newFavoriteStatus);

      // Notify parent component about the change
      if (onFavoriteChange) {
        onFavoriteChange(id, newFavoriteStatus);
      }

      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update favorites');
    } finally {
      setIsToggling(false);
    }
  };

  // Use new category-based URL structure if both permalink and categorySlug are available
  // Otherwise fall back to old structure
  const productUrl =
    finalPermalink && finalCategorySlug
      ? `/${finalCategorySlug}/${finalPermalink}`
      : finalPermalink
        ? `/products/${finalPermalink}`
        : `/products/${id}`;

  return (
    <Link href={productUrl} className="group">
      <div className="relative overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-square">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={toggleFavorite}
            disabled={isToggling}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isToggling ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : isFavorite ? (
              <HeartSolidIcon className="h-5 w-5 text-primary-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{title}</h3>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-secondary-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-400">({reviewCount})</span>
          </div>

          <p className="text-xl font-semibold text-gray-900 mb-2">
            {currency === 'USD' ? '$' : '₦'}
            {price.toFixed(2)}
          </p>

          {(sellerName || location) && (
            <div className="text-sm text-gray-500">
              {sellerName && <p className="truncate">{sellerName}</p>}
              {location && <p className="truncate">{location}</p>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
