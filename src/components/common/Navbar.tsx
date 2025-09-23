'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { getProfileImageUrl } from '@/utils/imageUtils';
import Avatar from './Avatar';
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  UserIcon,
  Cog6ToothIcon,
  HeartIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ShieldCheckIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  BoltIcon,
  WalletIcon,
  RocketLaunchIcon,
  // BookOpenIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { messagingService } from '@/services/messaging';
import { socialConnectionService, PendingRequestsResponse } from '@/services/socialConnection';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  const navigation = [
    { name: 'Connect', href: '/connect' },
    // { name: 'Categories', href: '/categories' },
    // { name: 'Featured', href: '/featured' },
    // { name: 'Deals', href: '/deals' },
    { name: 'Help', href: '/help' },
  ];

  const userNavigation = [
    {
      name: 'My Profile',
      href: user?.permalink ? `/u/${user.permalink}` : '/profile',
      icon: UserIcon,
    },
    { name: 'My Store', href: '/my-store', icon: ShoppingBagIcon },
    // { name: 'My Ebooks', href: '/ebooks', icon: BookOpenIcon },
    { name: 'Wallet', href: '/wallet', icon: WalletIcon },
    { name: 'Trading Bots', href: '/trading-bots/dashboard', icon: RocketLaunchIcon },
    { name: 'Fuel', href: '/fuel', icon: BoltIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Referrals', href: '/referrals', icon: UsersIcon },
    { name: 'Favorites', href: '/favorites', icon: HeartIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const adminNavigation = [
    { name: 'Categories', href: '/admin/categories', icon: FolderIcon },
    { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Users', href: '/admin/users', icon: UserIcon },
  ];

  // Fetch unread messages and friend requests count
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchNotificationCounts = async () => {
        try {
          // Fetch unread messages count
          const messagesCount = await messagingService.getUnreadConversationsCount(user.id);
          setUnreadMessagesCount(messagesCount);

          // Fetch pending friend requests
          try {
            const friendRequestsData: PendingRequestsResponse =
              await socialConnectionService.getPendingFriendRequests(1, 100);
            const requestsCount = Array.isArray(friendRequestsData?.requests)
              ? friendRequestsData.requests.length
              : 0;
            setPendingFriendRequestsCount(requestsCount);
          } catch (friendRequestsError) {
            // Friend requests are optional - don't log error if service is not available
            console.info('Friend requests not available:', friendRequestsError);
            setPendingFriendRequestsCount(0);
          }
        } catch (error) {
          console.error('Error fetching notification counts:', error);
        }
      };

      fetchNotificationCounts();

      // Set up interval to refresh counts periodically (every 30 seconds)
      const interval = setInterval(fetchNotificationCounts, 30000);

      return () => clearInterval(interval);
    } else {
      setUnreadMessagesCount(0);
      setPendingFriendRequestsCount(0);
    }
    return () => {};
  }, [isAuthenticated, user]);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="16" cy="16" r="16" fill="url(#logoGradient)" />
                  <path
                    d="M8 10V18C8 20.2091 9.79086 22 12 22H20C22.2091 22 24 20.2091 24 18V10"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M11 10V9C11 7.34315 12.3431 6 14 6H18C19.6569 6 21 7.34315 21 9V10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M16 14L17.09 16.26L19.5 16.5L17.75 18.14L18.18 20.5L16 19.27L13.82 20.5L14.25 18.14L12.5 16.5L14.91 16.26L16 14Z"
                    fill="white"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Uptown
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Auth & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Post Item Button */}
                <Link
                  href="/post-item"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Post Item
                </Link>

                {/* Messages */}
                <Link
                  href="/messages"
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Menu as="div" className="relative">
                  <div>
                    <Menu.Button className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors">
                      <BellIcon className="h-6 w-6" />
                      {(unreadMessagesCount > 0 || pendingFriendRequestsCount > 0) && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
                          {Math.min(unreadMessagesCount + pendingFriendRequestsCount, 99)}
                          {unreadMessagesCount + pendingFriendRequestsCount > 99 ? '+' : ''}
                        </span>
                      )}
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      </div>

                      {/* Friend Requests Section */}
                      {pendingFriendRequestsCount > 0 && (
                        <div className="px-4 py-2 border-b border-gray-100">
                          <Link
                            href="/friends/requests"
                            className="flex items-center justify-between hover:bg-gray-50 rounded-md p-2 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <UsersIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Friend Requests</p>
                                <p className="text-xs text-gray-500">
                                  {pendingFriendRequestsCount} pending request
                                  {pendingFriendRequestsCount === 1 ? '' : 's'}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full min-w-[18px]">
                                {pendingFriendRequestsCount}
                              </span>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* Messages Section */}
                      {unreadMessagesCount > 0 && (
                        <div className="px-4 py-2 border-b border-gray-100">
                          <Link
                            href="/messages"
                            className="flex items-center justify-between hover:bg-gray-50 rounded-md p-2 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Unread Messages</p>
                                <p className="text-xs text-gray-500">
                                  {unreadMessagesCount} unread message
                                  {unreadMessagesCount === 1 ? '' : 's'}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full min-w-[18px]">
                                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                              </span>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* No Notifications */}
                      {unreadMessagesCount === 0 && pendingFriendRequestsCount === 0 && (
                        <div className="px-4 py-6 text-center">
                          <BellIcon className="h-8 w-8 text-gray-300 mx-auto" />
                          <p className="mt-2 text-sm text-gray-500">No new notifications</p>
                        </div>
                      )}
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* User Dropdown */}
                <Menu as="div" className="relative">
                  <div>
                    <Menu.Button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      {user && (
                        <Avatar
                          src={getProfileImageUrl(user)}
                          alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                          size={32}
                          className="h-8 w-8"
                        />
                      )}
                      <span className="hidden lg:block text-gray-700 font-medium">
                        {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                      </span>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map(item => {
                        const Icon = item.icon;
                        return (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                href={item.href}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'flex items-center px-4 py-2 text-sm text-gray-700',
                                )}
                              >
                                <Icon className="h-4 w-4 mr-3 text-gray-500" />
                                {item.name}
                              </Link>
                            )}
                          </Menu.Item>
                        );
                      })}

                      {/* Admin Menu Section */}
                      {user?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <div className="px-4 py-2">
                            <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <ShieldCheckIcon className="h-3 w-3 mr-2" />
                              Admin
                            </div>
                          </div>
                          {adminNavigation.map(item => {
                            const Icon = item.icon;
                            return (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <Link
                                    href={item.href}
                                    className={classNames(
                                      active ? 'bg-red-50 text-red-700' : 'text-red-600',
                                      'flex items-center px-4 py-2 text-sm font-medium',
                                    )}
                                  >
                                    <Icon className="h-4 w-4 mr-3" />
                                    {item.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            );
                          })}
                        </>
                      )}

                      <div className="border-t border-gray-100 my-1" />
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={classNames(
                              active ? 'bg-gray-100' : '',
                              'flex items-center w-full px-4 py-2 text-sm text-gray-700',
                            )}
                          >
                            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-500" />
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions and menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <>
                {/* Messages button for mobile */}
                <Link
                  href="/messages"
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* Notifications button for mobile */}
                <button className="p-2 text-gray-700 hover:text-primary-600 transition-colors">
                  <BellIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Transition
        show={mobileMenuOpen}
        as={Fragment}
        enter="duration-150 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-4">
                    {user && (
                      <Avatar
                        src={getProfileImageUrl(user)}
                        alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                        size={40}
                        className="h-10 w-10"
                      />
                    )}
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                      </div>
                      <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/post-item"
                      className="flex items-center px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-secondary-600 rounded-md mx-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Post Item
                    </Link>
                    {userNavigation.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5 mr-3 text-gray-500" />
                          {item.name}
                        </Link>
                      );
                    })}

                    {/* Admin Menu Section for Mobile */}
                    {user?.role === 'admin' && (
                      <>
                        <div className="border-t border-gray-200 my-2" />
                        <div className="px-4 py-2">
                          <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <ShieldCheckIcon className="h-4 w-4 mr-2" />
                            Admin Panel
                          </div>
                        </div>
                        {adminNavigation.map(item => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center px-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon className="h-5 w-5 mr-3" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-4 pb-3 space-y-1">
                <Link
                  href="/auth/login"
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-secondary-600 rounded-md mx-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </Transition>
    </nav>
  );
}
