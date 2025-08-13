'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { productService, Product } from '@/services/product';
import { favoritesService } from '@/services/favorites';
import { getProductImageUrl } from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import ProductCard from '@/components/products/ProductCard';

interface ProductsTabProps {
  userId: string;
  permalink?: string; // Made optional since it's not currently used
}

export function ProductsTab({ userId }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use productService to maintain consistency and proper error handling
      const response = await productService.listProducts({
        seller_id: userId,
        status: 'published', // Only show published products
        page: 1,
        page_size: 20,
      });

      setProducts(response.products);

      // Fetch favorite status for all products if user is logged in
      if (user && response.products.length > 0) {
        try {
          const productIds = response.products.map(p => p.id);
          const favStatus = await favoritesService.checkMultipleFavoriteStatus(productIds);
          setFavoriteStatus(favStatus);
        } catch (error) {
          console.error('Failed to fetch favorite status:', error);
          // Don't fail the whole component if favorites fail
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFavoriteChange = (productId: string, isFavorited: boolean) => {
    setFavoriteStatus(prev => ({
      ...prev,
      [productId]: isFavorited,
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow animate-pulse overflow-hidden">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 w-20"></div>
              <div className="h-5 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading products</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No published products</h3>
        <p className="mt-1 text-sm text-gray-500">
          This user hasn&apos;t published any products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          price={product.price / 100} // Convert from cents to dollars
          image={getProductImageUrl(product.images?.[0])}
          rating={0} // TODO: Add rating to backend response
          reviewCount={0} // TODO: Add review count to backend response
          sellerName={undefined} // Don't show seller name on their own profile
          location={
            `${product.location?.city || ''} ${product.location?.state || ''}`.trim() || undefined
          }
          isFavorited={favoriteStatus[product.id] || false}
          permalink={product.permalink}
          categoryId={product.category_id}
          onFavoriteChange={handleFavoriteChange}
        />
      ))}
    </div>
  );
}
