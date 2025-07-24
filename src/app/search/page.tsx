'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productService } from '@/services/product';
import { categoryService } from '@/services/category';
import { searchAnalyticsService } from '@/services/searchAnalytics';
import { Product, Category } from '@/types';
import ProductCard from '@/components/products/ProductCard';
import Pagination from '@/components/common/Pagination';
import SearchBar from '@/components/common/SearchBar';
import { FunnelIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface SearchFilters {
  category_id?: string;
  min_price?: string;
  max_price?: string;
  condition?: string;
  sort_by?: string;
  sort_order?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const [filters, setFilters] = useState<SearchFilters>({
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    condition: searchParams.get('condition') || '',
    sort_by: searchParams.get('sort_by') || 'relevance',
    sort_order: searchParams.get('sort_order') || 'desc',
  });

  const pageSize = 12;

  const updateURL = useCallback((newFilters: SearchFilters, page: number) => {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('page', page.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    router.push(`/search?${params.toString()}`);
  }, [query, router]);

  const searchProducts = useCallback(async () => {
    if (!query) return;
    
    setLoading(true);
    try {
      // Track the search query
      await searchAnalyticsService.trackSearch(query);
      
      const searchFilters: Record<string, unknown> = { ...filters };
      if (searchFilters.min_price) searchFilters.min_price = parseInt(searchFilters.min_price);
      if (searchFilters.max_price) searchFilters.max_price = parseInt(searchFilters.max_price);
      
      const results = await productService.searchProducts(
        query,
        currentPage,
        pageSize,
        searchFilters
      );
      
      setProducts(results.products || []);
      setTotalPages(Math.ceil((results.total || 0) / pageSize));
      setTotalResults(results.total || 0);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, currentPage, filters]);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    const newFilters = { ...filters, sort_by: sortBy, sort_order: sortOrder };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      sort_by: 'relevance',
      sort_order: 'desc',
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    updateURL(clearedFilters, 1);
  };

  const hasActiveFilters = filters.category_id || filters.min_price || filters.max_price || filters.condition;

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar className="max-w-2xl mx-auto" />
        </div>

        {query && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                Search results for &quot;{query}&quot;
                {totalResults > 0 && (
                  <span className="ml-2 text-base font-normal text-gray-600">
                    ({totalResults} results)
                  </span>
                )}
              </h1>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-pink-300 rounded-lg hover:bg-pink-100 transition-colors"
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>
            </div>

            <div className="flex gap-6">
              {/* Filters Sidebar */}
              <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 space-y-6`}>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Sort Options */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort by
                    </label>
                    <select
                      value={`${filters.sort_by}-${filters.sort_order}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleSortChange(sortBy, sortOrder);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="relevance-desc">Most Relevant</option>
                      <option value="created_at-desc">Newest First</option>
                      <option value="created_at-asc">Oldest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="views_count-desc">Most Viewed</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category_id}
                      onChange={(e) => handleFilterChange('category_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.min_price}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.max_price}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Condition Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      value={filters.condition}
                      onChange={(e) => handleFilterChange('condition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Any Condition</option>
                      <option value="new">New</option>
                      <option value="like_new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>
                  </div>
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" />
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {products.map((product, index) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            const searchId = searchAnalyticsService.getLastSearchId();
                            if (searchId) {
                              searchAnalyticsService.trackSearchClick(searchId, product.id, index + 1);
                            }
                          }}
                        >
                          <ProductCard
                            id={product.id}
                            title={product.title}
                            price={product.price ? product.price / 100 : 0} // Convert from cents to dollars
                            image={product.images && product.images.length > 0 ? product.images[0] : '/api/placeholder/400/400'}
                            rating={0} // TODO: Add rating to backend response
                            reviewCount={0} // TODO: Add review count to backend response
                            sellerName={product.seller_name || undefined}
                            location={product.location ? `${product.location.city}, ${product.location.state}` : undefined}
                            permalink={product.permalink}
                            categoryId={product.category_id}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No products found for &quot;{query}&quot;</p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {!query && (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Search for products
            </h1>
            <p className="text-gray-600">
              Use the search bar above to find products, categories, or sellers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="large" />}>
      <SearchContent />
    </Suspense>
  );
}