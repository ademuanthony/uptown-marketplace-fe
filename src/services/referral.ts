import api from './api';
import { Money } from '../types/api';

export interface ReferralProfile {
  user_id: string;
  referral_code: string;
  referred_by_code?: string;
  level1_referrals: number;
  level2_referrals: number;
  level3_referrals: number;
  level4_referrals: number;
  level5_referrals: number;
  level6_referrals: number;
  total_cash_earned: Money;
  total_points_earned: Money;
  cash_currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  user_id: string;
  level1_referrals: number;
  level2_referrals: number;
  level3_referrals: number;
  level4_referrals: number;
  level5_referrals: number;
  level6_referrals: number;
  direct_referrals: number;
  indirect_referrals: number;
  total_referrals: number;
  active_referrals: number;
  total_cash_earned: Money;
  total_points_earned: Money;
  cash_currency: string;
  pending_rewards: Money;
  last_referral_date: string;
  referral_conversion_rate: number;
}

export interface ReferralRelationship {
  id: string;
  referrer_id: string;
  referred_id: string;
  level: number;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralReward {
  id: string;
  relationship_id: string;
  referrer_id: string;
  referred_id: string;
  action_type: string;
  reward_type: 'cash' | 'points';
  level: number;
  amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'failed' | 'cancelled';
  reference_id?: string;
  processed_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralRewardsSummary {
  total_cash_rewards: number;
  total_points_rewards: number;
  cash_currency: string;
  pending_rewards: number;
  processed_rewards: number;
  failed_rewards: number;
}

export interface TopReferrer {
  user_id: string;
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
  currency: string;
  conversion_rate: number;
  rank: number;
}

export interface RecentReferralWithProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  referral_code: string;
  level: number;
  joined_at: string;
  is_active: boolean;
}

export interface DownlineWithProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_image_url: string;
  referral_code: string;
  level: number;
  joined_at: string;
  is_active: boolean;
  relationship_id: string;
}

// Create referral profile
export const createReferralProfile = async (data: {
  user_id: string;
  referral_code: string;
  referred_by_code?: string;
}): Promise<{ profile: ReferralProfile }> => {
  const response = await api.post('/referrals/profile', data);
  return response.data.data;
};

// Get user referral stats
export const getUserReferralStats = async (): Promise<{
  stats: ReferralStats;
  profile: ReferralProfile;
}> => {
  const response = await api.get('/referrals/stats');
  return response.data.data;
};

// Get user referrals (downlines)
export const getUserReferrals = async (params?: {
  level?: number;
  limit?: number;
  offset?: number;
}): Promise<{
  referrals: ReferralRelationship[];
  total: number;
}> => {
  const response = await api.get('/referrals/my-referrals', { params });
  return response.data.data;
};

// Get referral rewards
export const getReferralRewards = async (params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  rewards: ReferralReward[];
  total: number;
  summary: ReferralRewardsSummary;
}> => {
  const response = await api.get('/referrals/rewards', { params });
  return response.data.data;
};

// Get referral leaderboard
export const getReferralLeaderboard = async (params?: {
  limit?: number;
  period?: number; // days
}): Promise<{
  top_referrers: TopReferrer[];
  period: string;
}> => {
  const response = await api.get('/referrals/leaderboard', { params });
  return response.data.data;
};

// Get recent referrals with user profiles
export const getRecentReferrals = async (params?: {
  limit?: number;
}): Promise<{
  recent_referrals: RecentReferralWithProfile[];
  total: number;
}> => {
  const response = await api.get('/referrals/recent', { params });
  return response.data.data;
};

// Get downlines with user profiles
export const getDownlines = async (params?: {
  level?: number;
  limit?: number;
  offset?: number;
}): Promise<{
  downlines: DownlineWithProfile[];
  total: number;
}> => {
  const response = await api.get('/referrals/downlines', { params });
  return response.data.data;
};

// Validate referral code
export const validateReferralCode = async (code: string): Promise<{
  is_valid: boolean;
  profile?: ReferralProfile;
  error_reason?: string;
}> => {
  const response = await api.post('/referrals/validate', { code });
  return response.data.data;
};

// Generate referral link
export const generateReferralLink = (referralCode: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
  return `${baseUrl}/auth/register?ref=${referralCode}`;
};

// Copy referral link to clipboard
export const copyReferralLink = async (referralCode: string): Promise<boolean> => {
  try {
    const link = generateReferralLink(referralCode);
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Failed to copy referral link:', error);
    return false;
  }
};

// Format currency amount
export const formatCurrencyAmount = (amount: number, currency: string): string => {
  if (currency === 'POINTS') {
    return `${amount.toLocaleString()} points`;
  }
  
  // Format as currency (assuming NGN for now, but can be extended)
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100); // Assuming amount is in smallest unit (kobo for NGN)
};

// Get level name
export const getLevelName = (level: number): string => {
  if (level === 1) return 'Direct';
  return `Level ${level}`;
};

// Get reward percentage for display
export const getRewardPercentageDisplay = (level: number, actionType: 'cash' | 'points'): string => {
  const cashPercentages = [15.0, 10.0, 7.5, 7.5, 5.0, 5.0];
  const pointsPercentages = [50.0, 25.0, 15.0, 10.0, 7.0, 5.0];
  
  const percentages = actionType === 'cash' ? cashPercentages : pointsPercentages;
  const percentage = percentages[level - 1] || 0;
  
  return `${percentage}%`;
};