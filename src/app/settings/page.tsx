'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  EyeIcon,
  UserIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user';
import toast from 'react-hot-toast';
import ToggleSwitch from '@/components/settings/ToggleSwitch';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsItem from '@/components/settings/SettingsItem';
import LoadingButton from '@/components/settings/LoadingButton';

// Types for different settings sections
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  itemUpdateNotifications: boolean;
  marketingEmails: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  allowDataSharing: boolean;
}

type TabType = 'account' | 'security' | 'notifications' | 'privacy';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const tabs = [
    {
      id: 'account' as TabType,
      name: 'Account',
      icon: UserIcon,
      description: 'Basic account information',
    },
    {
      id: 'security' as TabType,
      name: 'Security',
      icon: ShieldCheckIcon,
      description: 'Password and security settings',
    },
    {
      id: 'notifications' as TabType,
      name: 'Notifications',
      icon: BellIcon,
      description: 'Notification preferences',
    },
    {
      id: 'privacy' as TabType,
      name: 'Privacy',
      icon: EyeIcon,
      description: 'Privacy and data settings',
    },
  ];

  const handlePasswordChange = async (data: PasswordChangeData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await userService.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      toast.success('Password changed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async (settings: NotificationSettings) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.info('Notification settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification preferences updated');
    } catch {
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyUpdate = async (settings: PrivacySettings) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.info('Privacy settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Privacy settings updated');
    } catch {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'security':
        return <SecuritySettings onPasswordChange={handlePasswordChange} isLoading={isLoading} />;
      case 'notifications':
        return <NotificationSettings onUpdate={handleNotificationUpdate} isLoading={isLoading} />;
      case 'privacy':
        return <PrivacySettings onUpdate={handlePrivacyUpdate} isLoading={isLoading} />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">Manage your account preferences</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm">
              <nav className="p-4 space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <div>
                        <div className="font-medium">{tab.name}</div>
                        <div className="text-sm text-gray-500">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">{renderTabContent()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Settings Component
function AccountSettings() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <p className="text-gray-900">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : 'Not set'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
          <button
            onClick={() => router.push('/my-items')}
            className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Manage Items
          </button>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings({
  onPasswordChange,
  isLoading,
}: {
  onPasswordChange: (data: PasswordChangeData) => void;
  isLoading: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPasswordChange({ currentPassword, newPassword, confirmPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>

        {/* Password Change Form */}
        <SettingsCard title="Change Password" icon={<KeyIcon className="h-5 w-5" />}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
                minLength={6}
              />
            </div>

            <LoadingButton type="submit" loading={isLoading} disabled={isLoading}>
              Change Password
            </LoadingButton>
          </form>
        </SettingsCard>

        {/* Future: Two-Factor Authentication */}
        <SettingsCard
          title="Two-Factor Authentication"
          icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
          className="mt-6"
        >
          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>
          <LoadingButton disabled variant="secondary">
            Coming Soon
          </LoadingButton>
        </SettingsCard>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings({
  onUpdate,
  isLoading,
}: {
  onUpdate: (settings: NotificationSettings) => void;
  isLoading: boolean;
}) {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    itemUpdateNotifications: true,
    marketingEmails: false,
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    onUpdate(newSettings);
  };

  const notificationOptions = [
    {
      key: 'emailNotifications' as keyof NotificationSettings,
      title: 'Email Notifications',
      description: 'Receive email notifications for important updates',
      icon: EnvelopeIcon,
    },
    {
      key: 'pushNotifications' as keyof NotificationSettings,
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      icon: BellIcon,
    },
    {
      key: 'messageNotifications' as keyof NotificationSettings,
      title: 'Message Notifications',
      description: 'Get notified when you receive new messages',
      icon: EnvelopeIcon,
    },
    {
      key: 'itemUpdateNotifications' as keyof NotificationSettings,
      title: 'Item Update Notifications',
      description: 'Notifications about your listed items',
      icon: BellIcon,
    },
    {
      key: 'marketingEmails' as keyof NotificationSettings,
      title: 'Marketing Emails',
      description: 'Receive promotional emails and newsletters',
      icon: GlobeAltIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose how you want to be notified about activity on your account.
        </p>

        <div className="space-y-4">
          {notificationOptions.map(option => {
            const Icon = option.icon;
            return (
              <SettingsItem
                key={option.key}
                title={option.title}
                description={option.description}
                icon={<Icon className="h-5 w-5" />}
              >
                <ToggleSwitch
                  enabled={settings[option.key]}
                  onToggle={() => handleToggle(option.key)}
                  disabled={isLoading}
                />
              </SettingsItem>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Privacy Settings Component
function PrivacySettings({
  onUpdate,
  isLoading,
}: {
  onUpdate: (settings: PrivacySettings) => void;
  isLoading: boolean;
}) {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowDataSharing: false,
  });

  const handleVisibilityChange = (visibility: 'public' | 'private' | 'friends') => {
    const newSettings = { ...settings, profileVisibility: visibility };
    setSettings(newSettings);
    onUpdate(newSettings);
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    if (key === 'profileVisibility') return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h2>

        {/* Profile Visibility */}
        <SettingsCard title="Profile Visibility" className="mb-6">
          <div className="space-y-3">
            {[
              { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
              { value: 'private', label: 'Private', description: 'Only you can see your profile' },
              {
                value: 'friends',
                label: 'Friends Only',
                description: 'Only your friends can see your profile',
              },
            ].map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={settings.profileVisibility === option.value}
                  onChange={e =>
                    handleVisibilityChange(e.target.value as 'public' | 'private' | 'friends')
                  }
                  className="mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </SettingsCard>

        {/* Contact Information Visibility */}
        <SettingsCard title="Contact Information">
          <div className="space-y-4">
            <SettingsItem
              title="Show Email Address"
              description="Allow others to see your email address"
            >
              <ToggleSwitch
                enabled={settings.showEmail}
                onToggle={() => handleToggle('showEmail')}
                disabled={isLoading}
              />
            </SettingsItem>

            <SettingsItem
              title="Show Phone Number"
              description="Allow others to see your phone number"
            >
              <ToggleSwitch
                enabled={settings.showPhone}
                onToggle={() => handleToggle('showPhone')}
                disabled={isLoading}
              />
            </SettingsItem>

            <SettingsItem
              title="Allow Data Sharing"
              description="Share anonymized data for platform improvements"
            >
              <ToggleSwitch
                enabled={settings.allowDataSharing}
                onToggle={() => handleToggle('allowDataSharing')}
                disabled={isLoading}
              />
            </SettingsItem>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
