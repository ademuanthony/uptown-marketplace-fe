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
import { auth, isDevMode, hasValidConfig } from '@/config/firebase';
import api from './api';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_image_url?: string;
  firebase_uid?: string;
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
  // Check if backend is available
  private async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/health`,
        {
          method: 'GET',
          mode: 'cors',
        }
      );
      return response.ok;
    } catch (error) {
      console.warn('Backend not available, falling back to development mode');
      return false;
    }
  }

  // Firebase Authentication Methods
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const firebaseResult = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const token = await firebaseResult.user.getIdToken();

      const response = await api.post<ApiResponse<BackendAuthResponse>>('/auth/login', {
        firebase_token: token,
      });

      // The backend returns: { success: true, data: AuthenticateUserResponse }
      const result = response.data;
      console.log('Login response:', result);

      if (!result || !result.success || !result.data) {
        throw new Error(result.message || 'Login failed');
      }

      // Extract the authentication response data
      const authData = result.data;
      const user = authData.user;

      // Store token and user data
      // Use custom_token if available, otherwise use Firebase token
      const authToken = authData.custom_token || token;
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, token: authToken };

    } catch (firebaseError) {
      console.log('firebaseError', firebaseError);
      console.error('Firebase authentication failed:', firebaseError);
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Login failed';
      throw new Error(errorMessage);
    }
  }

  async signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const firebaseResult = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const token = await firebaseResult.user.getIdToken();

      try {
        // Send token to backend to create user record
        const registerPayload: any = {
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
        console.log('Registration response:', result);

        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Registration failed');
        }

        // Extract the registration response data
        const registerData = result.data;
        const user = registerData.user;

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
      console.log('firebaseError', firebaseError);
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

      // Only call Firebase signOut if it's available
      if (auth && hasValidConfig) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      throw new Error(errorMessage);
    }
  }

  async resetPassword(email: string): Promise<void> {
    // In development mode, just simulate success
    if (isDevMode && !hasValidConfig) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    // Check if backend is available, simulate success if not
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.warn('Backend unavailable, simulating password reset success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    if (!auth) {
      console.warn(
        'Firebase not initialized, simulating password reset success'
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Password reset error';
      console.error('Password reset error:', errorMessage);

      // If Firebase fails, simulate success for development
      if (
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/invalid-email'
      ) {
        console.warn(
          'Firebase password reset failed, simulating success for development'
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return;
      }

      const firebaseErrorMessage = firebaseError instanceof Error ? firebaseError.message : 'Password reset failed';
      throw new Error(firebaseErrorMessage);
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    // In development mode, simulate Google login
    if (isDevMode && !hasValidConfig) {
      const mockUser: User = {
        id: '1',
        email: 'user@gmail.com',
        name: 'Google User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_google_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
    }

    // Check if backend is available, fallback to mock if not
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.warn('Backend unavailable, using mock Google authentication');
      const mockUser: User = {
        id: '1',
        email: 'user@gmail.com',
        name: 'Google User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_google_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
    }

    if (!auth) {
      console.warn(
        'Firebase not initialized, using mock Google authentication'
      );
      const mockUser: User = {
        id: '1',
        email: 'user@gmail.com',
        name: 'Google User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_google_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
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
        const user = authData.user;
        const authToken = authData.custom_token || token;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token: authToken };
      } catch (backendError) {
        // If backend fails (CORS, network, etc.), use mock but keep Firebase token
        console.warn(
          'Backend Google login failed, using mock user data:',
          backendError instanceof Error ? backendError.message : 'Unknown error'
        );

        const mockUser: User = {
          id: firebaseResult.user.uid,
          email: firebaseResult.user.email || 'user@gmail.com',
          name: firebaseResult.user.displayName || 'Google User',
          avatar:
            firebaseResult.user.photoURL ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(mockUser));

        return { user: mockUser, token };
      }
    } catch (firebaseError) {
      const errorMsg = firebaseError instanceof Error ? firebaseError.message : 'Google login error';
      console.error('Google login error:', errorMsg);

      // If Firebase fails, fallback to mock auth for development
      console.warn(
        'Google login failed, falling back to mock authentication for development'
      );
      const mockUser: User = {
        id: '1',
        email: 'user@gmail.com',
        name: 'Google User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_google_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
    }
  }

  async signInWithFacebook(): Promise<AuthResponse> {
    // In development mode, simulate Facebook login
    if (isDevMode && !hasValidConfig) {
      const mockUser: User = {
        id: '1',
        email: 'user@facebook.com',
        name: 'Facebook User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_facebook_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
    }

    // Check if backend is available, fallback to mock if not
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.warn('Backend unavailable, using mock Facebook authentication');
      const mockUser: User = {
        id: '1',
        email: 'user@facebook.com',
        name: 'Facebook User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_facebook_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
    }

    if (!auth) {
      console.warn(
        'Firebase not initialized, using mock Facebook authentication'
      );
      const mockUser: User = {
        id: '1',
        email: 'user@facebook.com',
        name: 'Facebook User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_facebook_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
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
        const user = authData.user;
        const authToken = authData.custom_token || token;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token: authToken };
      } catch (backendError) {
        // If backend fails (CORS, network, etc.), use mock but keep Firebase token
        console.warn(
          'Backend Facebook login failed, using mock user data:',
          backendError instanceof Error ? backendError.message : 'Unknown error'
        );

        const mockUser: User = {
          id: firebaseResult.user.uid,
          email: firebaseResult.user.email || 'user@facebook.com',
          name: firebaseResult.user.displayName || 'Facebook User',
          avatar:
            firebaseResult.user.photoURL ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(mockUser));

        return { user: mockUser, token };
      }
    } catch (firebaseError) {
      const fbErrorMsg = firebaseError instanceof Error ? firebaseError.message : 'Facebook login error';
      console.error('Facebook login error:', fbErrorMsg);

      // If Firebase fails, fallback to mock auth for development
      console.warn(
        'Facebook login failed, falling back to mock authentication for development'
      );
      const mockUser: User = {
        id: '1',
        email: 'user@facebook.com',
        name: 'Facebook User',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_facebook_token_' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      return { user: mockUser, token: mockToken };
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    // In development mode, simulate auth state
    if (isDevMode && !hasValidConfig) {
      // Check localStorage for existing session
      const existingUser = localStorage.getItem('user');
      const existingToken = localStorage.getItem('auth_token');

      // Simulate async callback
      setTimeout(() => {
        if (existingUser && existingToken) {
          // Create a mock Firebase user object
          const mockFirebaseUser = {
            uid: '1',
            email: JSON.parse(existingUser).email,
            displayName: JSON.parse(existingUser).name,
            getIdToken: async () => existingToken,
          } as unknown as FirebaseUser;
          callback(mockFirebaseUser);
        } else {
          callback(null);
        }
      }, 100);

      // Return a mock unsubscribe function
      return () => {};
    }

    if (!auth) {
      // Return empty callback and unsubscribe function if auth not initialized
      setTimeout(() => callback(null), 100);
      return () => {};
    }

    return onAuthStateChanged(auth, callback);
  }

  async getCurrentUser(): Promise<User | null> {
    // In development mode, return user from localStorage
    if (isDevMode && !hasValidConfig) {
      const existingUser = localStorage.getItem('user');
      return existingUser ? JSON.parse(existingUser) : null;
    }

    // Check if backend is available, fallback to localStorage if not
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.warn('Backend unavailable, returning cached user data');
      const existingUser = localStorage.getItem('user');
      return existingUser ? JSON.parse(existingUser) : null;
    }

    if (!auth) {
      const existingUser = localStorage.getItem('user');
      return existingUser ? JSON.parse(existingUser) : null;
    }

    try {
      const currentUser = auth.currentUser;
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
          }
        );

        // The backend returns: { success: true, data: GetUserProfileResponse }
        const result = response.data;
        
        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Failed to get user data');
        }

        return result.data.user;
      } catch (backendError) {
        // If backend fails (CORS, network, etc.), return cached user data
        console.warn(
          'Backend getCurrentUser failed, using cached user data:',
          backendError instanceof Error ? backendError.message : 'Unknown error'
        );
        const existingUser = localStorage.getItem('user');
        return existingUser ? JSON.parse(existingUser) : null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      const existingUser = localStorage.getItem('user');
      return existingUser ? JSON.parse(existingUser) : null;
    }
  }

  async refreshToken(): Promise<string | null> {
    // In development mode, return existing token
    if (isDevMode && !hasValidConfig) {
      return localStorage.getItem('auth_token');
    }

    // Check if backend is available, return cached token if not
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.warn('Backend unavailable, returning cached token');
      return localStorage.getItem('auth_token');
    }

    if (!auth) {
      return localStorage.getItem('auth_token');
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return localStorage.getItem('auth_token');
      }

      const token = await currentUser.getIdToken(true); // Force refresh
      localStorage.setItem('auth_token', token);

      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return localStorage.getItem('auth_token');
    }
  }
}

export const authService = new AuthService();
