import api from './api';
import { User } from './auth';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Profile update request
export interface ProfileUpdateRequest {
  first_name: string;
  last_name: string;
  phone_number?: string;
}

// Profile update response
export interface ProfileUpdateResponse {
  user: User;
  message: string;
}

// Avatar upload response
export interface AvatarUploadResponse {
  user: User;
  message: string;
}

// Password change request
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

// Password change response
export interface PasswordChangeResponse {
  message: string;
}

class UserService {
  // Update user profile
  async updateProfile(profileData: ProfileUpdateRequest): Promise<User> {
    try {
      const response = await api.put<ApiResponse<ProfileUpdateResponse>>('/user/profile', profileData);
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to update profile');
      }

      const {user} = response.data.data;
      
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Profile update error:', error);
      
      // If it's an axios error, extract the message
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<ApiResponse<AvatarUploadResponse>>('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to upload avatar');
      }

      const {user} = response.data.data;
      
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Avatar upload error:', error);
      
      // If it's an axios error, extract the message
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to upload avatar');
    }
  }

  // Remove avatar
  async removeAvatar(): Promise<User> {
    try {
      const response = await api.delete<ApiResponse<AvatarUploadResponse>>('/user/avatar');
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to remove avatar');
      }

      const {user} = response.data.data;
      
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Avatar removal error:', error);
      
      // If it's an axios error, extract the message
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to remove avatar');
    }
  }

  // Change password
  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      const response = await api.post<ApiResponse<PasswordChangeResponse>>('/user/change-password', passwordData);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      // If it's an axios error, extract the message
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  }

  // Get user profile (in case we need to refresh)
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/user/profile');
      
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Failed to get profile');
      }

      const {user} = response.data.data;
      
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      
      // If it's an axios error, extract the message
      if (isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to get profile');
    }
  }
}

export const userService = new UserService();