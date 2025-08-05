'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserReferralStats, 
  getUserReferrals, 
  getReferralRewards,
  getRecentReferrals,
  generateReferralLink,
  copyReferralLink,
  formatCurrencyAmount,
  getLevelName,
  getRewardPercentageDisplay,
  type ReferralStats,
  type ReferralProfile,
  type ReferralRelationship,
  type ReferralReward,
  type ReferralRewardsSummary,
  type RecentReferralWithProfile
} from '@/services/referral';
import { 
  ShareIcon, 
  DocumentDuplicateIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  GiftIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-primary-100 text-primary-700 border border-primary-200'
        : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

export default function ReferralsPage() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'downlines' | 'rewards' | 'leaderboard'>('overview');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [downlines, setDownlines] = useState<ReferralRelationship[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [rewardsSummary, setRewardsSummary] = useState<ReferralRewardsSummary | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<RecentReferralWithProfile[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReferralData();
    }
  }, [isAuthenticated]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Load stats and profile
      const statsData = await getUserReferralStats();
      setStats(statsData.stats);
      setProfile(statsData.profile);

      console.log(statsData);
      
      // Load downlines
      const downlinesData = await getUserReferrals({ limit: 50 });
      setDownlines(downlinesData.referrals);
      
      // Load rewards
      const rewardsData = await getReferralRewards({ limit: 20 });
      setRewards(rewardsData.rewards);
      setRewardsSummary(rewardsData.summary);
      
      // Load recent referrals
      const recentReferralsData = await getRecentReferrals({ limit: 5 });
      setRecentReferrals(recentReferralsData.recent_referrals);
      
    } catch (error) {
      console.error('Failed to load referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!profile?.referral_code) return;
    
    const success = await copyReferralLink(profile.referral_code);
    if (success) {
      setCopySuccess(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      toast.error('Failed to copy referral link');
    }
  };

  const handleShareReferralLink = async () => {
    if (!profile?.referral_code) return;
    
    const link = generateReferralLink(profile.referral_code);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Uptown Marketplace',
          text: 'Join me on Uptown Marketplace and start selling your items!',
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying link
      handleCopyReferralLink();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to view your referral dashboard.</p>
          <Link href="/auth/login" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Dashboard</h1>
          <p className="text-gray-600">
            Share your referral link and earn rewards when your friends join Uptown Marketplace!
          </p>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <LinkIcon className="h-5 w-5 mr-2 text-primary-600" />
              Your Referral Link
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyReferralLink}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  copySuccess
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {copySuccess ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                )}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShareReferralLink}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 transition-colors"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Referral Code:</p>
                <p className="text-lg font-mono font-semibold text-gray-900">{profile?.referral_code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Referral Link:</p>
                <p className="text-sm text-gray-500 max-w-xs truncate">
                  {profile?.referral_code && generateReferralLink(profile.referral_code)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_referrals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cash Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrencyAmount(stats?.total_cash_earned || 0, stats?.cash_currency || 'NGN')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GiftIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrencyAmount(stats?.total_points_earned || 0, 'POINTS')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_referrals || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </TabButton>
            <TabButton active={activeTab === 'downlines'} onClick={() => setActiveTab('downlines')}>
              Downlines ({stats?.total_referrals || 0})
            </TabButton>
            <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
              Rewards ({rewards ? rewards.length : 0})
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Level Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Referrals by Level</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((level) => {
                  const count = stats?.[`level${level}_referrals` as keyof ReferralStats] as number || 0;
                  return (
                    <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{getLevelName(level)}</p>
                      <p className="text-xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">
                        Cash: {getRewardPercentageDisplay(level, 'cash')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Points: {getRewardPercentageDisplay(level, 'points')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
              {recentReferrals && recentReferrals.length > 0 ? (
                <div className="space-y-3">
                  {recentReferrals.map((referral) => (
                    <div key={referral.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <UsersIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {referral.first_name && referral.last_name 
                              ? `${referral.first_name} ${referral.last_name}`
                              : referral.email
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {referral.phone_number && `${referral.phone_number} • `}
                            Code: {referral.referral_code}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(referral.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {getLevelName(referral.level)}
                        </p>
                        <p className={`text-xs ${
                          referral.is_active ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {referral.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No referrals yet. Share your referral link to get started!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'downlines' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Downlines</h3>
            {downlines && downlines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {downlines.map((downline) => (
                      <tr key={downline.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getLevelName(downline.level)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {downline.referred_id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            downline.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {downline.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(downline.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No downlines yet. Share your referral link to get started!</p>
            )}
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward History</h3>
            
            {rewardsSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Cash Rewards</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrencyAmount(rewardsSummary.total_cash_rewards, rewardsSummary.cash_currency)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Total Points Rewards</p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatCurrencyAmount(rewardsSummary.total_points_rewards, 'POINTS')}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Pending Rewards</p>
                  <p className="text-lg font-bold text-yellow-900">{rewardsSummary.pending_rewards}</p>
                </div>
              </div>
            )}

            {rewards && rewards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rewards.map((reward) => (
                      <tr key={reward.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reward.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reward.action_type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getLevelName(reward.level)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrencyAmount(reward.amount, reward.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            reward.status === 'processed' 
                              ? 'bg-green-100 text-green-800'
                              : reward.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reward.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No rewards yet. Start referring friends to earn rewards!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}