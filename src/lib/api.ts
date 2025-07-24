import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { 
  APIResponse, 
  APIError, 
  AuthResponse,
  User,
  UserLoginRequest,
  UserRegistrationRequest,
  Product,
  ProductSearchRequest,
  CreateProductRequest,
  Category,
  SocialProfile,
  SocialConnection,
  Conversation,
  Message,
  ProductReview,
  PremiumListing,
  Shipment,
  PaginatedResponse
} from '@/types/api';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
};

// Initialize token from localStorage
if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem('auth_token');
  if (savedToken) {
    setAuthToken(savedToken);
  }
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add user ID header if available
    const userId = localStorage.getItem('user_id');
    if (userId) {
      config.headers['X-User-ID'] = userId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      setAuthToken(null);
      localStorage.removeItem('user_id');
      
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic API request function
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      method,
      url: endpoint,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError: APIError = {
        error: error.response?.data?.error || 'Network Error',
        message: error.response?.data?.message || error.message,
        code: error.response?.data?.code,
        details: error.response?.data?.details,
      };
      throw apiError;
    }
    throw error;
  }
}

// Authentication API
export const authAPI = {
  login: (credentials: UserLoginRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('POST', '/auth/login', credentials),

  register: (userData: UserRegistrationRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('POST', '/auth/register', userData),

  logout: (): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', '/auth/logout'),

  refreshToken: (): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('POST', '/auth/refresh'),

  forgotPassword: (email: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', '/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', '/auth/reset-password', { token, password }),

  verifyEmail: (token: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', '/auth/verify-email', { token }),
};

// Users API
export const usersAPI = {
  getProfile: (): Promise<User> =>
    apiRequest<User>('GET', '/users/profile'),

  updateProfile: (userData: Partial<User>): Promise<User> =>
    apiRequest<User>('PUT', '/users/profile', userData),

  getUserById: (userId: string): Promise<User> =>
    apiRequest<User>('GET', `/users/${userId}`),

  searchUsers: (query: string, limit = 20, offset = 0): Promise<PaginatedResponse<User>> =>
    apiRequest<PaginatedResponse<User>>('GET', `/users/search?query=${query}&limit=${limit}&offset=${offset}`),
};

// Products API
export const productsAPI = {
  getProducts: (params?: ProductSearchRequest): Promise<PaginatedResponse<Product>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    return apiRequest<PaginatedResponse<Product>>('GET', `/products?${searchParams}`);
  },

  getProduct: (productId: string): Promise<Product> =>
    apiRequest<Product>('GET', `/products/${productId}`),

  createProduct: (productData: CreateProductRequest): Promise<Product> =>
    apiRequest<Product>('POST', '/products', productData),

  updateProduct: (productId: string, productData: Partial<CreateProductRequest>): Promise<Product> =>
    apiRequest<Product>('PUT', `/products/${productId}`, productData),

  deleteProduct: (productId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/products/${productId}`),

  searchProducts: (params: ProductSearchRequest): Promise<PaginatedResponse<Product>> =>
    apiRequest<PaginatedResponse<Product>>('GET', '/products/search', { params }),

  getFeaturedProducts: (limit = 20): Promise<Product[]> =>
    apiRequest<Product[]>('GET', `/products/featured?limit=${limit}`),

  getRecommendedProducts: (limit = 20): Promise<Product[]> =>
    apiRequest<Product[]>('GET', `/products/recommended?limit=${limit}`),

  addToFavorites: (productId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', `/products/${productId}/favorite`),

  removeFromFavorites: (productId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/products/${productId}/favorite`),

  getFavorites: (limit = 20, offset = 0): Promise<PaginatedResponse<Product>> =>
    apiRequest<PaginatedResponse<Product>>('GET', `/products/favorites?limit=${limit}&offset=${offset}`),
};

// Categories API
export const categoriesAPI = {
  getCategories: (): Promise<Category[]> =>
    apiRequest<Category[]>('GET', '/categories'),

  getCategory: (categoryId: string): Promise<Category> =>
    apiRequest<Category>('GET', `/categories/${categoryId}`),

  getCategoryHierarchy: (): Promise<Category[]> =>
    apiRequest<Category[]>('GET', '/categories/hierarchy'),

  getCategoryProducts: (categoryId: string, limit = 20, offset = 0): Promise<PaginatedResponse<Product>> =>
    apiRequest<PaginatedResponse<Product>>('GET', `/categories/${categoryId}/products?limit=${limit}&offset=${offset}`),
};

// Social API
export const socialAPI = {
  // Profile management
  createProfile: (profileData: Partial<SocialProfile>): Promise<SocialProfile> =>
    apiRequest<SocialProfile>('POST', '/social/profile', profileData),

  getProfile: (userId: string): Promise<SocialProfile> =>
    apiRequest<SocialProfile>('GET', `/social/profile/${userId}`),

  getMyProfile: (): Promise<SocialProfile> =>
    apiRequest<SocialProfile>('GET', '/social/profile/me'),

  updateProfile: (profileData: Partial<SocialProfile>): Promise<SocialProfile> =>
    apiRequest<SocialProfile>('PUT', '/social/profile', profileData),

  deleteProfile: (): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', '/social/profile'),

  searchProfiles: (params: Record<string, unknown>): Promise<PaginatedResponse<SocialProfile>> =>
    apiRequest<PaginatedResponse<SocialProfile>>('GET', '/social/profiles/search', { params }),

  // Connections
  followUser: (userId: string): Promise<SocialConnection> =>
    apiRequest<SocialConnection>('POST', `/social/users/${userId}/follow`),

  unfollowUser: (userId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/social/users/${userId}/unfollow`),

  sendFriendRequest: (userId: string, message?: string): Promise<SocialConnection> =>
    apiRequest<SocialConnection>('POST', `/social/users/${userId}/friend-request`, { message }),

  acceptFriendRequest: (userId: string): Promise<SocialConnection> =>
    apiRequest<SocialConnection>('PUT', `/social/users/${userId}/friend-request/accept`),

  rejectFriendRequest: (userId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('PUT', `/social/users/${userId}/friend-request/reject`),

  removeFriend: (userId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/social/users/${userId}/remove-friend`),

  blockUser: (userId: string): Promise<SocialConnection> =>
    apiRequest<SocialConnection>('POST', `/social/users/${userId}/block`),

  unblockUser: (userId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/social/users/${userId}/unblock`),

  getFollowers: (userId: string, limit = 20, offset = 0): Promise<PaginatedResponse<User>> =>
    apiRequest<PaginatedResponse<User>>('GET', `/social/users/${userId}/followers?limit=${limit}&offset=${offset}`),

  getFollowing: (userId: string, limit = 20, offset = 0): Promise<PaginatedResponse<User>> =>
    apiRequest<PaginatedResponse<User>>('GET', `/social/users/${userId}/following?limit=${limit}&offset=${offset}`),

  getFriends: (userId: string, limit = 20, offset = 0): Promise<PaginatedResponse<User>> =>
    apiRequest<PaginatedResponse<User>>('GET', `/social/users/${userId}/friends?limit=${limit}&offset=${offset}`),

  getPendingRequests: (limit = 20, offset = 0): Promise<PaginatedResponse<SocialConnection>> =>
    apiRequest<PaginatedResponse<SocialConnection>>('GET', `/social/friend-requests/pending?limit=${limit}&offset=${offset}`),

  getConnectionStatus: (userId: string): Promise<{ connected: boolean; connection_type?: string }> =>
    apiRequest<{ connected: boolean; connection_type?: string }>('GET', `/social/users/${userId}/connection-status`),
};

// Messaging API
export const messagingAPI = {
  getConversations: (limit = 20, offset = 0): Promise<PaginatedResponse<Conversation>> =>
    apiRequest<PaginatedResponse<Conversation>>('GET', `/messaging/conversations?limit=${limit}&offset=${offset}`),

  getConversation: (conversationId: string): Promise<Conversation> =>
    apiRequest<Conversation>('GET', `/messaging/conversations/${conversationId}`),

  createConversation: (participantIds: string[], title?: string): Promise<Conversation> =>
    apiRequest<Conversation>('POST', '/messaging/conversations', { participantIds, title }),

  getMessages: (conversationId: string, limit = 50, offset = 0): Promise<PaginatedResponse<Message>> =>
    apiRequest<PaginatedResponse<Message>>('GET', `/messaging/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`),

  sendMessage: (conversationId: string, content: string, attachments?: File[]): Promise<Message> => {
    const formData = new FormData();
    formData.append('content', content);
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }
    return apiRequest<Message>('POST', `/messaging/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  markAsRead: (messageId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('PUT', `/messaging/messages/${messageId}/read`),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId: string, limit = 20, offset = 0): Promise<PaginatedResponse<ProductReview>> =>
    apiRequest<PaginatedResponse<ProductReview>>('GET', `/reviews/products/${productId}?limit=${limit}&offset=${offset}`),

  createProductReview: (productId: string, reviewData: Partial<ProductReview>): Promise<ProductReview> =>
    apiRequest<ProductReview>('POST', `/reviews/products/${productId}`, reviewData),

  updateReview: (reviewId: string, reviewData: Partial<ProductReview>): Promise<ProductReview> =>
    apiRequest<ProductReview>('PUT', `/reviews/${reviewId}`, reviewData),

  deleteReview: (reviewId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/reviews/${reviewId}`),

  voteHelpful: (reviewId: string, helpful: boolean): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', `/reviews/${reviewId}/vote`, { helpful }),
};

// Premium API
export const premiumAPI = {
  getPremiumOptions: (): Promise<{ options: Array<{ id: string; name: string; duration_days: number; price_cents: number; features: string[] }> }> =>
    apiRequest<{ options: Array<{ id: string; name: string; duration_days: number; price_cents: number; features: string[] }> }>('GET', '/premium/options'),

  createPremiumListing: (listingData: Partial<PremiumListing>): Promise<PremiumListing> =>
    apiRequest<PremiumListing>('POST', '/premium/listings', listingData),

  getPremiumListings: (limit = 20, offset = 0): Promise<PaginatedResponse<PremiumListing>> =>
    apiRequest<PaginatedResponse<PremiumListing>>('GET', `/premium/listings?limit=${limit}&offset=${offset}`),

  cancelPremiumListing: (listingId: string): Promise<APIResponse> =>
    apiRequest<APIResponse>('DELETE', `/premium/listings/${listingId}`),
};

// Shipping API
export const shippingAPI = {
  calculateShippingCost: (shippingData: Record<string, unknown>): Promise<Record<string, unknown>> =>
    apiRequest<Record<string, unknown>>('POST', '/shipping/calculate', shippingData),

  createShipment: (shipmentData: Partial<Shipment>): Promise<Shipment> =>
    apiRequest<Shipment>('POST', '/shipping/shipments', shipmentData),

  getShipment: (shipmentId: string): Promise<Shipment> =>
    apiRequest<Shipment>('GET', `/shipping/shipments/${shipmentId}`),

  trackShipment: (trackingNumber: string): Promise<Record<string, unknown>> =>
    apiRequest<Record<string, unknown>>('GET', `/shipping/track/${trackingNumber}`),

  confirmDelivery: (shipmentId: string, confirmationData: Record<string, unknown>): Promise<APIResponse> =>
    apiRequest<APIResponse>('POST', `/shipping/shipments/${shipmentId}/confirm`, confirmationData),
};

// File upload utility
export const uploadFile = async (file: File, endpoint: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiRequest<{ url: string }>('POST', endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.url;
};

export default apiClient;