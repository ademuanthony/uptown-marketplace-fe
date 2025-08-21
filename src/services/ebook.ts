import api from './api';
import { isAxiosError } from 'axios';

// Ebook types
export interface Author {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author?: Author;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  permalink?: string;
  cover_image?: string;
  tags: string[];
  category?: string;
  word_count?: number;
  page_count?: number;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EbookPage {
  id: string;
  ebook_id: string;
  title?: string;
  content: Record<string, unknown> | string;
  page_order: number;
  page_number?: number;
  background_color?: string;
  background_image?: string;
  settings?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EbookElement {
  id: string;
  page_id: string;
  element_type: 'text' | 'image' | 'heading' | 'list' | 'shape';
  element_data?: Record<string, unknown>;
  position?: Record<string, unknown>;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  content?: string;
  properties?: Record<string, unknown>;
  asset_url?: string;
  styles?: Record<string, unknown>;
  z_index: number;
  is_locked: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface EbookTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image?: string;
  template_data: Record<string, unknown>;
  is_public: boolean;
  created_by?: string;
  usage_count: number;
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface EbookExport {
  id: string;
  ebook_id: string;
  export_type: 'pdf' | 'html' | 'epub' | 'docx';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  export_settings: Record<string, unknown>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  expires_at?: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create ebook request
export interface CreateEbookRequest {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
}

// Update ebook request
export interface UpdateEbookRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  cover_image?: string;
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'html' | 'epub' | 'docx';
  include_cover?: boolean;
  include_toc?: boolean;
  page_size?: string;
  orientation?: string;
  margins?: Record<string, number>;
  font_size?: number;
  font_family?: string;
  custom_settings?: Record<string, unknown>;
}

class EbookService {
  // Create a new ebook
  async createEbook(ebookData: CreateEbookRequest): Promise<Ebook> {
    try {
      const response = await api.post<ApiResponse<Ebook>>('/ebooks', ebookData);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to create ebook');
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook creation error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to create ebook');
    }
  }

  // Get user's ebooks
  async getUserEbooks(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    ebooks: Ebook[];
    total: number;
    page: number;
    page_size: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      const response = await api.get<
        ApiResponse<{
          ebooks: Ebook[];
          total: number;
          page: number;
          page_size: number;
        }>
      >(`/ebooks/my?${params.toString()}`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to fetch ebooks');
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch ebooks');
    }
  }

  // Get ebook by ID
  async getEbook(ebookId: string): Promise<Ebook> {
    try {
      const response = await api.get<ApiResponse<Ebook>>(`/ebooks/${ebookId}`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to fetch ebook');
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch ebook');
    }
  }

  // Get ebook with pages for editing
  async getEbookWithPages(ebookId: string): Promise<{
    ebook: Ebook;
    pages: EbookPage[];
  }> {
    try {
      const response = await api.get<
        ApiResponse<{
          ebook: Ebook;
          pages: EbookPage[];
        }>
      >(`/ebooks/${ebookId}/pages`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to fetch ebook with pages',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook with pages fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch ebook with pages');
    }
  }

  // Update ebook
  async updateEbook(ebookId: string, ebookData: UpdateEbookRequest): Promise<Ebook> {
    try {
      const response = await api.put<ApiResponse<Ebook>>(`/ebooks/${ebookId}`, ebookData);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to update ebook');
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook update error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to update ebook');
    }
  }

  // Delete ebook
  async deleteEbook(ebookId: string): Promise<void> {
    try {
      const response = await api.delete(`/ebooks/${ebookId}`);

      if (response.status !== 204) {
        throw new Error('Failed to delete ebook');
      }
    } catch (error) {
      console.error('Ebook deletion error:', error);

      if (isAxiosError(error)) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }

        if (error.response?.status === 404) {
          throw new Error('Ebook not found');
        }

        if (error.response?.status === 403) {
          throw new Error('You are not authorized to delete this ebook');
        }
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to delete ebook');
    }
  }

  // Publish ebook
  async publishEbook(ebookId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<{ success: boolean }>>(
        `/ebooks/${ebookId}/publish`,
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to publish ebook');
      }
    } catch (error) {
      console.error('Failed to publish ebook:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to publish ebook');
    }
  }

  // Unpublish ebook
  async unpublishEbook(ebookId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<{ success: boolean }>>(
        `/ebooks/${ebookId}/unpublish`,
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to unpublish ebook');
      }
    } catch (error) {
      console.error('Failed to unpublish ebook:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to unpublish ebook');
    }
  }

  // Duplicate ebook
  async duplicateEbook(ebookId: string): Promise<Ebook> {
    try {
      const response = await api.post<ApiResponse<Ebook>>(`/ebooks/${ebookId}/duplicate`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to duplicate ebook',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook duplication error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to duplicate ebook');
    }
  }

  // Export ebook
  async exportEbook(ebookId: string, options: ExportOptions): Promise<EbookExport> {
    try {
      const response = await api.post<ApiResponse<EbookExport>>(
        `/ebooks/${ebookId}/export`,
        options,
      );

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to start export');
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook export error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to start export');
    }
  }

  // Quick PDF export
  async quickExportPDF(ebookId: string): Promise<EbookExport> {
    try {
      const response = await api.get<ApiResponse<EbookExport>>(`/ebooks/${ebookId}/export/pdf`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to start PDF export',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Quick PDF export error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to start PDF export');
    }
  }

  // Quick HTML export
  async quickExportHTML(ebookId: string): Promise<EbookExport> {
    try {
      const response = await api.get<ApiResponse<EbookExport>>(`/ebooks/${ebookId}/export/html`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to start HTML export',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Quick HTML export error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to start HTML export');
    }
  }

  // Get export by ID
  async getExport(exportId: string): Promise<EbookExport> {
    try {
      const response = await api.get<ApiResponse<EbookExport>>(`/exports/${exportId}`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to fetch export');
      }

      return response.data.data;
    } catch (error) {
      console.error('Export fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch export');
    }
  }

  // Get ebook exports
  async getEbookExports(ebookId: string): Promise<EbookExport[]> {
    try {
      const response = await api.get<ApiResponse<EbookExport[]>>(`/ebooks/${ebookId}/exports`);

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to fetch exports',
        );
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Ebook exports fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch exports');
    }
  }

