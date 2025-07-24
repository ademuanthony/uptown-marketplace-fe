// Re-export commonly used types from api.ts
export type {
  // Product types
  Product,
  ProductImage,
  ProductCondition,
  ProductStatus,
  CreateProductRequest,
  ProductSearchRequest,
  
  // Category types
  Category,
  
  // User types
  User,
  UserRegistrationRequest,
  UserLoginRequest,
  AuthResponse,
  
  // Common types
  APIResponse,
  APIError,
  PaginatedResponse,
  
  // Social types
  SocialProfile,
  SocialConnection,
  SocialProfileVisibility,
  SocialVerificationLevel,
  SocialStats,
  ConnectionType,
  ConnectionStatus,
  
  // Message types
  Conversation,
  Message,
  ConversationType,
  MessageType,
  MessageAttachment,
  
  // Review types
  ProductReview,
  ReviewStatus,
  
  // Premium types
  PremiumListing,
  PremiumTier,
  PaymentMethod,
  PremiumStatus,
  
  // Shipping types
  Shipment,
  CourierService,
  ShipmentStatus,
  
  // Form types
  LoginFormData,
  RegisterFormData,
  ProductFormData,
  ProfileFormData,
} from './api';