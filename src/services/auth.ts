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
  firstName: string;
  lastName: string;
  phoneNumber?: string;
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
  custom_token?: string;
  message: string;
}

// Error types for better typing
interface ApiError {
  response?: {
    status: number;
    data: {
      message?: string;
      error?: {
        message?: string;
        code?: string;
      };
      code?: string;
    };
  };
  message: string;
}

interface FirebaseAuthError {
  code: string;
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

      const response = await api.post<ApiResponse<BackendAuthResponse>>('/users/authenticate', {
        firebase_token: token,
      });

      // The backend returns: { success: true, data: AuthenticateUserResponse }
      const result = response.data;

      if (!result || !result.success || !result.data) {
        throw new Error(result.message || 'Login failed');
      }

      // Extract the authentication response data
      const authData = result.data;
      const { user } = authData;

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

      // First create Firebase user
      const firebaseResult = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      const token = await firebaseResult.user.getIdToken();

      // Prepare registration payload for backend
      const registrationPayload = {
        email: credentials.email,
        firebase_uid: firebaseResult.user.uid,
        first_name: credentials.firstName,
        last_name: credentials.lastName,
        phone_number: credentials.phoneNumber || '',
        upline_code: credentials.referralCode || '',
      };

      try {
        // Send registration request to backend
        const response = await api.post<ApiResponse<BackendRegisterResponse>>(
          '/users/register',
          registrationPayload,
        );

        // The backend returns: { success: true, data: RegisterUserResponse }
        const result = response.data;

        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Registration failed');
        }

        // Extract the registration response data
        const registerData = result.data;
        const { user, custom_token, message } = registerData;

        // Store token and user data
        // Use custom_token if available, otherwise use Firebase token
        const authToken = custom_token || token;
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        console.info('Registration successful:', message);

        return { user, token: authToken };
      } catch (backendError: unknown) {
        // Extract detailed error information
        const errorResponse = (backendError as ApiError)?.response?.data;
        const errorMessage =
          errorResponse?.message ||
          errorResponse?.error?.message ||
          (typeof errorResponse?.error === 'string' ? errorResponse.error : '') ||
          (backendError as Error)?.message ||
          'Registration failed';

        console.error('Backend registration failed:', {
          status: (backendError as ApiError)?.response?.status,
          data: errorResponse,
          message: errorMessage,
        });

        // Check for duplicate user errors
        const errorStr =
          typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        if (
          errorStr.toLowerCase().includes('already exists') ||
          errorStr.toLowerCase().includes('duplicate') ||
          (backendError as ApiError)?.response?.status === 409
        ) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }

        throw new Error(errorStr);
      }
    } catch (firebaseError: unknown) {
      const errorMessage = (firebaseError as Error)?.message || 'Registration failed';
      console.error('Firebase registration failed:', errorMessage);

      // Check for Firebase duplicate email error
      if ((firebaseError as FirebaseAuthError)?.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

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
      const errorMessage =
        firebaseError instanceof Error ? firebaseError.message : 'Password reset failed';
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
        const response = await api.post<ApiResponse<BackendAuthResponse>>('/users/authenticate', {
          firebase_token: token,
        });

        // The backend returns: { success: true, data: AuthenticateUserResponse }
        const result = response.data;

        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Social login failed');
        }

        const authData = result.data;
        const { user } = authData;
        const authToken = authData.custom_token || token;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token: authToken };
      } catch (backendError) {
        const errorMessage =
          backendError instanceof Error ? backendError.message : 'Social login failed';
        throw new Error(errorMessage);
      }
    } catch (firebaseError) {
      const errorMessage =
        firebaseError instanceof Error ? firebaseError.message : 'Google login failed';
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
        const response = await api.post<ApiResponse<BackendAuthResponse>>('/users/authenticate', {
          firebase_token: token,
        });

        // The backend returns: { success: true, data: AuthenticateUserResponse }
        const result = response.data;

        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Social login failed');
        }

        const authData = result.data;
        const { user } = authData;
        const authToken = authData.custom_token || token;

        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(user));

        return { user, token: authToken };
      } catch (backendError) {
        const errorMessage =
          backendError instanceof Error ? backendError.message : 'Social login failed';
        throw new Error(errorMessage);
      }
    } catch (firebaseError) {
      const errorMessage =
        firebaseError instanceof Error ? firebaseError.message : 'Facebook login failed';
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
      const { currentUser } = auth;
      if (!currentUser) {
        const existingUser = localStorage.getItem('user');
        return existingUser ? JSON.parse(existingUser) : null;
      }

      const token = await currentUser.getIdToken();

      try {
        // Get user data from backend
        const response = await api.get<ApiResponse<{ user: User }>>('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // The backend returns: { success: true, data: GetUserProfileResponse }
        const result = response.data;

        if (!result || !result.success || !result.data) {
          throw new Error(result.message || 'Failed to get user data');
        }

        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(result.data.user));

        return result.data.user;
      } catch (backendError: unknown) {
        // Extract more detailed error information
        const errorResponse = (backendError as ApiError)?.response?.data;
        const errorMessage =
          errorResponse?.message ||
          errorResponse?.error?.message ||
          (typeof errorResponse?.error === 'string' ? errorResponse.error : '') ||
          (backendError as Error)?.message ||
          'Failed to get user data';

        // Include error code if available
        const errorCode = errorResponse?.code || errorResponse?.error?.code;
        const errorStr =
          typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        const fullErrorMessage = errorCode ? `${errorStr} (${errorCode})` : errorStr;

        console.error('Backend error in getCurrentUser:', {
          status: (backendError as ApiError)?.response?.status,
          data: errorResponse,
          message: errorMessage,
          code: errorCode,
        });

        throw new Error(fullErrorMessage);
      }
    } catch (error: unknown) {
      // Don't wrap already processed errors
      if ((error as Error).message && (error as Error).message !== 'Failed to get current user') {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
      throw new Error(errorMessage);
    }
  }

  async refreshToken(): Promise<string | null> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }

    try {
      const { currentUser } = auth;
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
