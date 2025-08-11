'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_name?: string;
  view_count: number;
  created_at: string;
}

interface ProductsTabProps {
  userId: string;
  permalink?: string; // Made optional since it's not currently used
}

export function ProductsTab({ userId }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's products using the list products API with seller_id filter
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const queryParams = new URLSearchParams({
          seller_id: userId,
          status: 'active', // Only show active products
          page: '1',
          page_size: '20',
        });

        const response = await fetch(`${apiBaseUrl}/api/v1/products?${queryParams}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform the products to match our interface
        const transformedProducts =
          data.products?.map((product: unknown) => {
            // Type assertion for product object
            const p = product as {
              id: string;
              name: string;
              description: string;
              price: number;
              images?: Array<{ url: string }>;
              image_url?: string;
              category_name?: string;
              view_count?: number;
              created_at: string;
            };

            return {
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              image_url: p.images?.[0]?.url || p.image_url,
              category_name: p.category_name,
              view_count: p.view_count || 0,
              created_at: p.created_at,
            };
          }) || [];

        setProducts(transformedProducts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
        <p className="mt-1 text-sm text-gray-500">This user hasn&apos;t listed any products yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <Link key={product.id} href={`/products/${product.id}`} className="group">
          <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
            {/* Product Image */}
            <div className="relative w-full h-48 bg-gray-100">
              {product.image_url ? (
                <Image
                  src={getAbsoluteImageUrl(product.image_url)}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                {product.name}
              </h3>

              {product.category_name && (
                <p className="text-xs text-gray-500 mt-1">{product.category_name}</p>
              )}

              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>

              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-gray-900">
                  ₦{product.price.toLocaleString()}
                </span>

                <div className="flex items-center text-xs text-gray-500">
                  <EyeIcon className="h-3 w-3 mr-1" />
                  <span>{product.view_count}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
