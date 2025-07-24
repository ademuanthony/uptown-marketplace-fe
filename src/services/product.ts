import api from './api';
import { User } from './auth';

// Product types
export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: string;
  condition: 'new' | 'used' | 'refurbished';
  status: string;
  location: ProductLocation;
  images: string[];
  tags: string[];
  permalink?: string; // SEO-friendly URL slug
  created_at: string;
  updated_at: string;
}

export interface ProductLocation {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
}


// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Product creation request
export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: string;
  condition: 'new' | 'used' | 'refurbished';
  location: ProductLocation;
  images?: string[];
  tags?: string[];
}

// Product creation response (matches backend structure)
export interface CreateProductResponse {
  message: string;
  product: {
    product_id: string;
    status: string;
  };
}


// Product image upload response
export interface ProductImageUploadResponse {
  image_url: string;
  message: string;
}

class ProductService {
  // Create a new product
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      // Get current user to set seller_id
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not authenticated');
      }
      
      const user: User = JSON.parse(userStr);
      
      // Add seller_id to the request
      const requestData = {
        ...productData,
        seller_id: user.id,
        price: Math.round(productData.price * 100), // Convert to cents
      };

      const response = await api.post<ApiResponse<CreateProductResponse>>('/products', requestData);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error?.message || 'Failed to create product');
      }

      const createResponse = response.data.data;
      
      if (!createResponse.product || !createResponse.product.product_id) {
        throw new Error('Product created but no valid product ID returned');
      }

      // Return a product object with the expected structure for the frontend
      // Since backend only returns product_id and status, we create a minimal product object
      const product: Product = {
        id: createResponse.product.product_id,
        title: requestData.title,
        description: requestData.description,
        price: requestData.price,
        currency: requestData.currency,
        category_id: requestData.category_id,
        condition: requestData.condition,
        status: createResponse.product.status,
        location: requestData.location,
        images: requestData.images || [],
        tags: requestData.tags || [],
        seller_id: requestData.seller_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return product;
    } catch (error) {
      console.error('Product creation error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to create product');
    }
  }

  // Get trending products
  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    try {
      const response = await api.get<ApiResponse<{ trending_products: Product[]; count: number }>>(`/recommendations/trending?limit=${limit}`);
      
      console.log('response', response);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data?.error || 'Failed to fetch trending products');
      }

      return response.data.data.trending_products || [];
    } catch (error) {
      console.log('error', error);
      console.error('Failed to fetch trending products:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch trending products');
    }
  }

  // Publish product
  async publishProduct(productId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<{ success: boolean }>>(`/products/${productId}/publish`);
      
      if (!response.data.success) {
        throw new Error(response.data?.error || 'Failed to publish product');
      }
    } catch (error) {
      console.error('Failed to publish product:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to publish product');
    }
  }

  // Unpublish product
  async unpublishProduct(productId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<{ success: boolean }>>(`/products/${productId}/unpublish`);
      
      if (!response.data.success) {
        throw new Error(response.data?.error || 'Failed to unpublish product');
      }
    } catch (error) {
      console.error('Failed to unpublish product:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to unpublish product');
    }
  }

  // Upload product image
  async uploadProductImage(file: File, productId?: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (productId) {
        formData.append('product_id', productId);
      }

      const response = await api.post<ApiResponse<ProductImageUploadResponse>>('/products/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to upload image');
      }

      return response.data.data.image_url;
    } catch (error) {
      console.error('Image upload error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }

  // Get product by ID
  async getProduct(productId: string): Promise<Product> {
    try {
      const response = await api.get<ApiResponse<Product>>(`/products/${productId}`);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to fetch product');
      }

      return response.data.data;
    } catch (error) {
      console.error('Product fetch error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch product');
    }
  }

  // Get product by permalink
  async getProductByPermalink(permalink: string): Promise<Product> {
    try {
      const response = await api.get<ApiResponse<Product>>(`/products/permalink/${permalink}`);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to fetch product');
      }

      return response.data.data;
    } catch (error) {
      console.error('Product fetch by permalink error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch product');
    }
  }

  // Update product
  async updateProduct(productId: string, productData: Partial<CreateProductRequest>): Promise<Product> {
    try {
      // Transform the data to match backend expectations
      const transformedData: Record<string, unknown> = { ...productData };
      
      // Convert price from dollars to cents if present
      if (transformedData.price !== undefined) {
        transformedData.price = Math.round(transformedData.price * 100);
      }
      
      const response = await api.put<ApiResponse<{ product: Product }>>(`/products/${productId}`, transformedData);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to update product');
      }

      return response.data.data.product;
    } catch (error) {
      console.error('Product update error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to update product');
    }
  }

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    try {
      const response = await api.delete(`/products/${productId}`);
      
      // Backend returns 204 No Content on successful deletion
      if (response.status !== 204) {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Product deletion error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      }
      
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to delete this product');
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  }

  // List products with filters
  async listProducts(filters?: { 
    seller_id?: string; 
    page?: number; 
    page_size?: number;
    status?: string;
    category_id?: string;
    condition?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ products: Product[]; total: number; page: number; page_size: number }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        // Convert price from dollars to cents if present
        if (filters.min_price) filters.min_price = Math.round(filters.min_price * 100);
        if (filters.max_price) filters.max_price = Math.round(filters.max_price * 100);

        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined) {
            params.append(key, filters[key].toString());
          }
        });
      }

      const response = await api.get<ApiResponse<{ products: Product[]; total: number; page: number; page_size: number }>>(`/products?${params.toString()}`);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to list products');
      }

      return response.data.data;
    } catch (error) {
      console.error('Product list error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to list products');
    }
  }

  // Search products
  async searchProducts(query: string, page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>): Promise<{ products: Product[], total: number }> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      
      if (filters) {
        // Convert price from dollars to cents if present
        if (filters.min_price) filters.min_price = Math.round(filters.min_price * 100);
        if (filters.max_price) filters.max_price = Math.round(filters.max_price * 100);

        Object.keys(filters).forEach(key => {
          if (filters[key]) params.append(key, filters[key]);
        });
      }

      interface SearchResponse {
        success: boolean;
        data: {
          products: Product[];
          query: string;
        };
        pagination: {
          total: number;
          page: number;
          page_size: number;
          total_pages: number;
        };
      }

      const response = await api.get<SearchResponse>(`/products/search?${params.toString()}`);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to search products');
      }

      return {
        products: response.data.data.products || [],
        total: response.data.pagination?.total || 0
      };
    } catch (error) {
      console.error('Product search error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to search products');
    }
  }
}

export const productService = new ProductService();