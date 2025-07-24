'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  HeartIcon, 
  ShareIcon, 
  MapPinIcon,
  ClockIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  TagIcon,
  HomeIcon,
  ChevronRightIcon as ChevronRightBreadcrumb
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { productService, type Product } from '@/services/product';
import { categoryService, type Category } from '@/services/category';
import { favoritesService } from '@/services/favorites';
import { messagingService } from '@/services/messaging';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const categorySlug = params.category as string;
  const productPermalink = params.product as string;

  useEffect(() => {
    const fetchProductAndCategory = async () => {
      try {
        // Load category first
        const foundCategory = await categoryService.getCategoryBySlug(categorySlug);
        setCategory(foundCategory);
        
        // Then load product by permalink
        const fetchedProduct = await productService.getProductByPermalink(productPermalink);
        
        // Verify the product belongs to this category
        if (fetchedProduct.category_id !== foundCategory.id) {
          console.error('Product does not belong to this category');
          router.push('/');
          return;
        }
        
        setProduct(fetchedProduct);

        // Check if product is favorited by current user (only if authenticated)
        if (user) {
          try {
            const favoriteStatus = await favoritesService.isFavorited(fetchedProduct.id);
            setIsFavorited(favoriteStatus);
          } catch (error) {
            console.error('Failed to check favorite status:', error);
            setIsFavorited(false);
          }
        } else {
          setIsFavorited(false);
        }
      } catch (error) {
        console.error('Failed to fetch product or category:', error);
        toast.error('Failed to load product details');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug && productPermalink) {
      fetchProductAndCategory();
    }
  }, [categorySlug, productPermalink, router, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    if (!product) {
      toast.error('Product not loaded');
      return;
    }
    
    setIsTogglingFavorite(true);
    
    try {
      const newFavoriteStatus = await favoritesService.toggleFavorite(product.id);
      setIsFavorited(newFavoriteStatus);
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update favorites');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleShare = async () => {
    // Use the new category-based URL structure for sharing
    const shareUrl = `${window.location.origin}/${categorySlug}/${productPermalink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: shareUrl,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100); // Convert from cents
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOwner = user && product && user.id === product.seller_id;

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handlePublish = async () => {
    if (!product || !user) return;
    
    setIsPublishing(true);
    try {
      await productService.publishProduct(product.id);
      setProduct({ ...product, status: 'published' });
      toast.success('Product published successfully!');
    } catch (error) {
      console.error('Failed to publish product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish product');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!product || !user) return;
    
    setIsUnpublishing(true);
    try {
      await productService.unpublishProduct(product.id);
      setProduct({ ...product, status: 'draft' });
      toast.success('Product unpublished successfully!');
    } catch (error) {
      console.error('Failed to unpublish product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unpublish product');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleContactSeller = async () => {
    if (!product || !user) {
      toast.error('You must be logged in to contact the seller');
      return;
    }

    if (!product.seller_id) {
      toast.error('Seller information not available');
      return;
    }

    setIsCreatingConversation(true);
    try {
      // Create a direct conversation with the seller
      const conversation = await messagingService.createConversation({
        type: 'direct',
        participant_ids: [product.seller_id],
        subject: product.title, // Set subject to product name
        product_id: product.id
      });
      
      // Send initial message with product link using new URL structure
      const productUrl = `${window.location.origin}/${categorySlug}/${productPermalink}`;
      const initialMessage = `Hi! I&apos;m interested in your product &quot;${product.title}&quot;. 

Product: ${productUrl}

Could you provide more details?`;

      await messagingService.sendMessage(conversation.id, {
        type: 'text',
        content: initialMessage
      });
      
      toast.success('Conversation started!');
      
      // Redirect to the messages page with the new conversation
      router.push(`/messages?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to start conversation with seller');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!product || !user) {
      toast.error('You must be logged in to make an offer');
      return;
    }

    if (!product.seller_id) {
      toast.error('Seller information not available');
      return;
    }

    setIsCreatingConversation(true);
    try {
      // Create a direct conversation with the seller
      const conversation = await messagingService.createConversation({
        type: 'direct',
        participant_ids: [product.seller_id],
        title: `Offer for: ${product.title}`,
        subject: product.title, // Set subject to product name
        product_id: product.id
      });
      
      // Send initial message with product link using new URL structure
      const productUrl = `${window.location.origin}/${categorySlug}/${productPermalink}`;
      const initialMessage = `Hi! I'm interested in making an offer on your product "${product.title}". 

Product: ${productUrl}

Price: $${(product.price / 100).toFixed(2)}

Let me know if you're open to offers!`;

      await messagingService.sendMessage(conversation.id, {
        type: 'text',
        content: initialMessage
      });
      
      toast.success('Conversation created with initial message!');
      
      // Redirect to the messages page with the new conversation
      router.push(`/messages?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Failed to create offer conversation:', error);
      toast.error('Failed to start offer conversation');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => router.push('/')} className="hover:text-gray-900">
            <HomeIcon className="h-4 w-4" />
          </button>
          <ChevronRightBreadcrumb className="h-4 w-4" />
          <button 
            onClick={() => router.push(`/${categorySlug}`)} 
            className="hover:text-gray-900"
          >
            {category.name}
          </button>
          <ChevronRightBreadcrumb className="h-4 w-4" />
          <span className="font-medium text-gray-900 truncate">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-md">
              {product.images && product.images.length > 0 ? (
                <>
                  <Image
                    src={product.images[currentImageIndex]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  
                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-full">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-300 rounded-lg"></div>
                    <p className="text-gray-500">No images available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(product.price, product.currency)}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  product.condition === 'new' ? 'bg-green-100 text-green-800' :
                  product.condition === 'used' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {product.condition}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  product.status === 'published' ? 'bg-green-100 text-green-800' :
                  product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.status}
                </span>
              </div>
            </div>

            {/* Seller Actions */}
            {isOwner && (
              <div className="border-b pb-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Actions</h3>
                <div className="flex space-x-4">
                  {product.status === 'draft' ? (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing || product.images.length === 0}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isPublishing || product.images.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Publish Product</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleUnpublish}
                      disabled={isUnpublishing}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isUnpublishing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isUnpublishing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Unpublishing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Unpublish Product</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push(`/edit-item/${product.id}`)}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Product</span>
                  </button>
                </div>
                
                {product.status === 'draft' && product.images.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    * Add at least one image before publishing
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleFavoriteToggle}
                disabled={isTogglingFavorite}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFavorited 
                    ? 'bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100' 
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                {isTogglingFavorite ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                ) : isFavorited ? (
                  <HeartIconSolid className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5 text-gray-600" />
                )}
                <span className="font-medium">
                  {isTogglingFavorite ? 'Updating...' : isFavorited ? 'Favorited' : 'Add to Favorites'}
                </span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
              >
                <ShareIcon className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Share Product</span>
              </button>
            </div>

            {/* Description */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <div className="text-gray-600">
                {showFullDescription || product.description.length <= 300 ? (
                  <p className="whitespace-pre-wrap">{product.description}</p>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{product.description.substring(0, 300)}...</p>
                    <button
                      onClick={() => setShowFullDescription(true)}
                      className="text-primary-600 hover:text-primary-700 font-medium mt-2"
                    >
                      Read more
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      <TagIcon className="h-4 w-4 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-gray-600">
                  <p>{product.location.street}</p>
                  <p>{product.location.city}, {product.location.state}</p>
                  <p>{product.location.country}</p>
                  {product.location.postal_code && (
                    <p>{product.location.postal_code}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h2>
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Seller ID: {product.seller_id}</p>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <StarIcon className="h-4 w-4" />
                    <span>No ratings yet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Posted Date */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>Posted on {formatDate(product.created_at)}</span>
              </div>
            </div>

            {/* Contact/Action Buttons - Only show for non-owners */}
            {!isOwner && (
              <div className="border-t pt-6 space-y-3">
                <button 
                  onClick={handleContactSeller}
                  disabled={isCreatingConversation}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCreatingConversation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Contact Seller'
                  )}
                </button>
                <button 
                  onClick={handleMakeOffer}
                  disabled={isCreatingConversation}
                  className="w-full bg-white border border-primary-600 text-primary-600 py-3 px-6 rounded-md hover:bg-primary-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCreatingConversation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Make an Offer'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}