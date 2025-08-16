'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { productService, Product } from '@/services/product';
import { categoryService, Category } from '@/services/category';
import { searchAnalyticsService } from '@/services/searchAnalytics';
import { getProductImageUrl } from '@/utils/imageUtils';
import ProductCard from '@/components/products/ProductCard';
import Pagination from '@/components/common/Pagination';
import SearchBar from '@/components/common/SearchBar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { FunnelIcon, HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CategoryFilters {
  min_price?: string;
  max_price?: string;
  condition?: string;
  sort_by?: string;
  sort_order?: string;
}

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const categorySlug = params.category as string;
  const query = searchParams.get('q') || '';

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [filters, setFilters] = useState<CategoryFilters>({
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    condition: searchParams.get('condition') || '',
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: searchParams.get('sort_order') || 'desc',
  });

  const pageSize = 12;

  // Load category data
  useEffect(() => {
    const loadCategory = async () => {
      setCategoryLoading(true);
      try {
        const foundCategory = await categoryService.getCategoryBySlug(categorySlug);
        setCategory(foundCategory);
      } catch (error) {
        console.error('Failed to load category:', error);
        // Category not found - redirect to 404 or home
        router.push('/');
      } finally {
        setCategoryLoading(false);
      }
    };

    if (categorySlug) {
      loadCategory();
    }
  }, [categorySlug, router]);

  const updateURL = useCallback(
    (newFilters: CategoryFilters, page: number, searchQuery?: string) => {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.set('q', searchQuery);
      }
      if (page > 1) {
        params.set('page', page.toString());
      }

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const queryString = params.toString();
      const url = `/${categorySlug}${queryString ? `?${queryString}` : ''}`;
      router.push(url);
    },
    [categorySlug, router],
  );

  const searchProducts = useCallback(async () => {
    if (!category) return;

    setLoading(true);
    try {
      let results;

      if (query) {
        // Track the search query if there's a query
        await searchAnalyticsService.trackSearch(`${query} in ${category.name}`);

        // Use search API when there's a search query
        const searchFilters: Record<string, unknown> = {
          category_id: category.id,
          ...filters,
        };

        if (searchFilters.min_price)
          searchFilters.min_price = parseFloat(searchFilters.min_price as string);
        if (searchFilters.max_price)
          searchFilters.max_price = parseFloat(searchFilters.max_price as string);

        results = await productService.searchProducts(query, currentPage, pageSize, searchFilters);
      } else {
        // Use listProducts API to get all products in category when no search query
        const listFilters = {
          category_id: category.id,
          page: currentPage,
          page_size: pageSize,
          status: 'published', // Only show published products
          condition: filters.condition || undefined,
          min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
          max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
          sort_by: filters.sort_by || 'created_at',
          sort_order: filters.sort_order || 'desc',
        };

        results = await productService.listProducts(listFilters);
      }

      setProducts(results.products || []);
      setTotalPages(Math.ceil((results.total || 0) / pageSize));
      setTotalResults(results.total || 0);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, query, currentPage, filters]);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    const newFilters = { ...filters, sort_by: sortBy, sort_order: sortOrder };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1, query);
  };

  const handleFilterChange = (key: keyof CategoryFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1, query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page, query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (searchQuery: string) => {
    setCurrentPage(1);
    updateURL(filters, 1, searchQuery);
  };

  const clearFilters = () => {
    const clearedFilters: CategoryFilters = {
      sort_by: 'created_at',
      sort_order: 'desc',
      min_price: '',
      max_price: '',
      condition: '',
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    updateURL(clearedFilters, 1, query);
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category not found</h1>
          <p className="text-gray-600">The category you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.min_price || filters.max_price || filters.condition;

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <HomeIcon className="h-4 w-4" />
          <span>Home</span>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="font-medium text-gray-900">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{category.name}</h1>
          {category.description && <p className="text-gray-600 mb-6">{category.description}</p>}

          {/* Category Search */}
          <div className="max-w-2xl">
            <SearchBar
              placeholder={`Search in ${category.name}...`}
              onSearch={handleSearch}
              initialValue={query}
            />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            {query && (
              <h2 className="text-xl font-semibold text-gray-800">
                Search results for &quot;{query}&quot; in {category.name}
                {totalResults > 0 && (
                  <span className="ml-2 text-base font-normal text-gray-600">
                    ({totalResults} results)
                  </span>
                )}
              </h2>
            )}
            {!query && totalResults > 0 && (
              <h2 className="text-xl font-semibold text-gray-800">
                {totalResults} products in {category.name}
              </h2>
            )}
          </div>

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
          <aside
            className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 space-y-6`}
          >
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={`${filters.sort_by}-${filters.sort_order}`}
                  onChange={e => {
                    const [sortBy = 'created_at', sortOrder = 'desc'] = e.target.value.split('-');
                    handleSortChange(sortBy, sortOrder);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="views_count-desc">Most Viewed</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={e => handleFilterChange('min_price', e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={e => handleFilterChange('max_price', e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Condition Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={filters.condition}
                  onChange={e => handleFilterChange('condition', e.target.value)}
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
                        price={product.price ? product.price / 1e4 : 0}
                        currency={product.currency}
                        image={getProductImageUrl(product.images?.[0])}
                        rating={0}
                        reviewCount={0}
                        sellerName={undefined}
                        location={
                          product.location
                            ? `${product.location.city}, ${product.location.state}`
                            : undefined
                        }
                        permalink={product.permalink}
                        categorySlug={categorySlug}
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
                <p className="text-gray-600 mb-4">
                  {query
                    ? `No products found for &quot;${query}&quot; in ${category.name}`
                    : `No products found in ${category.name}`}
                </p>
                <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="large" />}>
      <CategoryContent />
    </Suspense>
  );
}
