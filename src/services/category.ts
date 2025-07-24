import api from './api';

export interface Category {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  is_active: boolean;
  product_count?: number; // Optional since backend doesn't always return this
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  parent_id?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
  limit: number;
  offset: number;
}

export interface CategoryResponse {
  message: string;
  category: Category;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

export const categoryService = {
  // Get all categories
  getCategories: async (params?: {
    parent_id?: string;
    active_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CategoriesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.parent_id) queryParams.append('parent_id', params.parent_id);
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await api.get<ApiResponse<CategoriesResponse>>(`/categories?${queryParams.toString()}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch categories');
    }
    
    return response.data.data;
  },

  // Get category by ID
  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch category');
    }
    
    return response.data.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const categories = await categoryService.getCategories();
    const category = categories.categories.find(cat => cat.slug === slug);
    
    if (!category) {
      throw new Error(`Category with slug '${slug}' not found`);
    }
    
    return category;
  },

  // Create category (admin only)
  createCategory: async (data: CreateCategoryData, userId: string): Promise<CategoryResponse> => {
    const response = await api.post<ApiResponse<CategoryResponse>>('/categories', data, {
      headers: {
        'X-User-ID': userId,
      },
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create category');
    }
    
    return response.data.data;
  },

  // Update category (admin only)
  updateCategory: async (id: string, data: UpdateCategoryData, userId: string): Promise<CategoryResponse> => {
    const response = await api.put<ApiResponse<CategoryResponse>>(`/categories/${id}`, data, {
      headers: {
        'X-User-ID': userId,
      },
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update category');
    }
    
    return response.data.data;
  },

  // Delete category (admin only)
  deleteCategory: async (id: string, userId: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/categories/${id}`, {
      headers: {
        'X-User-ID': userId,
      },
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to delete category');
    }
    
    return response.data.data;
  },

  // Activate category (admin only)
  activateCategory: async (id: string, userId: string): Promise<CategoryResponse> => {
    const response = await api.post<ApiResponse<CategoryResponse>>(`/categories/${id}/activate`, {}, {
      headers: {
        'X-User-ID': userId,
      },
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to activate category');
    }
    
    return response.data.data;
  },

  // Deactivate category (admin only)
  deactivateCategory: async (id: string, userId: string): Promise<CategoryResponse> => {
    const response = await api.post<ApiResponse<CategoryResponse>>(`/categories/${id}/deactivate`, {}, {
      headers: {
        'X-User-ID': userId,
      },
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to deactivate category');
    }
    
    return response.data.data;
  },
};

export default categoryService;