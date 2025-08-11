'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { storeService } from '@/services/store';
import toast from 'react-hot-toast';

// Validation schema for store configuration
const storeConfigSchema = z.object({
  store_name: z.string().min(1, 'Store name is required').max(100, 'Store name cannot exceed 100 characters').optional().or(z.literal('')),
  permalink: z.string()
    .min(3, 'Permalink must be at least 3 characters')
    .max(50, 'Permalink cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Permalink can only contain lowercase letters, numbers, and hyphens')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Permalink cannot start or end with a hyphen')
    .refine(val => !val.includes('--'), 'Permalink cannot contain consecutive hyphens'),
});

type StoreConfigFormData = z.infer<typeof storeConfigSchema>;

interface StoreConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoreName?: string;
  currentPermalink: string;
  onSuccess: (updatedConfig: { store_name?: string; permalink: string }) => void;
}

export default function StoreConfigModal({
  isOpen,
  onClose,
  currentStoreName,
  currentPermalink,
  onSuccess,
}: StoreConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPermalink, setIsCheckingPermalink] = useState(false);
  const [permalinkAvailable, setPermalinkAvailable] = useState<boolean | null>(null);
  const [permalinkCheckTimeout, setPermalinkCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<StoreConfigFormData>({
    resolver: zodResolver(storeConfigSchema),
    defaultValues: {
      store_name: currentStoreName || '',
      permalink: currentPermalink,
    },
  });

  // Watch permalink changes for availability checking
  const watchedPermalink = watch('permalink');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        store_name: currentStoreName || '',
        permalink: currentPermalink,
      });
      setPermalinkAvailable(null);
    }
  }, [isOpen, currentStoreName, currentPermalink, reset]);

  // Check permalink availability with debouncing
  useEffect(() => {
    if (!watchedPermalink || watchedPermalink === currentPermalink) {
      setPermalinkAvailable(null);
      return;
    }

    // Clear previous timeout
    if (permalinkCheckTimeout) {
      clearTimeout(permalinkCheckTimeout);
    }

    // Validate permalink format first
    const result = storeConfigSchema.shape.permalink.safeParse(watchedPermalink);
    if (!result.success) {
      setPermalinkAvailable(null);
      return;
    }

    // Set new timeout for availability check
    const timeout = setTimeout(async () => {
      setIsCheckingPermalink(true);
      try {
        const available = await storeService.checkPermalinkAvailability(watchedPermalink);
        setPermalinkAvailable(available);
      } catch (error) {
        console.error('Error checking permalink availability:', error);
        setPermalinkAvailable(null);
      } finally {
        setIsCheckingPermalink(false);
      }
    }, 500); // 500ms debounce

    setPermalinkCheckTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [watchedPermalink, currentPermalink, permalinkCheckTimeout]);

  const onSubmit = async (data: StoreConfigFormData) => {
    setIsLoading(true);
    try {
      const updatedConfig = {
        store_name: data.store_name || undefined,
        permalink: data.permalink,
      };

      await storeService.updateStoreConfig(updatedConfig);
      
      toast.success('Store configuration updated successfully!');
      onSuccess(updatedConfig);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update store configuration';
      toast.error(errorMessage);
      console.error('Store configuration update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePermalinkFromName = (name: string) => {
    const permalink = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    setValue('permalink', permalink);
  };

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('store_name', name);
    
    // Auto-generate permalink if it's empty or matches the current store name pattern
    if (!watchedPermalink || watchedPermalink === currentPermalink) {
      generatePermalinkFromName(name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Store Configuration
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
                <span className="text-gray-500 text-xs ml-1">(optional)</span>
              </label>
              <input
                {...register('store_name')}
                type="text"
                placeholder="Enter your store name"
                className={`w-full px-3 py-2 border ${
                  errors.store_name ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                onChange={handleStoreNameChange}
              />
              {errors.store_name && (
                <p className="mt-1 text-sm text-red-600">{errors.store_name.message}</p>
              )}
            </div>

            {/* Permalink */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store URL
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">uptown.ng/store/</span>
                <div className="flex-1 relative">
                  <input
                    {...register('permalink')}
                    type="text"
                    placeholder="your-store-url"
                    className={`w-full px-3 py-2 border ${
                      errors.permalink ? 'border-red-300' : 
                      permalinkAvailable === false ? 'border-red-300' :
                      permalinkAvailable === true ? 'border-green-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10`}
                  />
                  
                  {/* Availability indicator */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isCheckingPermalink && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600" />
                    )}
                    {!isCheckingPermalink && permalinkAvailable === true && (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    )}
                    {!isCheckingPermalink && permalinkAvailable === false && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
              
              {errors.permalink && (
                <p className="mt-1 text-sm text-red-600">{errors.permalink.message}</p>
              )}
              {!errors.permalink && permalinkAvailable === false && (
                <p className="mt-1 text-sm text-red-600">This URL is already taken</p>
              )}
              {!errors.permalink && permalinkAvailable === true && (
                <p className="mt-1 text-sm text-green-600">This URL is available</p>
              )}
              
              <div className="mt-2 flex items-start space-x-2 text-sm text-gray-500">
                <InformationCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  This will be your store&apos;s public URL. Use lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || permalinkAvailable === false}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}