import api from './api';

// Types for daily check-in system
export interface DailyCheckIn {
  id: string;
  user_id: string;
  checkin_date: string; // ISO date string
  status: 'completed' | 'pending' | 'missed';
  base_points: number;
  streak_bonus: number;
  total_points: number;
  streak_days: number;
  ip_address?: string;
  device_info?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckInStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date?: string;
  total_checkins: number;
  total_points_earned: number;
  weekly_milestones: number;
  monthly_milestones: number;
  annual_milestones: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MilestoneReward {
  id: string;
  user_id: string;
  milestone_type: 'weekly' | 'monthly' | 'annual';
  streak_days: number;
  reward_points: number;
  is_processed: boolean;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UplineCheckInReward {
  user_id: string;
  level: number;
  points: number;
  percentage: number;
}

export interface NextMilestoneInfo {
  type: 'weekly' | 'monthly' | 'annual';
  days_required: number;
  reward_points: number;
}

export interface CheckInStats {
  daily_checkins: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  average_points_per_checkin: number;
  weekly_milestones: number;
  monthly_milestones: number;
  annual_milestones: number;
  this_week_checkins: number;
  this_month_checkins: number;
  last_checkin_date?: string;
  checkin_rate: number; // Percentage
}

// API Response types
export interface CheckInApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface CheckInPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  message: string;
  timestamp: string;
}

// Request types
export interface PerformCheckInRequest {
  device_info?: string;
}

export interface PerformCheckInResponse {
  checkin: DailyCheckIn;
  streak: CheckInStreak;
  points_earned: number;
  milestones_achieved: MilestoneReward[];
  upline_rewards: UplineCheckInReward[];
  next_milestone?: NextMilestoneInfo;
}

export interface CheckInStatsResponse {
  stats: CheckInStats;
  streak: CheckInStreak;
  can_checkin: boolean;
  next_milestone?: NextMilestoneInfo;
}

export interface CheckInHistoryResponse {
  checkins: DailyCheckIn[];
  page: number;
  per_page: number;
  total: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  current_streak?: number;
  longest_streak?: number;
  total_points?: number;
  rank: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank?: number;
  total_users: number;
  leaderboard_type: string;
}

class CheckInService {
  private getErrorMessage(error: unknown): string {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string; error?: { message?: string } } };
      message?: string;
    };

    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error?.message ||
      axiosError.message ||
      'An error occurred'
    );
  }

  private getErrorStatus(error: unknown): number | undefined {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };
    return axiosError.response?.status;
  }

  /**
   * Perform daily check-in for the authenticated user
   */
  async performCheckIn(deviceInfo?: string): Promise<PerformCheckInResponse> {
    try {
      const requestData: PerformCheckInRequest = {};
      if (deviceInfo) {
        requestData.device_info = deviceInfo;
      }

      const response = await api.post<CheckInApiResponse<PerformCheckInResponse>>(
        '/check-ins',
        requestData,
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to perform check-in');
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to perform check-in:', error);

      const status = this.getErrorStatus(error);

      if (status === 401) {
        throw new Error('Please login to perform check-in');
      }

      if (status === 400) {
        const message = this.getErrorMessage(error);
        // Handle specific business rule errors
        if (message.includes('Already checked in')) {
          throw new Error('You have already checked in today!');
        }
        if (message.includes('rate limit')) {
          throw new Error('Too many check-in attempts. Please try again later.');
        }
        throw new Error(message);
      }

      throw new Error(this.getErrorMessage(error) || 'Failed to perform check-in');
    }
  }

  /**
   * Get user's check-in statistics
   */
  async getCheckInStats(): Promise<CheckInStatsResponse> {
    try {
      const response = await api.get<CheckInApiResponse<CheckInStatsResponse>>('/check-ins/stats');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get check-in stats');
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to get check-in stats:', error);

      const status = this.getErrorStatus(error);

      if (status === 401) {
        throw new Error('Please login to view your check-in stats');
      }

      if (status === 404) {
        // Return default stats if user hasn't checked in yet
        return {
          stats: {
            daily_checkins: 0,
            current_streak: 0,
            longest_streak: 0,
            total_points: 0,
            average_points_per_checkin: 0,
            weekly_milestones: 0,
            monthly_milestones: 0,
            annual_milestones: 0,
            this_week_checkins: 0,
            this_month_checkins: 0,
            checkin_rate: 0,
          },
          streak: {
            id: '',
            user_id: '',
            current_streak: 0,
            longest_streak: 0,
            total_checkins: 0,
            total_points_earned: 0,
            weekly_milestones: 0,
            monthly_milestones: 0,
            annual_milestones: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          can_checkin: true,
        };
      }

      throw new Error(this.getErrorMessage(error) || 'Failed to get check-in stats');
    }
  }

  /**
   * Get user's check-in history
   */
  async getCheckInHistory(page: number = 1, perPage: number = 20): Promise<CheckInHistoryResponse> {
    try {
      const response = await api.get<CheckInPaginatedResponse<DailyCheckIn>>(
        `/check-ins/history?page=${page}&per_page=${perPage}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get check-in history');
      }

      return {
        checkins: response.data.data,
        page: response.data.pagination.page,
        per_page: response.data.pagination.per_page,
        total: response.data.pagination.total,
      };
    } catch (error: unknown) {
      console.error('Failed to get check-in history:', error);

      const status = this.getErrorStatus(error);

      if (status === 401) {
        throw new Error('Please login to view your check-in history');
      }

      throw new Error(this.getErrorMessage(error) || 'Failed to get check-in history');
    }
  }

  /**
   * Get check-in leaderboard
   */
  async getLeaderboard(
    type: 'current_streak' | 'longest_streak' | 'total_points' = 'current_streak',
    limit: number = 20,
  ): Promise<LeaderboardResponse> {
    try {
      const response = await api.get<CheckInApiResponse<LeaderboardResponse>>(
        `/check-ins/leaderboard?type=${type}&limit=${limit}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get leaderboard');
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to get leaderboard:', error);
      throw new Error(this.getErrorMessage(error) || 'Failed to get leaderboard');
    }
  }

  /**
   * Calculate potential daily points based on current streak
   * This is used for UI display of potential earnings
   */
  calculateDailyPoints(currentStreak: number): {
    base: number;
    bonus: number;
    total: number;
    nextDay: number;
  } {
    const base = 50; // Updated base points for requirements (was 10)
    const bonus = Math.floor(base * (currentStreak * 0.1)); // 10% growth per day
    const total = base + bonus;

    // Calculate next day potential (capped at 30 days growth)
    const nextStreakBonus =
      currentStreak < 30 ? Math.floor(base * ((currentStreak + 1) * 0.1)) : bonus; // Maintain same bonus after 30 days
    const nextDay = base + nextStreakBonus;

    return { base, bonus, total, nextDay };
  }

  /**
   * Get milestone information for display
   */
  getMilestoneInfo(currentStreak: number): {
    next?: NextMilestoneInfo;
    progress: number; // percentage to next milestone
  } {
    if (currentStreak < 7) {
      return {
        next: {
          type: 'weekly',
          days_required: 7 - currentStreak,
          reward_points: 50,
        },
        progress: (currentStreak / 7) * 100,
      };
    }

    if (currentStreak < 30) {
      return {
        next: {
          type: 'monthly',
          days_required: 30 - currentStreak,
          reward_points: 200,
        },
        progress: (currentStreak / 30) * 100,
      };
    }

    if (currentStreak < 365) {
      return {
        next: {
          type: 'annual',
          days_required: 365 - currentStreak,
          reward_points: 2000,
        },
        progress: (currentStreak / 365) * 100,
      };
    }

    // Beyond annual milestone
    const nextAnnual = 365 - (currentStreak % 365);
    return {
      next: {
        type: 'annual',
        days_required: nextAnnual,
        reward_points: 2000,
      },
      progress: ((currentStreak % 365) / 365) * 100,
    };
  }

  /**
   * Check if user can check in today based on last check-in date
   */
  canCheckInToday(lastCheckInDate?: string): boolean {
    if (!lastCheckInDate) {
      return true; // Never checked in before
    }

    const today = new Date();
    const lastCheckIn = new Date(lastCheckInDate);

    // Check if last check-in was today (compare dates only, not time)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastCheckInDateOnly = new Date(
      lastCheckIn.getFullYear(),
      lastCheckIn.getMonth(),
      lastCheckIn.getDate(),
    );

    return todayDate.getTime() !== lastCheckInDateOnly.getTime();
  }
}

export const checkInService = new CheckInService();
export default checkInService;
