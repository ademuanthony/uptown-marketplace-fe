import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import api from './api';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image_url?: string;
  firebase_uid?: string;
  permalink?: string;
  store_name?: string;
  role?: string;
  status?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  referralCode?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Backend API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Backend authentication response types
interface BackendAuthResponse {
  user: User;
  custom_token?: string;
  is_new_user: boolean;
  message: string;
}

interface BackendRegisterResponse {
  user: User;
  message: string;
}

class AuthService {

  // Firebase Authentication Methods
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      const firebaseResult = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const token = await firebaseResult.user.getIdToken();

      const response = await api.post<ApiResponse<BackendAuthResponse>>('/auth/login', {
        firebase_token: token,
      });

      // The backend returns: { success: true, data: AuthenticateUserResponse }
      const result = response.data;

      if (!result || !result.success || !result.data) {
        throw new Error(result.message || 'Login failed');
      }

      // Extract the authentication response data
      const authData = result.data;
      const {user} = authData;

      // Store token and user data
      // Use custom_token if available, otherwise use Firebase token
      const authToken = authData.custom_token || token;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, token: authToken };

    } catch (firebaseError) {
      console.error('Authentication failed:', firebaseError);
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Login failed';
      throw new Error(errorMessage);
    }
  }

  async signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      if (!auth) {
        throw new Error('Firebase not initialized');
      }

      const firebaseResult = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const token = await firebaseResult.user.getIdToken();

      try {
        // Send token to backend to create user record
        const registerPayload: Record<string, unknown> = {
          firebase_uid: firebaseResult.user.uid,
          email: credentials.email,
          first_name: firebaseResult.user.displayName?.split(' ')[0] || 'User',
          last_name: firebaseResult.user.displayName?.split(' ')[1] || 'Name',
        };

        // Add referral code if provided
        if (credentials.referralCode) {
          registerPayload.upline_code = credentials.referralCode;
        }

        const response = await api.post<ApiResponse<BackendRegisterResponse>>('/auth/register', registerPayload);

        // The backend returns: { success: true, data: RegisterUserResponse }
        const result = response.data;

        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Registration failed');
        }

        // Extract the registration response data
        const registerData = result.data;
        const {user} = registerData;

        // Store token and user data
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token };
      } catch (backendError) {
        const errorMessage = backendError instanceof Error ? backendError.message : 'Registration failed';
        console.error('Backend registration failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Registration failed';
      console.error('Firebase registration failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async signOut(): Promise<void> {
    try {
      // Clear local storage first
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      // Sign out from Firebase
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      throw new Error(errorMessage);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Password reset failed';
      throw new Error(errorMessage);
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const provider = new GoogleAuthProvider();
      const firebaseResult = await signInWithPopup(auth, provider);

      const token = await firebaseResult.user.getIdToken();

      try {
        // Send token to backend
        const response = await api.post<ApiResponse<BackendAuthResponse>>('/auth/login', {
          firebase_token: token,
        });

        // The backend returns: { success: true, data: AuthenticateUserResponse }
        const result = response.data;
        
        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Social login failed');
        }

        const authData = result.data;
        const {user} = authData;
        const authToken = authData.custom_token || token;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token: authToken };
      } catch (backendError) {
        const errorMessage = backendError instanceof Error ? backendError.message : 'Social login failed';
        throw new Error(errorMessage);
      }
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Google login failed';
      throw new Error(errorMessage);
    }
  }

  async signInWithFacebook(): Promise<AuthResponse> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const provider = new FacebookAuthProvider();
      const firebaseResult = await signInWithPopup(auth, provider);

      const token = await firebaseResult.user.getIdToken();

      try {
        // Send token to backend
        const response = await api.post<ApiResponse<BackendAuthResponse>>('/auth/login', {
          firebase_token: token,
        });

        // The backend returns: { success: true, data: AuthenticateUserResponse }
        const result = response.data;
        
        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Social login failed');
        }

        const authData = result.data;
        const {user} = authData;
        const authToken = authData.custom_token || token;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token: authToken };
      } catch (backendError) {
        const errorMessage = backendError instanceof Error ? backendError.message : 'Social login failed';
        throw new Error(errorMessage);
      }
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Facebook login failed';
      throw new Error(errorMessage);
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    return onAuthStateChanged(auth, callback);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const {currentUser} = auth;
      if (!currentUser) {
        const existingUser = localStorage.getItem('user');
        return existingUser ? JSON.parse(existingUser) : null;
      }

      const token = await currentUser.getIdToken();

      try {
        // Get user data from backend
        const response = await api.get<ApiResponse<{ user: User }>>(
          '/auth/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // The backend returns: { success: true, data: GetUserProfileResponse }
        const result = response.data;
        
        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Failed to get user data');
        }

        return result.data.user;
      } catch (backendError) {
        const errorMessage = backendError instanceof Error ? backendError.message : 'Failed to get user data';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
      throw new Error(errorMessage);
    }
  }

  async refreshToken(): Promise<string | null> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const {currentUser} = auth;
      if (!currentUser) {
        return localStorage.getItem('auth_token');
      }

      const token = await currentUser.getIdToken(true); // Force refresh
      localStorage.setItem('auth_token', token);

      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      throw new Error(errorMessage);
    }
  }
}

export const authService = new AuthService();
