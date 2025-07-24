'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HeartIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  MapPinIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/hooks/useAuth';
import ProductCard from '@/components/products/ProductCard';
import { favoritesService, Favorite } from '@/services/favorites';
import { Product } from '@/services/product';
import toast from 'react-hot-toast';

interface FavoriteWithProduct extends Favorite {
  product: Product;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await favoritesService.getUserFavorites();
      setFavorites(response.favorites.filter(fav => fav.product) as FavoriteWithProduct[]);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await favoritesService.removeFromFavorites(productId);
      setFavorites(prev => prev.filter(fav => fav.product_id !== productId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const handleFavoriteChange = (productId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      // Remove from the list if unfavorited
      setFavorites(prev => prev.filter(fav => fav.product_id !== productId));
    }
  };

  const handleClearAllFavorites = async () => {
    if (window.confirm('Are you sure you want to clear all favorites?')) {
      try {
        // Remove all favorites one by one
        const promises = favorites.map(fav => favoritesService.removeFromFavorites(fav.product_id));
        await Promise.all(promises);
        
        setFavorites([]);
        toast.success('All favorites cleared');
      } catch (error) {
        console.error('Error clearing favorites:', error);
        toast.error('Failed to clear favorites');
      }
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Get unique categories from favorites
  const categories = Array.from(new Set(favorites.map(item => item.product?.category_id || '')));

  const filteredFavorites = favorites.filter(item => {
    const matchesSearch = item.product?.title.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesCategory = categoryFilter === 'all' || item.product?.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <HeartSolidIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
            </div>
            {favorites.length > 0 && (
              <button
                onClick={handleClearAllFavorites}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          
          <p className="text-gray-600">
            {favorites.length === 0 
              ? "You haven't added any items to your favorites yet."
              : `${favorites.length} items in your favorites`
            }
          </p>
        </div>

        {favorites.length > 0 && (
          <>
            {/* Filters and Search */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search favorites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="sm:w-48">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Empty Search Results */}
            {filteredFavorites.length === 0 && (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}

            {/* Favorites Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
              {filteredFavorites.map((item) => {
                if (!item.product) return null;
                
                return (
                  <div key={item.favorite_id} className="relative">
                    {viewMode === 'grid' ? (
                      <div className="relative">
                        <ProductCard
                          id={item.product.id}
                          title={item.product.title}
                          price={item.product.price / 100} // Convert from cents to dollars
                          image={item.product.images[0] || '/api/placeholder/400/400'}
                          rating={0} // TODO: Add rating from backend
                          reviewCount={0} // TODO: Add review count from backend
                          sellerName={undefined} // TODO: Add seller name from backend
                          location={`${item.product.location?.city || ''} ${item.product.location?.state || ''}`.trim() || undefined}
                          isFavorited={true}
                          permalink={item.product.permalink}
                          categoryId={item.product.category_id}
                          onFavoriteChange={handleFavoriteChange}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4">
                        <Link href={item.product.permalink ? `/products/${item.product.permalink}` : `/products/${item.product.id}`}>
                          <img
                            src={item.product.images[0] || '/api/placeholder/150/150'}
                            alt={item.product.title}
                            className="h-24 w-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          />
                        </Link>
                        
                        <div className="flex-1">
                          <Link 
                            href={item.product.permalink ? `/products/${item.product.permalink}` : `/products/${item.product.id}`}
                            className="text-lg font-medium text-gray-900 hover:text-primary-600"
                          >
                            {item.product.title}
                          </Link>
                          
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {`${item.product.location?.city || ''} ${item.product.location?.state || ''}`.trim() || 'Location not specified'}
                            </span>
                            <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="mt-2 text-xl font-semibold text-gray-900">
                            ${(item.product.price / 100).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            href={item.product.permalink ? `/products/${item.product.permalink}` : `/products/${item.product.id}`}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleRemoveFavorite(item.product_id)}
                            className="p-2 text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {favorites.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No favorites yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start adding items to your favorites to see them here.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Browse Products
              </Link>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64"></div>
                <div className="mt-2 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}