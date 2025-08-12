import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features for performance
  experimental: {
    optimizePackageImports: ['@headlessui/react', '@heroicons/react'],
  },

  // Image optimization for marketplace product images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Development API
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
      // Development frontend (in case backend returns wrong URLs)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      // Development localhost without port
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
      // Production API
      {
        protocol: 'http',
        hostname: 'api.uptown.ng',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.uptown.ng',
        pathname: '/uploads/**',
      },
      // Main production domain
      {
        protocol: 'http',
        hostname: 'uptown.ng',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'uptown.ng',
        pathname: '/uploads/**',
      },
      // AWS S3 images
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      // Cloudinary or other CDN (if used in future)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // UI Avatars for default user avatars
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
    ],
  },

  // API rewrites for backend integration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:8080/api/v1/:path*'
            : '/api/:path*',
      },
    ];
  },

  // Headers for SEO and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Compiler options for performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer');
      config.plugins?.push(
        new BundleAnalyzerPlugin({
          enabled: true,
          openAnalyzer: true,
        }),
      );
      return config;
    },
  }),
};

export default nextConfig;