  // Get user exports
  async getUserExports(limit: number = 20, offset: number = 0): Promise<EbookExport[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await api.get<ApiResponse<EbookExport[]>>(
        `/user/exports?${params.toString()}`,
      );

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to fetch user exports',
        );
      }

      return response.data.data || [];
    } catch (error) {
      console.error('User exports fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user exports');
    }
  }

  // Download export
  getExportDownloadUrl(exportId: string): string {
    return `${api.defaults.baseURL}/exports/${exportId}/download`;
  }

  // Cancel export
  async cancelExport(exportId: string): Promise<void> {
    try {
      const response = await api.delete(`/exports/${exportId}`);

      if (response.status !== 200) {
        throw new Error('Failed to cancel export');
      }
    } catch (error) {
      console.error('Export cancellation error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to cancel export');
    }
  }

  // Retry export
  async retryExport(exportId: string): Promise<EbookExport> {
    try {
      const response = await api.post<ApiResponse<EbookExport>>(`/exports/${exportId}/retry`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to retry export');
      }

      return response.data.data;
    } catch (error) {
      console.error('Export retry error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to retry export');
    }
  }

  // Search published ebooks
  async searchEbooks(
    query: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: Record<string, unknown>,
  ): Promise<{ ebooks: Ebook[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const response = await api.get<
        ApiResponse<{
          ebooks: Ebook[];
          total: number;
        }>
      >(`/ebooks/search?${params.toString()}`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to search ebooks',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Ebook search error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to search ebooks');
    }
  }

  // PAGE MANAGEMENT METHODS

  // Create a new page
  async createPage(ebookId: string, pageData: Partial<EbookPage>): Promise<EbookPage> {
    try {
      // Transform frontend data to backend format
      const backendData = {
        ebook_id: ebookId,
        page_number: pageData.page_order || 1,
        page_type: 'standard',
        title: pageData.title,
        content: pageData.content || {},
        styles: {
          background_color: pageData.background_color,
          background_image: pageData.background_image,
          ...(pageData.styles || {}),
        },
        layout: pageData.settings || {},
      };

      const response = await api.post<ApiResponse<EbookPage>>('/pages', backendData);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to create page');
      }

      return response.data.data;
    } catch (error) {
      console.error('Page creation error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to create page');
    }
  }

  // Update a page
  async updatePage(pageId: string, pageData: Partial<EbookPage>): Promise<EbookPage> {
    try {
      // Transform frontend data to backend format
      const backendData: Record<string, unknown> = {};

      if (pageData.title !== undefined) {
        backendData.title = pageData.title;
      }
      if (pageData.content !== undefined) {
        backendData.content = pageData.content;
      }
      if (
        pageData.background_color !== undefined ||
        pageData.background_image !== undefined ||
        pageData.styles !== undefined
      ) {
        backendData.styles = {
          ...(pageData.styles || {}),
          ...(pageData.background_color !== undefined && {
            background_color: pageData.background_color,
          }),
          ...(pageData.background_image !== undefined && {
            background_image: pageData.background_image,
          }),
        };
      }
      if (pageData.settings !== undefined) {
        backendData.layout = pageData.settings;
      }

      const response = await api.put<ApiResponse<EbookPage>>(`/pages/${pageId}`, backendData);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to update page');
      }

      return response.data.data;
    } catch (error) {
      console.error('Page update error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to update page');
    }
  }

  // Delete a page
  async deletePage(pageId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<{ success: boolean }>>(`/pages/${pageId}`);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Page deletion error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete page');
    }
  }

  // ELEMENT MANAGEMENT METHODS

  // Create an element
  async createElement(pageId: string, elementData: Partial<EbookElement>): Promise<EbookElement> {
    try {
      // Ensure required fields have valid values
      const safeElementData = {
        ...elementData,
        element_data: elementData.element_data || {},
        position: elementData.position || {},
        styles: elementData.styles || {},
        z_index: elementData.z_index || 1,
        is_locked: elementData.is_locked || false,
        is_visible: elementData.is_visible !== undefined ? elementData.is_visible : true,
      };

      const response = await api.post<ApiResponse<EbookElement>>(
        `/pages/${pageId}/elements`,
        safeElementData,
      );

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to create element',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Element creation error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to create element');
    }
  }

  // Update an element
  async updateElement(
    elementId: string,
    elementData: Partial<EbookElement>,
  ): Promise<EbookElement> {
    try {
      // Ensure fields are valid JSON objects if provided
      const safeElementData: Partial<EbookElement> = { ...elementData };

      if (safeElementData.element_data !== undefined && safeElementData.element_data !== null) {
        safeElementData.element_data = safeElementData.element_data || {};
      }
      if (safeElementData.position !== undefined && safeElementData.position !== null) {
        safeElementData.position = safeElementData.position || {};
      }
      if (safeElementData.styles !== undefined && safeElementData.styles !== null) {
        safeElementData.styles = safeElementData.styles || {};
      }

      const response = await api.put<ApiResponse<EbookElement>>(
        `/elements/${elementId}`,
        safeElementData,
      );

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to update element',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Element update error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to update element');
    }
  }

  // Delete an element
  async deleteElement(elementId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<{ success: boolean }>>(
        `/elements/${elementId}`,
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete element');
      }
    } catch (error) {
      console.error('Element deletion error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete element');
    }
  }

  // Get published ebooks
  async getPublishedEbooks(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    ebooks: Ebook[];
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      const response = await api.get<
        ApiResponse<{
          ebooks: Ebook[];
          total: number;
        }>
      >(`/ebooks/published?${params.toString()}`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(
          response.data?.error || response.data?.message || 'Failed to fetch published ebooks',
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Published ebooks fetch error:', error);

      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to fetch published ebooks');
    }
  }
}

export const ebookService = new EbookService();
