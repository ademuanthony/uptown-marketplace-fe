'use client';

import Link from 'next/link';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  HeartIcon 
} from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Uptown Marketplace
            </h3>
            <p className="text-gray-300 text-sm">
              Your trusted marketplace for discovering amazing products from verified sellers worldwide.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPinIcon className="h-4 w-4 text-primary-400" />
              <span>Available Worldwide</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-300 hover:text-primary-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <PhoneIcon className="h-4 w-4 text-primary-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <EnvelopeIcon className="h-4 w-4 text-primary-400" />
                <a 
                  href="mailto:support@uptownmarketplace.com" 
                  className="hover:text-primary-400 transition-colors"
                >
                  support@uptownmarketplace.com
                </a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="pt-2">
              <h5 className="text-sm font-medium text-white mb-2">Follow Us</h5>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.291C4.151 14.81 3.621 13.539 3.621 12.017c0-1.525.53-2.796 1.505-3.682.875-.801 2.026-1.291 3.323-1.291s2.448.49 3.323 1.291c.975.886 1.505 2.157 1.505 3.682 0 1.522-.53 2.793-1.505 3.68-.875.801-2.026 1.291-3.323 1.291zm7.126 0c-1.297 0-2.448-.49-3.323-1.291-.975-.887-1.505-2.158-1.505-3.68 0-1.525.53-2.796 1.505-3.682.875-.801 2.026-1.291 3.323-1.291s2.448.49 3.323 1.291c.975.886 1.505 2.157 1.505 3.682 0 1.522-.53 2.793-1.505 3.68-.875.801-2.026 1.291-3.323 1.291z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <Link href="/privacy" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-primary-400 transition-colors">
                Cookie Policy
              </Link>
              <Link href="/accessibility" className="hover:text-primary-400 transition-colors">
                Accessibility
              </Link>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>© 2024 Uptown Marketplace. Made with</span>
              <HeartIcon className="h-4 w-4 text-primary-400 fill-current" />
              <span>for everyone</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}