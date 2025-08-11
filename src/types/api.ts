// API Response Types - Generated from Go backend structs

// Common Types
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profileImage?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  sellerId: string;
  condition: ProductCondition;
  status: ProductStatus;
  images: ProductImage[];
  tags: string[];
  specifications?: Record<string, unknown>;
  location?: string;
  viewCount: number;
  favoriteCount: number;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  order: number;
  isPrimary: boolean;
}

export enum ProductCondition {
  NEW = 'new',
  USED_LIKE_NEW = 'used_like_new',
  USED_GOOD = 'used_good',
  USED_FAIR = 'used_fair',
  REFURBISHED = 'refurbished',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SOLD = 'sold',
  SUSPENDED = 'suspended',
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  condition: ProductCondition;
  tags?: string[];
  specifications?: Record<string, unknown>;
  location?: string;
}

export interface ProductSearchRequest {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  location?: string;
  tags?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  productCount: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

// Social Types
export interface SocialProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  interests: string[];
  visibility: SocialProfileVisibility;
  verification: SocialVerificationLevel;
  socialStats: SocialStats;
  createdAt: string;
  updatedAt: string;
}

export enum SocialProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum SocialVerificationLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  ELITE = 'elite',
}

export interface SocialStats {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  postsCount: number;
  influenceScore: number;
}

export interface SocialConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: ConnectionType;
  status: ConnectionStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ConnectionType {
  FOLLOW = 'follow',
  FRIEND = 'friend',
  BLOCK = 'block',
}

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

// Message Types
export interface Conversation {
  id: string;
  participants: string[];
  type: ConversationType;
  title?: string;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  isRead: boolean;
  editedAt?: string;
  createdAt: string;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  SUPPORT = 'support',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  PRODUCT_LINK = 'product_link',
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  thumbnailUrl?: string;
}

// Review Types
export interface ProductReview {
  id: string;
  productId: string;
  reviewerId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  totalVotes: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIDDEN = 'hidden',
}

// Premium Types
export interface PremiumListing {
  id: string;
  productId: string;
  userId: string;
  tier: PremiumTier;
  duration: number; // days
  totalCost: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PremiumStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export enum PremiumTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  FEATURED = 'featured',
}

export enum PaymentMethod {
  POINTS = 'points',
  CARD = 'card',
  PAYSTACK = 'paystack',
}

export enum PremiumStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Shipping Types
export interface Shipment {
  id: string;
  orderId: string;
  senderId: string;
  recipientId: string;
  trackingNumber: string;
  courier: CourierService;
  status: ShipmentStatus;
  estimatedDelivery: string;
  actualDelivery?: string;
  shippingCost: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export enum CourierService {
  DHL = 'dhl',
  FEDEX = 'fedex',
  UPS = 'ups',
  USPS = 'usps',
  LOCAL = 'local',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

// API Error Types
export interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  terms: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  condition: ProductCondition;
  location?: string;
  tags: string[];
  images: File[];
  specifications?: Record<string, string>;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  interests: string[];
  visibility: SocialProfileVisibility;
}

export interface Money {
  display: number;
  currency: string;
  amount: number;
  decimals: number;
}