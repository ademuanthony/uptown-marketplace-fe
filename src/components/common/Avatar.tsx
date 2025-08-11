'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src: string;
  alt: string;
  size: number;
  className?: string;
}

export default function Avatar({ src, alt, size, className = '' }: AvatarProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Default avatar fallback
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || '?')}&size=${size}&background=3b82f6&color=ffffff&format=png`;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(defaultAvatar);
    }
  };

  return (
    <Image
      src={hasError ? defaultAvatar : imageSrc}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={handleError}
      unoptimized={imageSrc.includes('ui-avatars.com')}
    />
  );
}