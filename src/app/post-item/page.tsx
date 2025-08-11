'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { 
  PhotoIcon, 
  XMarkIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  TagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { createProductSchema, type CreateProductFormData, productConditions } from '@/schemas/product';
import { useAuth } from '@/hooks/useAuth';
import { productService } from '@/services/product';
import categoryService, { type Category } from '@/services/category';
import toast from 'react-hot-toast';

export default function PostItemPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      currency: 'USD',
      condition: 'used',
      location: {
        country: 'United States',
      },
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await categoryService.getCategories();
        const fetchedCategories = categoriesResponse.categories;
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error('Failed to load categories');
        console.error('Categories fetch error:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/post-item');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {files} = event.target;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = imageFiles.length + newFiles.length;

    if (totalFiles > 5) {
      toast.error('You can only upload up to 5 images');
      return;
    }

    // Validate file types
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateProductFormData) => {
    if (imageFiles.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload images first
      setUploadingImages(true);
      const uploadedImageUrls: string[] = [];
      
      for (const file of imageFiles) {
        try {
          const imageUrl = await productService.uploadProductImage(file);
          uploadedImageUrls.push(imageUrl);
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      
      setUploadingImages(false);

      if (uploadedImageUrls.length === 0) {
        throw new Error('No images were uploaded successfully');
      }

      // Create product with uploaded image URLs
      const productData = {
        ...data,
        price: parseFloat(data.price),
        images: uploadedImageUrls,
        tags: data.tags?.filter(tag => tag.length > 0) || [],
      };

      const product = await productService.createProduct(productData);
      
      toast.success('Product posted successfully!');
      router.push(`/products/${product.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to post item';
      toast.error(errorMessage);
      console.error('Product creation error:', error);
    } finally {
      setIsLoading(false);
      setUploadingImages(false);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', description: 'Title, description, and category' },
    { id: 2, name: 'Details', description: 'Price, condition, and location' },
    { id: 3, name: 'Images', description: 'Add photos of your item' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                className={`w-full px-3 py-2 border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="What are you selling?"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={6}
                className={`w-full px-3 py-2 border ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Describe your item in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              {categoriesLoading ? (
                <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
              ) : (
                <select
                  {...register('category_id')}
                  className={`w-full px-3 py-2 border ${
                    errors.category_id ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
            </div>
          </>
        );

      case 2:
        return (
          <>
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('price')}
                  type="text"
                  className={`w-full pl-10 pr-3 py-2 border ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <div className="grid grid-cols-3 gap-3">
                {productConditions.map(condition => (
                  <label
                    key={condition}
                    className={`relative flex items-center justify-center px-4 py-3 border rounded-md cursor-pointer transition-all ${
                      watch('condition') === condition
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      {...register('condition')}
                      type="radio"
                      value={condition}
                      className="sr-only"
                    />
                    <span className="capitalize font-medium">{condition}</span>
                  </label>
                ))}
              </div>
              {errors.condition && (
                <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('location.street')}
                    type="text"
                    placeholder="Street address"
                    className={`w-full px-3 py-2 border ${
                      errors.location?.street ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  />
                  {errors.location?.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.street.message}</p>
                  )}
                </div>

                <div>
                  <input
                    {...register('location.city')}
                    type="text"
                    placeholder="City"
                    className={`w-full px-3 py-2 border ${
                      errors.location?.city ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  />
                  {errors.location?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                  )}
                </div>

                <div>
                  <input
                    {...register('location.state')}
                    type="text"
                    placeholder="State/Province"
                    className={`w-full px-3 py-2 border ${
                      errors.location?.state ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  />
                  {errors.location?.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.state.message}</p>
                  )}
                </div>

                <div>
                  <input
                    {...register('location.postal_code')}
                    type="text"
                    placeholder="Postal code (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={preview}
                        alt={`Product image ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary-600 text-white text-xs rounded">
                          Main Photo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imagePreviews.length < 5 && (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB (max 5 photos)
                    </p>
                  </div>
                </label>
              )}

              <div className="mt-2 flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Add up to 5 photos. The first photo will be your main listing image.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <div className="flex items-center">
                <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Add tags separated by commas (e.g., vintage, rare, collectible)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  onChange={e => {
                    const tags = e.target.value.split(',').map(tag => tag.trim());
                    setValue('tags', tags);
                  }}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post an Item</h1>
          <p className="mt-2 text-gray-600">List your item for sale in the marketplace</p>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className="relative flex-1">
                {stepIdx !== 0 && (
                  <div
                    className={`absolute left-0 top-5 -ml-px mt-0.5 h-0.5 w-full ${
                      step.id < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`group relative flex flex-col items-center ${
                    step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  disabled={step.id > currentStep}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      step.id < currentStep
                        ? 'bg-primary-600 text-white'
                        : step.id === currentStep
                        ? 'border-2 border-primary-600 bg-white text-primary-600'
                        : 'border-2 border-gray-300 bg-white text-gray-500'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="mt-2 text-xs font-medium text-gray-900">{step.name}</span>
                  <span className="text-xs text-gray-500 hidden sm:block">{step.description}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || uploadingImages}
                onClick={e => {
                  // Check for form validation errors and show them via toast
                  if (Object.keys(errors).length > 0) {
                    e.preventDefault();
                    
                    // Get the first error and show it
                    const firstErrorKey = Object.keys(errors)[0];
                    const firstError = errors[firstErrorKey as keyof typeof errors];
                    
                    if (firstError && 'message' in firstError) {
                      toast.error(`Please fix: ${firstError.message}`);
                      
                      // Navigate to the step containing the error
                      if (firstErrorKey && ['title', 'description', 'category_id'].includes(firstErrorKey)) {
                        setCurrentStep(1);
                      } else if (firstErrorKey && (['price', 'condition', 'location'].includes(firstErrorKey) || firstErrorKey.startsWith('location.'))) {
                        setCurrentStep(2);
                      } else {
                        setCurrentStep(3);
                      }
                    }
                    return;
                  }
                }}
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    {uploadingImages ? 'Uploading images...' : 'Posting...'}
                  </>
                ) : (
                  'Post Item'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}