'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  imageAlt: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  imageUrl,
  imageAlt,
  onClose,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Content */}
      <div className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Close image viewer"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-in"
              onClick={e => e.stopPropagation()}
              unoptimized
            />
          </div>
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          <p className="font-medium">{imageAlt}</p>
          <p className="text-xs text-gray-300 mt-1">Click outside or press Escape to close</p>
        </div>
      </div>
    </div>
  );
};
