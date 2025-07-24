'use client';

import { useEffect, useState, useCallback } from 'react';
import ProductCard from '../products/ProductCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Product, productService } from '@/services/product';
import { favoritesService } from '@/services/favorites';
import { useAuth } from '@/hooks/useAuth';

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  const fetchTrendingProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const trendingProducts = await productService.getTrendingProducts(10);
      setProducts(trendingProducts);

      // Fetch favorite status for all products if user is logged in
      if (user && trendingProducts.length > 0) {
        try {
          const productIds = trendingProducts.map(p => p.id);
          const favStatus = await favoritesService.checkMultipleFavoriteStatus(productIds);
          setFavoriteStatus(favStatus);
        } catch (error) {
          console.error('Failed to fetch favorite status:', error);
          // Don't fail the whole component if favorites fail
        }
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setError('Failed to load trending products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrendingProducts();
  }, [fetchTrendingProducts]);

  const handleFavoriteChange = (productId: string, isFavorited: boolean) => {
    setFavoriteStatus(prev => ({
      ...prev,
      [productId]: isFavorited
    }));
  };

  const scrollLeft = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setCurrentIndex((prev) => Math.min(products.length - 4, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending Products</h2>
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchTrendingProducts}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending Products</h2>
        <div className="text-center py-12 text-gray-600">
          No trending products available at the moment.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trending Products</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            disabled={currentIndex >= products.length - 4}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div 
          className="flex gap-6 transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 25}%)` }}
        >
          {products.map((product) => (
            <div key={product.id} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0">
              <ProductCard
                id={product.id}
                title={product.title}
                price={product.price / 100} // Convert from cents to dollars
                image={product.images[0] || '/api/placeholder/400/400'}
                rating={0} // TODO: Add rating to backend response
                reviewCount={0} // TODO: Add review count to backend response
                sellerName={undefined} // TODO: Add seller name to backend response
                location={`${product.location?.city || ''} ${product.location?.state || ''}`.trim() || undefined}
                isFavorited={favoriteStatus[product.id] || false}
                permalink={product.permalink}
                categoryId={product.category_id}
                onFavoriteChange={handleFavoriteChange}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}